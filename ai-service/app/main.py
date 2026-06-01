"""
main.py — FastAPI Application Entry Point
==========================================
Lifespan:
    1. Ping Node.js để kiểm tra kết nối.
    2. Fetch product data từ Node.js.
    3. Fit ContentBasedRecommender và lưu vào app.state.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx

from app.config import settings
from app.routers import health, recommend
from app.data_fetcher import fetch_products, fetch_ratings
from app.recommenders.content_based import ContentBasedRecommender
from app.recommenders.collaborative import CollaborativeRecommender


# ─── Lifespan (startup / shutdown) ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
        1. Ping Node.js (connectivity check).
        2. Fetch products DataFrame.
        3. Fit ContentBasedRecommender → lưu vào app.state.cbf_model.
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
    app.state.cf_model = None

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

    # ── Bước 4: Load ratings và fit Collaborative Filtering model ─────────────
    try:
        print("\n  [CF]    Bat dau load ratings data va fit SVD model...")
        df_ratings = fetch_ratings()

        cf = CollaborativeRecommender(n_factors=50, n_epochs=30)
        cf.fit(df_ratings)

        app.state.cf_model = cf
        print(f"  [CF]    Model san sang. {cf.rating_count} ratings | {cf.user_count} users | {cf.item_count} items.")

    except Exception as e:
        print(f"  [ERROR] Khong the fit CF model: {e}")
        print("  [WARN]  /recommend/user endpoint se tra ve 503 cho den khi fix loi.")

    print("=" * 60)
    print("  [OK]    Service da san sang!")
    print(f"  [DOCS]  Swagger UI: http://localhost:{settings.AI_SERVICE_PORT}/docs")
    print("=" * 60)

    yield  # ── Server đang chạy ──────────────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────────────────
    print("\n  [STOP]  BookBee AI Service dang tat...")
    app.state.cbf_model = None


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="BookBee AI Recommendation Service",
    description=(
        "Microservice Hybrid Recommendation System "
        "(Content-Based TF-IDF + Collaborative Filtering SVD) "
        "cho ung dung BookBee Bookstore."
    ),
    version="1.0.0",
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
