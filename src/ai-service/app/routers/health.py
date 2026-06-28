# =============================================================================
# routers/health.py — Health Check & Connectivity Test Endpoint
# =============================================================================

from fastapi import APIRouter, HTTPException
from app.data_fetcher import (
    fetch_products,
    fetch_ratings,
    fetch_interactions,
    fetch_purchases,
)

router = APIRouter()


@router.get("/health")
def health_check():
    """
    Kiểm tra trạng thái service: kết nối Node.js và lấy thử dữ liệu.

    Response:
    - status: "ok" | "degraded"
    - node_connected: bool
    - data_summary: Thống kê số lượng từng dataset
    - errors: Danh sách lỗi nếu có

    Dùng endpoint này để:
    1. Xác nhận FastAPI đang chạy.
    2. Xác nhận có thể fetch được data từ Node.js.
    3. Kiểm tra nhanh data có đủ để train model không.
    """
    errors = []
    data_summary = {}

    # ── 1. Products ───────────────────────────────────────────────────────────
    try:
        df_products = fetch_products()
        data_summary["products"] = {
            "count": len(df_products),
            "columns": list(df_products.columns) if not df_products.empty else [],
            "sample_title": df_products["title"].iloc[0] if not df_products.empty else None,
        }
    except Exception as e:
        errors.append(f"products: {str(e)}")
        data_summary["products"] = {"count": 0, "error": str(e)}

    # ── 2. Ratings ────────────────────────────────────────────────────────────
    try:
        df_ratings = fetch_ratings()
        data_summary["ratings"] = {
            "count": len(df_ratings),
            "unique_users": df_ratings["userId"].nunique() if not df_ratings.empty else 0,
            "unique_products": df_ratings["productId"].nunique() if not df_ratings.empty else 0,
            "avg_rating": round(df_ratings["rating"].mean(), 2) if not df_ratings.empty else None,
        }
    except Exception as e:
        errors.append(f"ratings: {str(e)}")
        data_summary["ratings"] = {"count": 0, "error": str(e)}

    # ── 3. Interactions ───────────────────────────────────────────────────────
    try:
        df_interactions = fetch_interactions(days=30)
        data_summary["interactions"] = {
            "count": len(df_interactions),
            "type_breakdown": (
                df_interactions["interactionType"].value_counts().to_dict()
                if not df_interactions.empty
                else {}
            ),
        }
    except Exception as e:
        errors.append(f"interactions: {str(e)}")
        data_summary["interactions"] = {"count": 0, "error": str(e)}

    # ── 4. Purchases ──────────────────────────────────────────────────────────
    try:
        df_purchases = fetch_purchases()
        data_summary["purchases"] = {
            "count": len(df_purchases),
            "unique_users": df_purchases["userId"].nunique() if not df_purchases.empty else 0,
            "total_quantity": int(df_purchases["quantity"].sum()) if not df_purchases.empty else 0,
        }
    except Exception as e:
        errors.append(f"purchases: {str(e)}")
        data_summary["purchases"] = {"count": 0, "error": str(e)}

    # ── Tổng hợp kết quả ──────────────────────────────────────────────────────
    node_connected = len(errors) == 0
    status = "ok" if node_connected else "degraded"

    return {
        "status": status,
        "service": "BookBee AI Recommendation Service",
        "node_api_url": "http://localhost:3000",  # Không expose key
        "node_connected": node_connected,
        "data_summary": data_summary,
        "errors": errors if errors else None,
        "message": (
            "✅ Tất cả data endpoints hoạt động tốt. Sẵn sàng train model!"
            if node_connected
            else f"⚠️ Có {len(errors)} lỗi khi fetch data. Kiểm tra Node.js server."
        ),
    }
