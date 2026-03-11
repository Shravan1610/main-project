def fetch_crypto_feed(limit: int = 10) -> list[dict]:
    items = [
        {"symbol": "BTC", "name": "Bitcoin", "price": 67250.12, "changePercent": 1.08, "marketCap": 1322000000000},
        {"symbol": "ETH", "name": "Ethereum", "price": 3562.74, "changePercent": 0.52, "marketCap": 428000000000},
        {"symbol": "SOL", "name": "Solana", "price": 154.22, "changePercent": -1.93, "marketCap": 68200000000},
        {"symbol": "XRP", "name": "XRP", "price": 0.63, "changePercent": -0.48, "marketCap": 34800000000},
        {"symbol": "BNB", "name": "BNB", "price": 591.4, "changePercent": 0.81, "marketCap": 91100000000},
    ]
    return items[:limit]
