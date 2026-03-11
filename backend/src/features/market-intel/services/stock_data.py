def fetch_stock_quote(ticker: str) -> dict:
    symbol = ticker.strip().upper() or "UNKNOWN"
    return {
        "ticker": symbol,
        "price": 0.0,
        "change": 0.0,
        "change_percent": 0.0,
        "volume": None,
        "market_cap": None,
    }
