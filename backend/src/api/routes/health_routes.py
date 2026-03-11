"""Health route for backend readiness checks."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
@router.get("/health")
async def get_health() -> dict[str, str]:
    """Return a simple service heartbeat payload."""
    return {"status": "ok", "version": "0.1.0"}
