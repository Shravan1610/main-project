from typing import Any

from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings

from ..schemas.esg_schema import ESGCategory, ESGData, ESGScore
from .esg_normalizer import normalize_esg_data
from ..utils.fallbacks import get_fallback_esg


async def fetch_esg_scores(entity_name: str) -> ESGData:
    settings = get_settings()
    payload = {"entity": entity_name}

    try:
        client = get_http_client()
        response = await client.post(f"{settings.esg_model_url.rstrip('/')}/predict", json=payload)
        response.raise_for_status()
        data: dict[str, Any] = response.json() if response.content else {}

        overall = float(data.get("overall_score", data.get("score", 55.0)))
        category_scores = data.get("scores", {})

        scores = [
            ESGScore(
                category=ESGCategory.environmental,
                score=float(category_scores.get("environmental", overall)),
                confidence=0.7,
                drivers=[],
            ),
            ESGScore(
                category=ESGCategory.social,
                score=float(category_scores.get("social", overall)),
                confidence=0.7,
                drivers=[],
            ),
            ESGScore(
                category=ESGCategory.governance,
                score=float(category_scores.get("governance", overall)),
                confidence=0.7,
                drivers=[],
            ),
        ]

        esg_data = ESGData(
            entity_id=entity_name.strip().upper() or "UNKNOWN",
            overall_score=overall,
            scores=scores,
            raw_response=data,
        )
        return normalize_esg_data(esg_data)
    except Exception:
        return get_fallback_esg(entity_name)
