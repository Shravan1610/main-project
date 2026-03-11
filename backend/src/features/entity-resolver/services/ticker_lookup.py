from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


async def lookup_ticker(query: str) -> list[dict]:
    normalized = query.strip().upper()
    if not normalized:
        return []

    settings = get_settings()
    api_key = settings.market_api_key

    if not api_key:
        return [
            {
                "id": normalized,
                "name": normalized,
                "type": "stock",
                "ticker": normalized,
                "country": "US",
                "exchange": "US",
                "coordinates": {"lat": 40.7069, "lng": -74.0113},
            }
        ]

    try:
        client = get_http_client()
        response = await client.get(
            "https://www.alphavantage.co/query",
            params={"function": "SYMBOL_SEARCH", "keywords": normalized, "apikey": api_key},
        )
        response.raise_for_status()
        payload = response.json() if response.content else {}
    except Exception:
        return [
            {
                "id": normalized,
                "name": normalized,
                "type": "stock",
                "ticker": normalized,
                "country": "US",
                "exchange": "US",
                "coordinates": {"lat": 40.7069, "lng": -74.0113},
            }
        ]

    matches = payload.get("bestMatches", [])[:5]
    results: list[dict] = []
    for item in matches:
        symbol = item.get("1. symbol") or ""
        name = item.get("2. name") or symbol
        results.append(
            {
                "id": symbol,
                "name": name,
                "type": "stock",
                "ticker": symbol,
                "country": "US",
                "exchange": item.get("4. region") or None,
                "coordinates": {"lat": 40.7069, "lng": -74.0113},
            }
        )

    return results
