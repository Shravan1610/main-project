"""
backend/src/features/feed-builder/schemas/feed_schema.py
Pydantic models for homepage feed responses.

Owner: Afham
Task: AF-2-16
Phase: 2

Expected classes:
  StockFeedItem(BaseModel) — ticker, name, price, change_percent, market_cap
  NewsFeedItem(BaseModel) — title, summary, url, source, published_at, category
  CryptoFeedItem(BaseModel) — symbol, name, price, change_24h, market_cap
  FeedResponse(BaseModel) — stocks: list[StockFeedItem], news: list[NewsFeedItem],
                            crypto: list[CryptoFeedItem], updated_at: datetime
"""
# Stub — implement in AF-2-16
