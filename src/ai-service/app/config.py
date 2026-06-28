# =============================================================================
# config.py — Cấu hình toàn cục cho AI Service
# =============================================================================
# Load biến môi trường từ file .env và expose qua object Settings.
# Tất cả module khác import từ đây — không import dotenv trực tiếp ở nơi khác.

from dotenv import load_dotenv
import os

# Load file .env từ thư mục gốc của ai-service/
load_dotenv()


class Settings:
    """
    Tập trung toàn bộ cấu hình vào một class duy nhất.
    Dễ dàng mock trong unit test và mở rộng khi thêm cấu hình mới.
    """

    # ── Node.js Backend ───────────────────────────────────────────────────────
    NODE_API_URL: str = os.getenv("NODE_API_URL", "http://localhost:3000")
    AI_SERVICE_API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "")

    # ── FastAPI ───────────────────────────────────────────────────────────────
    AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # ── Node.js Data Endpoint Paths ───────────────────────────────────────────
    PRODUCTS_ENDPOINT: str = "/api/v1/recommend/data/products"
    RATINGS_ENDPOINT: str = "/api/v1/recommend/data/ratings"
    INTERACTIONS_ENDPOINT: str = "/api/v1/recommend/data/interactions"
    PURCHASES_ENDPOINT: str = "/api/v1/recommend/data/purchases"

    # ── HTTP Client ───────────────────────────────────────────────────────────
    # Timeout (giây) khi gọi Node.js — đủ lớn cho dataset lớn
    HTTP_TIMEOUT: float = 30.0

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def auth_headers(self) -> dict:
        """Header xác thực gửi kèm mọi request tới Node.js."""
        return {"x-api-key": self.AI_SERVICE_API_KEY}


# Singleton — import ở mọi nơi trong project
settings = Settings()
