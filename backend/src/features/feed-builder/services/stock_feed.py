def fetch_stock_feed(limit: int = 10) -> list[dict]:
    items = [
        {"symbol": "AAPL", "ticker": "AAPL", "name": "Apple", "price": 188.45, "changePercent": 1.23, "currency": "USD", "exchange": "NASDAQ"},
        {"symbol": "MSFT", "ticker": "MSFT", "name": "Microsoft", "price": 421.38, "changePercent": 0.74, "currency": "USD", "exchange": "NASDAQ"},
        {"symbol": "TSLA", "ticker": "TSLA", "name": "Tesla", "price": 212.08, "changePercent": -1.52, "currency": "USD", "exchange": "NASDAQ"},
        {"symbol": "NVDA", "ticker": "NVDA", "name": "NVIDIA", "price": 901.92, "changePercent": 2.41, "currency": "USD", "exchange": "NASDAQ"},
        {"symbol": "AMZN", "ticker": "AMZN", "name": "Amazon", "price": 182.14, "changePercent": 0.44, "currency": "USD", "exchange": "NASDAQ"},
        {"symbol": "META", "ticker": "META", "name": "Meta", "price": 504.33, "changePercent": -0.36, "currency": "USD", "exchange": "NASDAQ"},
    ]
    return items[:limit]
