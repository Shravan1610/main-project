from datetime import datetime, timezone

from src.shared.clients.cache_client import get_cached, set_cached


async def get_map_layers() -> dict:
    cache_key = "map:layers"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    climate = [
        {"id": "climate-1", "kind": "climate", "label": "Heat stress alert", "coordinates": {"lat": 28.6, "lng": 77.2}},
        {"id": "climate-2", "kind": "climate", "label": "Storm risk corridor", "coordinates": {"lat": 25.8, "lng": -80.2}},
    ]

    payload = {
        "population": [],
        "climate": climate,
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    set_cached(cache_key, payload)
    return payload
