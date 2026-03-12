from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings

CRYPTO_ASSETS = [
    {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "fallback_price": 67250.12, "fallback_change": 1.08},
    {"id": "ethereum", "symbol": "ETH", "name": "Ethereum", "fallback_price": 3562.74, "fallback_change": 0.52},
    {"id": "solana", "symbol": "SOL", "name": "Solana", "fallback_price": 154.22, "fallback_change": -1.93},
    {"id": "ripple", "symbol": "XRP", "name": "XRP", "fallback_price": 0.63, "fallback_change": -0.48},
    {"id": "binancecoin", "symbol": "BNB", "name": "BNB", "fallback_price": 591.4, "fallback_change": 0.81},
    {"id": "dogecoin", "symbol": "DOGE", "name": "Dogecoin", "fallback_price": 0.18, "fallback_change": -0.74},
    {"id": "cardano", "symbol": "ADA", "name": "Cardano", "fallback_price": 0.71, "fallback_change": 0.36},
    {"id": "tron", "symbol": "TRX", "name": "TRON", "fallback_price": 0.14, "fallback_change": 0.41},
]


def _fallback_feed(limit: int) -> list[dict]:
    return [
        {
            "symbol": asset["symbol"],
            "name": asset["name"],
            "price": asset["fallback_price"],
            "changePercent": asset["fallback_change"],
            "marketCap": None,
            "exchange": "CoinGecko",
            "assetType": "crypto",
        }
        for asset in CRYPTO_ASSETS[:limit]
    ]


async def fetch_crypto_feed(limit: int = 10) -> list[dict]:
    settings = get_settings()
    selected_assets = CRYPTO_ASSETS[:limit]
    if not selected_assets:
        return []

    client = get_http_client()
    params = {
        "vs_currency": "usd",
        "ids": ",".join(asset["id"] for asset in selected_assets),
        "order": "market_cap_desc",
        "per_page": str(len(selected_assets)),
        "page": "1",
        "sparkline": "false",
        "price_change_percentage": "24h",
    }

    if settings.coingecko_demo_api_key:
        params["x_cg_demo_api_key"] = settings.coingecko_demo_api_key

    try:
        response = await client.get("https://api.coingecko.com/api/v3/coins/markets", params=params)
        response.raise_for_status()
        payload = response.json() if response.content else []
    except Exception:
        payload = []

    if not payload:
        return _fallback_feed(limit)

    quote_by_id = {item.get("id"): item for item in payload if item.get("id")}

    return [
        {
            "symbol": asset["symbol"],
            "name": asset["name"],
            "price": float((quote_by_id.get(asset["id"]) or {}).get("current_price") or asset["fallback_price"]),
            "changePercent": float(
                (quote_by_id.get(asset["id"]) or {}).get("price_change_percentage_24h") or asset["fallback_change"]
            ),
            "marketCap": (
                float((quote_by_id.get(asset["id"]) or {}).get("market_cap"))
                if (quote_by_id.get(asset["id"]) or {}).get("market_cap") is not None
                else None
            ),
            "exchange": "CoinGecko",
            "assetType": "crypto",
        }
        for asset in selected_assets
    ]
