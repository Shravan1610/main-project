from __future__ import annotations

import asyncio

from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings

WATCHLIST = [
    {"symbol": "AAPL", "ticker": "AAPL", "name": "Apple", "price": 188.45, "changePercent": 1.23, "currency": "USD", "exchange": "NASDAQ"},
    {"symbol": "MSFT", "ticker": "MSFT", "name": "Microsoft", "price": 421.38, "changePercent": 0.74, "currency": "USD", "exchange": "NASDAQ"},
    {"symbol": "TSLA", "ticker": "TSLA", "name": "Tesla", "price": 212.08, "changePercent": -1.52, "currency": "USD", "exchange": "NASDAQ"},
    {"symbol": "NVDA", "ticker": "NVDA", "name": "NVIDIA", "price": 901.92, "changePercent": 2.41, "currency": "USD", "exchange": "NASDAQ"},
    {"symbol": "AMZN", "ticker": "AMZN", "name": "Amazon", "price": 182.14, "changePercent": 0.44, "currency": "USD", "exchange": "NASDAQ"},
    {"symbol": "META", "ticker": "META", "name": "Meta", "price": 504.33, "changePercent": -0.36, "currency": "USD", "exchange": "NASDAQ"},
]


def _fallback_items(limit: int) -> list[dict]:
    return [dict(item, assetType="equity") for item in WATCHLIST[:limit]]


def _as_float(value: object) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            return float(value)
        except ValueError:
            return None
    return None


async def _fetch_quote(symbol: str, api_key: str) -> dict | None:
    client = get_http_client()
    response = await client.get(
        "https://eodhd.com/api/us-quote-delayed",
        params={
            "s": f"{symbol}.US",
            "api_token": api_key,
            "fmt": "json",
        },
    )
    response.raise_for_status()

    payload = response.json() if response.content else {}
    data = payload.get("data", {}) if isinstance(payload, dict) else {}
    quote = data.get(f"{symbol}.US") if isinstance(data, dict) else None
    return quote if isinstance(quote, dict) else None


async def fetch_stock_feed(limit: int = 10) -> list[dict]:
    settings = get_settings()
    watchlist = WATCHLIST[:limit]

    if not settings.market_api_key:
        return _fallback_items(limit)

    tasks = [
        _fetch_quote(item["symbol"], settings.market_api_key)
        for item in watchlist
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    items: list[dict] = []
    for base_item, result in zip(watchlist, results, strict=False):
        if isinstance(result, Exception) or result is None:
            items.append(dict(base_item, assetType="equity"))
            continue

        price = _as_float(result.get("lastTradePrice")) or _as_float(result.get("previousClosePrice"))
        change_percent = _as_float(result.get("changePercent"))
        exchange_name = result.get("bzExchange") or base_item["exchange"]

        items.append(
            {
                "symbol": base_item["symbol"],
                "ticker": base_item["ticker"],
                "name": result.get("name") or base_item["name"],
                "price": price if price is not None else base_item["price"],
                "changePercent": change_percent if change_percent is not None else base_item["changePercent"],
                "currency": result.get("currency") or base_item["currency"],
                "exchange": exchange_name,
                "assetType": "equity",
            }
        )

    return items
