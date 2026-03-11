from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


def _country_from_region(region: str) -> str:
    mapping = {
        "United States": "US",
        "Canada": "CA",
        "United Kingdom": "GB",
        "India": "IN",
    }
    return mapping.get(region, "US")


async def lookup_company(query: str) -> list[dict]:
    normalized = query.strip()
    if not normalized:
        return []

    settings = get_settings()
    api_key = settings.market_api_key

    if not api_key:
        return [
            {
                "id": f"COMP-{normalized.upper()}",
                "name": normalized.title(),
                "type": "company",
                "ticker": normalized[:5].upper(),
                "country": "US",
                "exchange": None,
                "coordinates": {"lat": 37.7749, "lng": -122.4194},
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
                "id": f"COMP-{normalized.upper()}",
                "name": normalized.title(),
                "type": "company",
                "ticker": normalized[:5].upper(),
                "country": "US",
                "exchange": None,
                "coordinates": {"lat": 37.7749, "lng": -122.4194},
            }
        ]

    matches = payload.get("bestMatches", [])[:5]
    results: list[dict] = []
    for item in matches:
        symbol = item.get("1. symbol") or ""
        name = item.get("2. name") or symbol
        region = item.get("4. region") or ""
        exchange = item.get("4. region") or None
        results.append(
            {
                "id": f"COMP-{symbol}",
                "name": name,
                "type": "company",
                "ticker": symbol,
                "country": _country_from_region(region),
                "exchange": exchange,
                "coordinates": {"lat": 37.7749, "lng": -122.4194},
            }
        )

    return results
