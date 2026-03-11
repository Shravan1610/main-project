def get_market_data(entity: dict) -> dict:
    entity_type = entity.get("type")
    ticker = entity.get("ticker") or entity.get("id") or "UNKNOWN"

    if entity_type == "crypto":
        return {
            "entity_id": entity.get("id", ticker),
            "stock": None,
            "crypto": {"symbol": ticker, "price": 0.0, "change_24h": 0.0},
        }

    return {
        "entity_id": entity.get("id", ticker),
        "stock": {"ticker": ticker, "price": 0.0, "change": 0.0, "change_percent": 0.0},
        "crypto": None,
    }
