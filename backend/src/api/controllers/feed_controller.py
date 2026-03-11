from datetime import datetime, timezone

from src.api.controllers._service_loader import load_function
from src.shared.clients.cache_client import get_cached, set_cached

get_feeds = load_function("features/feed-builder/services/feed_service.py", "get_feeds")
get_live_webcam_feeds = load_function("features/feed-builder/services/webcam_resolver.py", "get_live_webcam_feeds")


async def get_homepage_feeds() -> dict:
    cache_bucket = int(datetime.now(timezone.utc).timestamp() // 30)
    cache_key = f"homepage:feeds:{cache_bucket}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    payload = await get_feeds()
    set_cached(cache_key, payload)
    return payload


async def get_live_webcams(region: str = "all", limit: int = 4) -> dict:
    cache_bucket = int(datetime.now(timezone.utc).timestamp() // 90)
    cache_key = f"homepage:webcams:{region}:{limit}:{cache_bucket}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    payload = await get_live_webcam_feeds(region=region, limit=limit)
    set_cached(cache_key, payload)
    return payload
