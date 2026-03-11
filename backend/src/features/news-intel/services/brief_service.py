from __future__ import annotations

from datetime import datetime, timezone
from hashlib import md5

from src.shared.clients.cache_client import get_cached, set_cached


def _category_split(news: list[dict]) -> tuple[list[str], list[str]]:
    risks: list[str] = []
    opportunities: list[str] = []

    for article in news[:8]:
        title = str(article.get("title") or "").strip()
        category = str(article.get("category") or "general").lower()
        if not title:
            continue

        if category in {"risk", "disaster", "regulation", "supply-chain"} and len(risks) < 3:
            risks.append(title)
        if category in {"opportunity", "earnings", "macro"} and len(opportunities) < 3:
            opportunities.append(title)

    return risks, opportunities


def _compute_confidence(news: list[dict]) -> float:
    if not news:
        return 0.35

    source_count = len({str(item.get("source") or "unknown") for item in news})
    category_count = len({str(item.get("category") or "general") for item in news})
    confidence = 0.45 + min(0.25, source_count * 0.05) + min(0.2, category_count * 0.04)
    return round(min(confidence, 0.95), 2)


def _stable_cache_key(entity_id: str, news: list[dict]) -> str:
    headline_fingerprint = "|".join(str(item.get("title") or "") for item in news[:5])
    digest = md5(headline_fingerprint.encode("utf-8")).hexdigest()
    return f"brief:{entity_id}:{digest}"


def _fallback_summary(entity_name: str, market: dict | None = None) -> str:
    if not market:
        return f"{entity_name} has limited recent coverage. Monitor updates for risk and opportunity signals."

    change_percent = float(market.get("change_percent", market.get("change_24h", 0.0)) or 0.0)
    direction = "up" if change_percent >= 0 else "down"
    return (
        f"{entity_name} is trading {direction} {abs(change_percent):.2f}% with limited high-confidence headlines. "
        "Use caution and track new disclosures."
    )


def build_research_brief(entity: dict, news: list[dict], scores: dict | None = None, market: dict | None = None) -> dict:
    entity_id = str(entity.get("id") or entity.get("ticker") or "unknown")
    entity_name = str(entity.get("name") or entity_id)
    cache_key = _stable_cache_key(entity_id, news)

    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    top_titles = [str(article.get("title") or "").strip() for article in news[:3] if article.get("title")]
    risks, opportunities = _category_split(news)
    confidence = _compute_confidence(news)

    if top_titles:
        summary = (
            f"Recent coverage for {entity_name} is mixed across {len(news)} articles. "
            f"Top focus: {top_titles[0]}"
        )
    else:
        summary = _fallback_summary(entity_name, market)

    key_points = top_titles if top_titles else [f"No strong headline cluster yet for {entity_name}."]

    if scores:
        key_points.append(
            "Score snapshot - "
            f"Sustainability {scores.get('sustainability', 0)}, "
            f"Risk {scores.get('financialRisk', 0)}, "
            f"Long-term {scores.get('longTermImpact', 0)}"
        )

    response = {
        "entityId": entity_id,
        "summary": summary,
        "keyPoints": key_points[:4],
        "risks": risks,
        "opportunities": opportunities,
        "confidence": confidence,
        "sourceRefs": [
            {
                "title": str(article.get("title") or ""),
                "source": str(article.get("source") or "unknown"),
                "url": str(article.get("url") or ""),
            }
            for article in news[:5]
        ],
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    set_cached(cache_key, response)
    return response
