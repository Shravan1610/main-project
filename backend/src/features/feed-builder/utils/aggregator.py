from datetime import datetime
from typing import Any


def sort_by_relevance(items: list[dict[str, Any]], key: str = "relevance_score") -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: float(item.get(key, 0.0)), reverse=True)


def sort_by_time(items: list[dict[str, Any]], key: str = "published_at") -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: str(item.get(key, "")), reverse=True)


def merge_feeds(stocks: list[dict], news: list[dict], crypto: list[dict]) -> dict:
    return {
        "stocks": stocks,
        "news": news,
        "crypto": crypto,
        "updated_at": datetime.utcnow().isoformat(),
    }
