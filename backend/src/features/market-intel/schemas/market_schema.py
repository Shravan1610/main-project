"""
backend/src/features/market-intel/schemas/market_schema.py
Pydantic models for market data responses.

Owner: Afham
Task: AF-2-01
Phase: 2

Expected classes:
  StockQuote(BaseModel) — ticker, price, change, change_percent, volume, market_cap, timestamp
  CryptoQuote(BaseModel) — symbol, price, change_24h, market_cap, volume_24h, timestamp
  MarketData(BaseModel) — entity_id, stock: StockQuote | None, crypto: CryptoQuote | None
"""
# Stub — implement in AF-2-01
