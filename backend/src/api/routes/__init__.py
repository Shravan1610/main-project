"""Route registry for FastAPI."""

from fastapi import FastAPI

from src.api.routes.analyze_routes import router as analyze_router
from src.api.routes.brief_routes import router as brief_router
from src.api.routes.compare_routes import router as compare_router
from src.api.routes.document_analyzer_routes import router as document_analyzer_router
from src.api.routes.evidence_routes import router as evidence_router
from src.api.routes.feed_routes import router as feed_router
from src.api.routes.health_routes import router as health_router
from src.api.routes.layer_routes import router as layer_router
from src.api.routes.search_routes import router as search_router
from src.api.routes.voice_agent_routes import router as voice_agent_router


def register_routes(app: FastAPI) -> None:
    app.include_router(health_router)
    app.include_router(search_router)
    app.include_router(analyze_router)
    app.include_router(brief_router)
    app.include_router(compare_router)
    app.include_router(document_analyzer_router)
    app.include_router(evidence_router)
    app.include_router(feed_router)
    app.include_router(layer_router)
    app.include_router(voice_agent_router)
