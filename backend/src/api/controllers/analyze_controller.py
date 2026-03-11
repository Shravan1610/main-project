import asyncio
from datetime import datetime, timezone

from src.api.controllers._service_loader import load_function
from src.api.controllers.search_controller import search_entities

fetch_stock_quote = load_function("features/market-intel/services/stock_data.py", "fetch_stock_quote")
fetch_crypto_quote = load_function("features/market-intel/services/crypto_data.py", "fetch_crypto_quote")
get_news = load_function("features/news-intel/services/news_service.py", "get_news")
get_climate_data = load_function("features/climate-intel/services/climate_service.py", "get_climate_data")
fetch_esg_scores = load_function("features/esg-bridge/services/esg_client.py", "fetch_esg_scores")
compute_scores = load_function("features/scoring/services/scoring_engine.py", "compute_scores")
build_research_brief = load_function("features/news-intel/services/brief_service.py", "build_research_brief")


def _is_exact_match(entity: dict, query: str) -> bool:
    normalized_query = query.strip().lower()
    ticker = str(entity.get("ticker") or "").strip().lower()
    entity_id = str(entity.get("id") or "").strip().lower()
    name = str(entity.get("name") or "").strip().lower()
    return normalized_query in {ticker, entity_id, name}


def _priority(entity: dict) -> int:
    entity_type = str(entity.get("type") or "").lower()
    if entity_type == "crypto":
        return 0
    if entity_type == "stock":
        return 1
    return 2


async def _resolve_entity(entity_id: str) -> dict:
    search = await search_entities(entity_id)
    results = search.get("results", [])
    if results:
        exact_matches = [result for result in results if _is_exact_match(result, entity_id)]
        if exact_matches:
            return sorted(exact_matches, key=_priority)[0]
        return sorted(results, key=_priority)[0]

    normalized = entity_id.strip().upper()
    return {
        "id": normalized,
        "name": normalized,
        "type": "stock",
        "ticker": normalized,
        "country": "US",
        "exchange": "NASDAQ",
        "coordinates": {"lat": 37.7749, "lng": -122.4194},
    }


async def analyze_entity(entity_id: str) -> dict:
    entity = await _resolve_entity(entity_id)
    entity_type = entity.get("type", "stock")
    ticker = entity.get("ticker") or entity.get("id")

    if entity_type == "crypto":
        market_data = await fetch_crypto_quote(str(entity.get("id") or ticker))
    else:
        market_data = await fetch_stock_quote(str(ticker))

    coordinates = entity.get("coordinates") or {"lat": 0.0, "lng": 0.0}
    lat = float(coordinates.get("lat", 0.0))
    lng = float(coordinates.get("lng", 0.0))

    news, climate, esg = await asyncio.gather(
        get_news(entity),
        get_climate_data(lat, lng),
        fetch_esg_scores(entity.get("name") or str(ticker)),
    )

    scores = compute_scores(
        esg=esg,
        market=market_data,
        news=news,
        climate=climate,
    )

    news_signals: list[dict] = []
    grouped: dict[str, int] = {}
    for article in news:
        category = str(article.get("category") or "general").lower()
        grouped[category] = grouped.get(category, 0) + 1
    for category, count in sorted(grouped.items(), key=lambda item: item[1], reverse=True):
        direction = "negative" if category in {"risk", "disaster", "regulation", "supply-chain"} else "positive"
        news_signals.append(
            {
                "category": category,
                "count": count,
                "direction": direction,
                "headline": next((item.get("title") for item in news if item.get("category") == category), None),
            }
        )

    score_snapshot = {
        "sustainability": round(float(scores.sustainability_score), 2),
        "financialRisk": round(float(scores.financial_risk_score), 2),
        "longTermImpact": round(float(scores.longterm_impact_score), 2),
    }
    research_brief = build_research_brief(entity=entity, news=news, scores=score_snapshot, market=market_data)

    published = [str(item.get("publishedAt") or "") for item in news if item.get("publishedAt")]
    coverage = {
        "articleCount": len(news),
        "sourceCount": len({str(item.get("source") or "unknown") for item in news}),
        "lastUpdated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "latestPublishedAt": max(published) if published else None,
    }

    return {
        "id": str(entity.get("id") or ticker),
        "name": entity.get("name") or str(ticker),
        "type": entity_type,
        "ticker": ticker,
        "country": entity.get("country"),
        "exchange": entity.get("exchange"),
        "coordinates": {"lat": lat, "lng": lng},
        "market": {
            "price": float(market_data.get("price", 0.0) or 0.0),
            "changePercent": float(
                market_data.get("change_percent", market_data.get("change_24h", 0.0)) or 0.0
            ),
            "currency": market_data.get("currency", "USD"),
            "exchange": market_data.get("exchange"),
            "marketCap": market_data.get("market_cap"),
            "volume": market_data.get("volume") or market_data.get("volume_24h"),
            "high52w": None,
            "low52w": None,
        },
        "news": news,
        "climate": {
            "summary": climate.get("summary", "No climate summary"),
            "vulnerability": climate.get("vulnerability", "moderate"),
            "events": climate.get("events", []),
        },
        "scores": {
            **score_snapshot,
        },
        "drivers": {
            "sustainability": [d.model_dump() for d in scores.drivers.sustainability],
            "financialRisk": [d.model_dump() for d in scores.drivers.financial_risk],
            "longTermImpact": [d.model_dump() for d in scores.drivers.longterm_impact],
        },
        "newsSignals": news_signals,
        "researchBrief": research_brief,
        "coverage": coverage,
    }
