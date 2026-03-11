from typing import Any

from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


def _fallback(entity_name: str) -> dict[str, Any]:
    entity_id = entity_name.strip().upper() or "UNKNOWN"
    return {
        "entity_id": entity_id,
        "overall_score": 55.0,
        "scores": {
            "environmental": 55.0,
            "social": 55.0,
            "governance": 55.0,
        },
        "raw_response": {"source": "fallback"},
    }


async def fetch_esg_scores(entity_name: str) -> dict[str, Any]:
    settings = get_settings()
    payload = {"entity": entity_name}

    try:
        client = get_http_client()
        response = await client.post(f"{settings.esg_model_url.rstrip('/')}/predict", json=payload)
        response.raise_for_status()
        data: dict[str, Any] = response.json() if response.content else {}

        overall = float(data.get("overall_score", data.get("score", 55.0)))
        category_scores = data.get("scores", {})

        return {
            "entity_id": entity_name.strip().upper() or "UNKNOWN",
            "overall_score": max(0.0, min(100.0, overall)),
            "scores": {
                "environmental": float(category_scores.get("environmental", overall)),
                "social": float(category_scores.get("social", overall)),
                "governance": float(category_scores.get("governance", overall)),
            },
            "raw_response": data,
        }
    except Exception:
        return _fallback(entity_name)
