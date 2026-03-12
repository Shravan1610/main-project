import logging
from typing import Any

from src.shared.clients.http_client import get_http_client
from src.shared.clients.gemini_client import call_gemini, call_gemini_grounded
from src.shared.config import get_settings

logger = logging.getLogger(__name__)


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


async def _verify_esg_with_gemini_grounded(
    entity_name: str, raw_scores: dict[str, Any]
) -> dict[str, Any]:
    """Verify ESG model output using Gemini with Google Search grounding.

    Asks Gemini to cross-check the model's scores against real-time web data
    and returns adjusted scores with verification metadata.
    """
    overall = raw_scores.get("overall_score", 55.0)
    scores = raw_scores.get("scores", {})

    prompt = "\n".join(
        [
            "You are an ESG verification analyst. An ML model produced the following ESG scores for a company.",
            "Use Google Search to verify these scores against publicly available ESG ratings, sustainability reports, news, and controversies.",
            "",
            f"Company: {entity_name}",
            f"Model output — Overall: {overall}, Environmental: {scores.get('environmental', 'N/A')}, Social: {scores.get('social', 'N/A')}, Governance: {scores.get('governance', 'N/A')}",
            "",
            "Return ONLY valid JSON with this exact shape:",
            "{",
            '  "verified": true/false,',
            '  "overall_score": number (0-100),',
            '  "scores": {"environmental": number, "social": number, "governance": number},',
            '  "confidence": number (0-1),',
            '  "adjustments": "brief explanation of any score adjustments based on web evidence",',
            '  "sources_found": ["list of key sources or ratings agencies referenced"]',
            "}",
            "",
            "If the model scores align with publicly available data, set verified=true and keep scores similar.",
            "If the model scores are significantly off, set verified=false and provide corrected scores with explanation.",
            "If you cannot find sufficient data to verify, set verified=true and keep original scores with a note.",
        ]
    )

    try:
        result = await call_gemini_grounded(prompt, temperature=0.1)
        if not result or not isinstance(result, dict):
            logger.warning("Gemini grounded verification returned no usable data for %s", entity_name)
            return raw_scores

        verified_overall = float(result.get("overall_score", overall))
        verified_scores = result.get("scores", {})

        return {
            "entity_id": raw_scores.get("entity_id", entity_name.strip().upper()),
            "overall_score": max(0.0, min(100.0, verified_overall)),
            "scores": {
                "environmental": max(0.0, min(100.0, float(verified_scores.get("environmental", scores.get("environmental", verified_overall))))),
                "social": max(0.0, min(100.0, float(verified_scores.get("social", scores.get("social", verified_overall))))),
                "governance": max(0.0, min(100.0, float(verified_scores.get("governance", scores.get("governance", verified_overall))))),
            },
            "raw_response": raw_scores.get("raw_response", {}),
            "verification": {
                "verified": result.get("verified", False),
                "confidence": result.get("confidence"),
                "adjustments": result.get("adjustments", ""),
                "sources_found": result.get("sources_found", []),
                "original_scores": {
                    "overall_score": overall,
                    "scores": scores,
                },
            },
        }
    except Exception:
        logger.exception("Gemini grounded verification failed for %s, returning unverified scores", entity_name)
        return raw_scores


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

        raw_result = {
            "entity_id": entity_name.strip().upper() or "UNKNOWN",
            "overall_score": max(0.0, min(100.0, overall)),
            "scores": {
                "environmental": float(category_scores.get("environmental", overall)),
                "social": float(category_scores.get("social", overall)),
                "governance": float(category_scores.get("governance", overall)),
            },
            "raw_response": data,
        }

        # Verify with Gemini grounded search before returning
        verified_result = await _verify_esg_with_gemini_grounded(entity_name, raw_result)
        return verified_result
    except Exception:
        try:
            gemini_result = await _fetch_esg_scores_with_gemini(entity_name)
            if gemini_result is not None:
                return gemini_result
        except Exception:
            pass
        return _fallback(entity_name)
