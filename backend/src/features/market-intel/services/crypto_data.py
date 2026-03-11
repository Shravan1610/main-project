def fetch_crypto_quote(symbol: str) -> dict:
    normalized = symbol.strip().upper() or "UNKNOWN"
    return {
        "symbol": normalized,
        "price": 0.0,
        "change_24h": 0.0,
        "market_cap": None,
        "volume_24h": None,
    }
