from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


async def fetch_stock_quote(ticker: str) -> dict:
    symbol = ticker.strip().upper() or "UNKNOWN"
    settings = get_settings()

    if not settings.market_api_key:
        return {
            "ticker": symbol,
            "price": 0.0,
            "change": 0.0,
            "change_percent": 0.0,
            "volume": None,
            "market_cap": None,
            "currency": "USD",
            "exchange": "NASDAQ",
        }

    try:
        client = get_http_client()
        response = await client.get(
            "https://www.alphavantage.co/query",
            params={"function": "GLOBAL_QUOTE", "symbol": symbol, "apikey": settings.market_api_key},
        )
        response.raise_for_status()
        payload = response.json() if response.content else {}
        quote = payload.get("Global Quote", {})
    except Exception:
        quote = {}

    price = float(quote.get("05. price", 0.0) or 0.0)
    change = float(quote.get("09. change", 0.0) or 0.0)
    change_percent_raw = str(quote.get("10. change percent", "0")).replace("%", "")
    change_percent = float(change_percent_raw or 0.0)
    volume = float(quote.get("06. volume", 0.0) or 0.0) if quote.get("06. volume") else None

    return {
        "ticker": symbol,
        "price": price,
        "change": change,
        "change_percent": change_percent,
        "volume": volume,
        "market_cap": None,
        "currency": "USD",
        "exchange": "NASDAQ",
    }
