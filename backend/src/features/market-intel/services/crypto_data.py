from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings

COINGECKO_IDS = {
    "btc": "bitcoin",
    "eth": "ethereum",
    "sol": "solana",
    "xrp": "ripple",
    "bnb": "binancecoin",
    "doge": "dogecoin",
    "ada": "cardano",
    "trx": "tron",
}


async def fetch_crypto_quote(symbol_or_id: str) -> dict:
    normalized = symbol_or_id.strip().lower() or "bitcoin"
    coin_id = COINGECKO_IDS.get(normalized, normalized)
    settings = get_settings()

    client = get_http_client()

    params = {
        "vs_currencies": "usd",
        "ids": coin_id,
        "include_24hr_change": "true",
        "include_market_cap": "true",
    }
    if settings.coingecko_demo_api_key:
        params["x_cg_demo_api_key"] = settings.coingecko_demo_api_key

    try:
        response = await client.get("https://api.coingecko.com/api/v3/simple/price", params=params)
        response.raise_for_status()
        payload = response.json() if response.content else {}
    except Exception:
        payload = {}

    data = payload.get(coin_id)
    if not data:
        return {
            "symbol": normalized.upper(),
            "price": 0.0,
            "change_24h": 0.0,
            "market_cap": None,
            "volume_24h": None,
            "currency": "USD",
            "exchange": "CoinGecko",
        }

    return {
        "symbol": normalized.upper(),
        "price": float(data.get("usd", 0.0) or 0.0),
        "change_24h": float(data.get("usd_24h_change", 0.0) or 0.0),
        "market_cap": float(data.get("usd_market_cap", 0.0) or 0.0) if data.get("usd_market_cap") is not None else None,
        "volume_24h": None,
        "currency": "USD",
        "exchange": "CoinGecko",
    }
