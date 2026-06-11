#!/usr/bin/env python3
"""
run.py — Script khởi động FastAPI development server
Chạy lệnh: py run.py

Lưu ý: reload=False để tránh xung đột với background retrain thread.
  - Khi uvicorn reload, nó fork process mới và thread daemon từ process cũ
    có thể gây ra race condition / dead lock khi đang train model nặng CPU.
  - Để reload code mới: tắt server (Ctrl+C) rồi chạy lại `py run.py`.
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_SERVICE_PORT,
        reload=False,       # Tắt auto-reload để tránh xung đột với retrain thread
        log_level="info",
    )
