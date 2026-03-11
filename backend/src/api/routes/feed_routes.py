from fastapi import APIRouter

from src.api.controllers.feed_controller import get_homepage_feeds

router = APIRouter()


@router.get("/feeds")
async def feeds() -> dict:
    return await get_homepage_feeds()
