from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


async def lookup_crypto(query: str) -> list[dict]:
    normalized = query.strip()
    if not normalized:
        return []

    settings = get_settings()
    if not settings.coingecko_demo_api_key:
        return [
            {
                "id": normalized.lower(),
                "name": normalized.title(),
                "type": "crypto",
                "ticker": normalized.upper(),
                "country": None,
                "exchange": "CoinGecko",
                "coordinates": {"lat": 0.0, "lng": 0.0},
            }
        ]

    client = get_http_client()
    params = {"query": normalized, "x_cg_demo_api_key": settings.coingecko_demo_api_key}

    try:
        response = await client.get("https://api.coingecko.com/api/v3/search", params=params)
        response.raise_for_status()
        payload = response.json() if response.content else {}
    except Exception:
        payload = {}

    coins = payload.get("coins", [])[:5]
    if not coins:
        return [
            {
                "id": normalized.lower(),
                "name": normalized.title(),
                "type": "crypto",
                "ticker": normalized.upper(),
                "country": None,
                "exchange": None,
                "coordinates": {"lat": 0.0, "lng": 0.0},
            }
        ]

    return [
        {
            "id": coin.get("id", normalized.lower()),
            "name": coin.get("name", normalized.title()),
            "type": "crypto",
            "ticker": str(coin.get("symbol", normalized)).upper(),
            "country": None,
            "exchange": "CoinGecko",
            "coordinates": {"lat": 0.0, "lng": 0.0},
        }
        for coin in coins
    ]
