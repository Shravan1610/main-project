from typing import Any


def resolve_entities(query: str) -> list[dict[str, Any]]:
    normalized = query.strip()
    if not normalized:
        return []

    return [
        {
            "id": normalized.upper(),
            "name": normalized.title(),
            "type": "company",
            "ticker": normalized[:5].upper(),
            "coordinates": {"lat": 37.7749, "lng": -122.4194},
        }
    ]
