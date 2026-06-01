#!/usr/bin/env python3
"""
run.py — Script khởi động FastAPI development server
Chạy lệnh: py run.py
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_SERVICE_PORT,
        reload=True,       # Auto-reload khi code thay đổi (dev mode)
        log_level="info",
    )
