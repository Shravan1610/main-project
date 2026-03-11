"""Route registry for FastAPI."""

from fastapi import FastAPI

from src.api.routes.analyze_routes import router as analyze_router
from src.api.routes.compare_routes import router as compare_router
from src.api.routes.feed_routes import router as feed_router
from src.api.routes.health_routes import router as health_router
from src.api.routes.layer_routes import router as layer_router
from src.api.routes.search_routes import router as search_router


def register_routes(app: FastAPI) -> None:
    app.include_router(health_router)
    app.include_router(search_router)
    app.include_router(analyze_router)
    app.include_router(compare_router)
    app.include_router(feed_router)
    app.include_router(layer_router)
