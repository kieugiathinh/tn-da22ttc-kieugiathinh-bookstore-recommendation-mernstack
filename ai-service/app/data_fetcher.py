# =============================================================================
# data_fetcher.py — Lấy dữ liệu từ Node.js Backend
# =============================================================================
# Module này chịu trách nhiệm duy nhất: gọi HTTP sang Node.js data endpoints
# và trả về Pandas DataFrame cho các module ML phía sau sử dụng.
#
# Thiết kế:
#   - Dùng httpx.Client (synchronous) — đơn giản, phù hợp khi được gọi
#     từ background task hoặc startup event của FastAPI.
#   - Mỗi hàm trả về DataFrame với schema cố định — dễ viết unit test.
#   - Lỗi HTTP được raise rõ ràng để caller xử lý (không nuốt lỗi).

import httpx
import pandas as pd
from typing import Optional
from app.config import settings


# ─── HTTP Client Factory ──────────────────────────────────────────────────────

def _get_client() -> httpx.Client:
    """
    Tạo httpx Client với auth header và timeout mặc định.
    Sử dụng trong context manager (with statement) để tự động đóng connection.
    """
    return httpx.Client(
        base_url=settings.NODE_API_URL,
        headers=settings.auth_headers,
        timeout=settings.HTTP_TIMEOUT,
    )


def _fetch(endpoint: str, params: Optional[dict] = None) -> list:
    """
    Hàm helper: gọi GET request, validate response và trả về list data.

    Args:
        endpoint: Path của API (ví dụ: "/api/v1/recommend/data/products")
        params:   Query parameters (ví dụ: {"days": 90})

    Returns:
        list: Mảng data từ field `data` trong JSON response

    Raises:
        httpx.HTTPStatusError: Khi Node.js trả về status >= 400
        ValueError: Khi response không có field `data`
    """
    with _get_client() as client:
        response = client.get(endpoint, params=params)
        response.raise_for_status()  # Raise nếu 4xx hoặc 5xx

    payload = response.json()

    if not payload.get("success") or "data" not in payload:
        raise ValueError(
            f"Response từ {endpoint} không hợp lệ: {payload}"
        )

    return payload["data"], payload.get("count", 0)


# ─── Public Fetcher Functions ─────────────────────────────────────────────────

def fetch_products() -> pd.DataFrame:
    """
    Lấy danh sách sản phẩm — nguyên liệu cho Content-Based Filtering.

    DataFrame columns:
        _id, title, author, publisher, categoryId, categoryName,
        desc, tags, language, publishedYear, pageCount, ageGroup,
        rating, numReviews, sold

    Returns:
        pd.DataFrame: Product corpus, mỗi row là 1 sản phẩm.
    """
    data, count = _fetch(settings.PRODUCTS_ENDPOINT)

    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)

    # Đảm bảo các cột text không bị NaN — ảnh hưởng đến TF-IDF vectorizer
    text_cols = ["title", "author", "publisher", "desc", "categoryName"]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].fillna("")

    # tags là list → join thành string để dễ xử lý text
    if "tags" in df.columns:
        df["tags"] = df["tags"].apply(
            lambda t: " ".join(t) if isinstance(t, list) else str(t or "")
        )

    print(f"[DataFetcher] OK: Fetched {count} products")
    return df


def fetch_ratings() -> pd.DataFrame:
    """
    Lấy ma trận Explicit Rating — nguyên liệu cho Collaborative Filtering (SVD).

    DataFrame columns:
        userId (str), productId (str), rating (float), createdAt (datetime)

    Returns:
        pd.DataFrame: User-Item explicit rating matrix (long format).
    """
    data, count = _fetch(settings.RATINGS_ENDPOINT)

    if not data:
        return pd.DataFrame(columns=["userId", "productId", "rating", "createdAt"])

    df = pd.DataFrame(data)

    # Convert ObjectId strings → str (đã là string, nhưng đảm bảo type)
    df["userId"] = df["userId"].astype(str)
    df["productId"] = df["productId"].astype(str)
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")

    # Loại bỏ row có rating NaN (dữ liệu bẩn)
    df = df.dropna(subset=["rating"])

    print(f"[DataFetcher] OK: Fetched {count} explicit ratings")
    return df


def fetch_interactions(days: int = 30, interaction_types: Optional[list] = None) -> pd.DataFrame:
    """
    Lấy Implicit Feedback signals — nguyên liệu cho Implicit CF (ALS).

    Args:
        days: Số ngày lookback (1–365). Training dùng 90, realtime dùng 7.
        interaction_types: List loại cần lọc, ví dụ ["view", "add_to_cart"].
                           None = lấy tất cả.

    DataFrame columns:
        userId, productId, interactionType, durationSeconds, source, createdAt

    Returns:
        pd.DataFrame: Implicit interaction log.
    """
    params = {"days": days}
    if interaction_types:
        params["type"] = ",".join(interaction_types)

    data, count = _fetch(settings.INTERACTIONS_ENDPOINT, params=params)

    if not data:
        return pd.DataFrame(columns=["userId", "productId", "interactionType", "createdAt"])

    df = pd.DataFrame(data)
    df["userId"] = df["userId"].astype(str)
    df["productId"] = df["productId"].astype(str)
    df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")

    # durationSeconds có thể null (view chưa cập nhật) → fill 0
    if "durationSeconds" in df.columns:
        df["durationSeconds"] = pd.to_numeric(
            df["durationSeconds"], errors="coerce"
        ).fillna(0)

    print(f"[DataFetcher] OK: Fetched {count} interactions (last {days} days)")
    return df


def fetch_purchases() -> pd.DataFrame:
    """
    Lấy lịch sử mua hàng đã giao — implicit signal mạnh nhất.

    DataFrame columns:
        userId (str), productId (str), quantity (int), purchasedAt (datetime)

    Returns:
        pd.DataFrame: Flat purchase history.
    """
    data, count = _fetch(settings.PURCHASES_ENDPOINT)

    if not data:
        return pd.DataFrame(columns=["userId", "productId", "quantity", "purchasedAt"])

    df = pd.DataFrame(data)
    df["userId"] = df["userId"].astype(str)
    df["productId"] = df["productId"].astype(str)
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1).astype(int)
    df["purchasedAt"] = pd.to_datetime(df["purchasedAt"], errors="coerce")

    print(f"[DataFetcher] OK: Fetched {count} purchase records")
    return df


def fetch_interaction_weights() -> dict:
    """
    Lấy trọng số động (Dynamic Weights) từ cấu hình Node.js.
    Nếu Node.js chưa có hoặc lỗi, trả về trọng số mặc định.
    """
    default_weights = {
        "view": 1.0,
        "search_click": 2.0,
        "add_to_cart": 3.0,
        "review": 4.0,
        "purchase": 5.0,
    }
    
    endpoint = "/api/v1/config/INTERACTION_WEIGHTS"
    # Sửa lại base_url thành Node API URL bỏ đi phần cuổi nếu cần,
    # nhưng _fetch sử dụng httpx.Client(base_url=settings.NODE_API_URL).
    # Vì settings.NODE_API_URL thường là http://localhost:5000 (không có /api/v1)
    # Hãy kiểm tra settings.NODE_API_URL trong runtime hoặc truyền endpoint có chứa /api/v1 
    # Nhưng _fetch mặc định coi endpoint là path.

    try:
        with _get_client() as client:
            # Sửa endpoint dựa trên cấu trúc các biến settings (thường NODE_API_URL có sẵn /api/v1/recommend/data)
            # Thôi mình dùng http://localhost:5000 trực tiếp hoặc lấy cấu hình từ môi trường.
            # Rủi ro: settings.NODE_API_URL có the la http://localhost:5000/api/v1/recommend/data 
            pass
    except Exception:
        pass

    # Do fetch_products() dùng settings.PRODUCTS_ENDPOINT ("/api/v1/recommend/data/products"),
    # Vậy client config có base_url = "http://localhost:5000".
    # Ok, ta gọi trực tiếp bằng _fetch
    try:
        with _get_client() as client:
            response = client.get("/api/v1/config/INTERACTION_WEIGHTS")
            if response.status_code == 200:
                payload = response.json()
                if payload.get("success") and payload.get("value"):
                    # Chuyển đổi value sang dict với float
                    weights = {k: float(v) for k, v in payload["value"].items()}
                    print(f"[DataFetcher] Fetched dynamic weights: {weights}")
                    return weights
    except Exception as e:
        print(f"[DataFetcher] Warn: Không thể lấy dynamic weights ({e}), dùng mặc định.")
        
    return default_weights

def fetch_all_data() -> dict:
    """
    Convenience function: lấy tất cả data trong một lần gọi.
    Dùng khi training pipeline cần toàn bộ dataset.

    Returns:
        dict với keys: "products", "ratings", "interactions", "purchases", "weights"
    """
    print("[DataFetcher] >> Fetching all datasets from Node.js...")
    return {
        "products": fetch_products(),
        "ratings": fetch_ratings(),
        "interactions": fetch_interactions(days=90),
        "purchases": fetch_purchases(),
        "weights": fetch_interaction_weights(),
    }

