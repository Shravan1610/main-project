from datetime import datetime, timezone

from src.shared.clients.cache_client import get_cached, set_cached


async def get_map_layers() -> dict:
    cache_key = "map:layers"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    exchanges = [
        {"id": "nyse", "kind": "exchange", "label": "NYSE", "coordinates": {"lat": 40.7069, "lng": -74.0113}},
        {"id": "nasdaq", "kind": "exchange", "label": "NASDAQ", "coordinates": {"lat": 40.7549, "lng": -73.984}},
        {"id": "lse", "kind": "exchange", "label": "London Stock Exchange", "coordinates": {"lat": 51.5155, "lng": -0.0922}},
        {"id": "tse", "kind": "exchange", "label": "Tokyo Stock Exchange", "coordinates": {"lat": 35.6824, "lng": 139.7741}},
    ]
    climate = [
        {"id": "climate-1", "kind": "climate", "label": "Heat stress alert", "coordinates": {"lat": 28.6, "lng": 77.2}},
        {"id": "climate-2", "kind": "climate", "label": "Storm risk corridor", "coordinates": {"lat": 25.8, "lng": -80.2}},
    ]
    news = [
        {
            "id": "news-1",
            "kind": "news",
            "label": "Semiconductor capex expansion",
            "category": "opportunity",
            "coordinates": {"lat": 37.4, "lng": -122.0},
        },
        {
            "id": "news-2",
            "kind": "news",
            "label": "Data compliance review",
            "category": "regulation",
            "coordinates": {"lat": 50.85, "lng": 4.35},
        },
        {
            "id": "news-3",
            "kind": "news",
            "label": "Port congestion impacts logistics",
            "category": "supply-chain",
            "coordinates": {"lat": 1.29, "lng": 103.85},
        },
    ]

    payload = {
        "exchanges": exchanges,
        "climate": climate,
        "news": news,
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    set_cached(cache_key, payload)
    return payload
