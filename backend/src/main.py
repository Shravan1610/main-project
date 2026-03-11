"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import register_routes
from src.shared.clients import close_http_client
from src.shared.config import get_settings
from src.shared.utils import register_error_handlers

settings = get_settings()

app = FastAPI(title="GreenTrust Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
register_routes(app)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_http_client()
