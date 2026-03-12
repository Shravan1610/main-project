from typing import Any

from src.shared.clients.http_client import get_http_client
from src.shared.clients.gemini_client import call_gemini
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


def _parse_json_from_text(raw_text: str) -> dict[str, Any] | None:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        import json

        parsed = json.loads(raw_text[start : end + 1])
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


async def _fetch_esg_scores_with_gemini(entity_name: str) -> dict[str, Any] | None:
    settings = get_settings()
    api_key = settings.google_ai_studio_api_key.strip()
    if not api_key:
        return None

    prompt = "\n".join(
        [
            "Estimate ESG scores for the named entity.",
            "Return ONLY valid JSON with this exact shape:",
            '{"overall_score": number, "scores": {"environmental": number, "social": number, "governance": number}, "confidence": number, "reasoning": "string"}',
            "Use score values from 0 to 100 and confidence from 0 to 1.",
            "If the entity is ambiguous, return conservative mid-range estimates.",
            f"Entity: {entity_name}",
        ]
    )

    parsed = await call_gemini(prompt, temperature=0.1)
    if not parsed or not isinstance(parsed, dict):
        return None

    overall = float(parsed.get("overall_score", 55.0))
    category_scores = parsed.get("scores", {})
    return {
        "entity_id": entity_name.strip().upper() or "UNKNOWN",
        "overall_score": max(0.0, min(100.0, overall)),
        "scores": {
            "environmental": max(0.0, min(100.0, float(category_scores.get("environmental", overall)))),
            "social": max(0.0, min(100.0, float(category_scores.get("social", overall)))),
            "governance": max(0.0, min(100.0, float(category_scores.get("governance", overall)))),
        },
        "raw_response": {
            "source": "gemini_fallback",
            "model": settings.gemini_model,
            "payload": parsed,
        },
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
        try:
            gemini_result = await _fetch_esg_scores_with_gemini(entity_name)
            if gemini_result is not None:
                return gemini_result
        except Exception:
            pass
        return _fallback(entity_name)
