"""
main.py — FastAPI Application Entry Point
==========================================
Lifespan:
    1. Ping Node.js để kiểm tra kết nối.
    2. Fetch product data từ Node.js.
    3. Fit ContentBasedRecommender và lưu vào app.state.
    4. Fit CollaborativeRecommender với cả explicit + implicit signals.
    5. Khởi động APScheduler để retrain CF model định kỳ mỗi 6 giờ.

[v2] Retrain tự động:
    - Mỗi 6 giờ, CF model fetch lại toàn bộ ratings + interactions + purchases
      rồi retrain từ đầu — đảm bảo gợi ý luôn phản ánh hành vi mới nhất.
    - Endpoint POST /api/v1/recommend/retrain để trigger thủ công (admin).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
import threading
import time

from app.config import settings
from app.routers import health, recommend
from app.data_fetcher import fetch_products, fetch_ratings, fetch_interactions, fetch_purchases
from app.recommenders.content_based import ContentBasedRecommender
from app.recommenders.collaborative import CollaborativeRecommender


# ─── Retrain Logic (chạy trong background thread) ────────────────────────────

def _fit_cf_model() -> CollaborativeRecommender:
    """
    Fetch data và fit CF model. Trả về model mới đã fit.
    Được gọi cả lúc startup và khi retrain định kỳ.

    Raises:
        Exception: Nếu không đủ dữ liệu hoặc Node.js không phản hồi.
    """
    from app.data_fetcher import fetch_interaction_weights

    print("\n  [CF]    >> Bat dau fetch data va fit CF model...")

    # Fetch 1 lần duy nhất, tránh double-request gây WinError 10054
    df_ratings      = fetch_ratings()
    df_interactions = fetch_interactions(days=90)
    df_purchases    = fetch_purchases()
    weights         = fetch_interaction_weights()

    print(f"  [CF]    Explicit ratings  : {len(df_ratings)}")
    print(f"  [CF]    Interactions      : {len(df_interactions)}")
    print(f"  [CF]    Purchases         : {len(df_purchases)}")

    cf = CollaborativeRecommender(n_factors=50, n_epochs=30)
    cf.fit(
        df_ratings=df_ratings,
        df_interactions=df_interactions,
        df_purchases=df_purchases,
        weights=weights,
    )

    return cf


def _retrain_cf_worker(app_state, retrain_interval_seconds: int = 6 * 3600):
    """
    Background thread: retrain CF model định kỳ.

    Args:
        app_state:                 FastAPI app.state object để cập nhật cf_model.
        retrain_interval_seconds:  Khoảng cách giữa các lần retrain (mặc định 6 giờ).
    """
    print(f"  [Scheduler] CF retrain thread started. Interval: {retrain_interval_seconds // 3600}h")

    while True:
        time.sleep(retrain_interval_seconds)

        print("\n  [Scheduler] >> Bat dau retrain CF model dinh ky...")
        try:
            new_cf = _fit_cf_model()
            app_state.cf_model = new_cf  # Atomic assignment — thread safe với Python GIL
            print(
                f"  [Scheduler] CF retrain thanh cong: "
                f"{new_cf.rating_count} ratings "
                f"({new_cf.explicit_count} explicit + {new_cf.implicit_count} implicit) | "
                f"{new_cf.user_count} users | {new_cf.item_count} items"
            )
        except Exception as e:
            print(f"  [Scheduler] CF retrain that bai: {e}")
            print("  [Scheduler] Giu nguyen model cu den lan retrain tiep theo.")


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
        1. Ping Node.js (connectivity check).
        2. Fetch products DataFrame.
        3. Fit ContentBasedRecommender → lưu vào app.state.cbf_model.
        4. Fit CollaborativeRecommender với explicit + implicit → app.state.cf_model.
        5. Khởi động background thread retrain CF mỗi 6 giờ.
    Shutdown:
        Giải phóng tài nguyên (model, connection pool).
    """
    print("=" * 60)
    print("  [START] BookBee AI Recommendation Service dang khoi dong...")
    print(f"  [API]   Node.js Backend: {settings.NODE_API_URL}")
    print(f"  [ENV]   Moi truong: {settings.ENVIRONMENT}")
    print("=" * 60)

    # ── Bước 1: Ping Node.js ──────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.NODE_API_URL}/api/v1/recommend/data/products",
                headers=settings.auth_headers,
            )
            if resp.status_code == 200:
                count = resp.json().get("count", "?")
                print(f"  [OK]    Ket noi Node.js thanh cong -- {count} san pham trong DB")
            else:
                print(f"  [WARN]  Node.js phan hoi voi status {resp.status_code}")
    except Exception as e:
        print(f"  [ERROR] Khong the ket noi Node.js: {e}")
        print("  [WARN]  Service van khoi dong -- model se load that bai")

    # ── Bước 2 & 3: Load data và fit Content-Based model ─────────────────────
    app.state.cbf_model = None
    app.state.cf_model  = None

    try:
        print("\n  [CBF]   Bat dau load product data va fit model...")
        df_products = fetch_products()

        cbf = ContentBasedRecommender()
        cbf.fit(df_products)

        app.state.cbf_model = cbf
        print(f"  [CBF]   Model san sang. Da index {cbf.product_count} san pham.")

    except Exception as e:
        print(f"  [ERROR] Khong the fit CBF model: {e}")
        print("  [WARN]  /recommend/item endpoint se tra ve 503 cho den khi fix loi.")

    # ── Bước 4: Load ALL signals và fit Collaborative Filtering model ─────────
    try:
        new_cf = _fit_cf_model()
        app.state.cf_model = new_cf
        print(
            f"  [CF]    Model san sang. "
            f"{new_cf.rating_count} ratings "
            f"({new_cf.explicit_count} explicit + {new_cf.implicit_count} implicit) | "
            f"{new_cf.user_count} users | {new_cf.item_count} items."
        )
    except Exception as e:
        print(f"  [ERROR] Khong the fit CF model: {e}")
        print("  [WARN]  /recommend/user endpoint se tra ve 503 cho den khi fix loi.")

    # ── Bước 5: Khởi động background retrain thread (6 giờ / lần) ────────────
    retrain_thread = threading.Thread(
        target=_retrain_cf_worker,
        args=(app.state, 6 * 3600),
        daemon=True,        # Daemon: tự tắt khi main process tắt
        name="CF-Retrain",
    )
    retrain_thread.start()
    print("  [Scheduler] CF auto-retrain thread started (interval: 6h).")

    print("=" * 60)
    print("  [OK]    Service da san sang!")
    print(f"  [DOCS]  Swagger UI: http://localhost:{settings.AI_SERVICE_PORT}/docs")
    print("=" * 60)

    yield  # ── Server đang chạy ──────────────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────────────────
    print("\n  [STOP]  BookBee AI Service dang tat...")
    app.state.cbf_model = None
    app.state.cf_model  = None


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="BookBee AI Recommendation Service",
    description=(
        "Microservice Hybrid Recommendation System "
        "(Content-Based TF-IDF + Collaborative Filtering SVD) "
        "cho ung dung BookBee Bookstore. [v2] Ho tro implicit signals."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

ALLOWED_ORIGINS = [
    "http://localhost:3000",   # Node.js backend
    "http://localhost:5173",   # React Frontend (Vite)
    "http://localhost:1301",   # React Admin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(recommend.router, prefix="/api/v1", tags=["Recommendations"])
