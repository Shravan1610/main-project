from datetime import datetime

from pydantic import BaseModel


class StockQuote(BaseModel):
    ticker: str
    price: float
    change: float = 0.0
    change_percent: float = 0.0
    volume: float | None = None
    market_cap: float | None = None
    timestamp: datetime = datetime.utcnow()


class CryptoQuote(BaseModel):
    symbol: str
    price: float
    change_24h: float = 0.0
    market_cap: float | None = None
    volume_24h: float | None = None
    timestamp: datetime = datetime.utcnow()


class MarketData(BaseModel):
    entity_id: str
    stock: StockQuote | None = None
    crypto: CryptoQuote | None = None
