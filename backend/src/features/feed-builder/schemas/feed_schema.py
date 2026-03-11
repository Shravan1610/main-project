from datetime import datetime

from pydantic import BaseModel


class StockFeedItem(BaseModel):
    ticker: str
    name: str
    price: float
    change_percent: float = 0.0
    market_cap: float | None = None


class NewsFeedItem(BaseModel):
    title: str
    summary: str | None = None
    url: str | None = None
    source: str | None = None
    published_at: datetime | None = None
    category: str = "general"


class CryptoFeedItem(BaseModel):
    symbol: str
    name: str
    price: float
    change_24h: float = 0.0
    market_cap: float | None = None


class FeedResponse(BaseModel):
    stocks: list[StockFeedItem] = []
    news: list[NewsFeedItem] = []
    crypto: list[CryptoFeedItem] = []
    updated_at: datetime = datetime.utcnow()
