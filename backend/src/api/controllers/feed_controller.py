from src.api.controllers._service_loader import load_function
from src.shared.clients.cache_client import get_cached, set_cached

get_feeds = load_function("features/feed-builder/services/feed_service.py", "get_feeds")


async def get_homepage_feeds() -> dict:
    cache_key = "homepage:feeds"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    payload = get_feeds()
    set_cached(cache_key, payload)
    return payload
