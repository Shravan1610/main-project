from fastapi import APIRouter

from src.api.controllers.feed_controller import get_homepage_feeds, get_live_webcams

router = APIRouter()


@router.get("/feeds")
async def feeds() -> dict:
    return await get_homepage_feeds()


@router.get("/feeds/webcams")
async def live_webcams(region: str = "all", limit: int = 4) -> dict:
    return await get_live_webcams(region=region, limit=limit)
