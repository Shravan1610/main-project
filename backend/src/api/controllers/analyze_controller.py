async def analyze_entity(entity_id: str) -> dict:
    entity = entity_id.strip().upper()
    return {
        "id": entity,
        "name": entity,
        "type": "stock",
        "ticker": entity,
        "country": "US",
        "coordinates": {"lat": 37.7749, "lng": -122.4194},
        "market": {
            "price": 0.0,
            "changePercent": 0.0,
            "currency": "USD",
            "exchange": "NASDAQ",
        },
        "news": [],
        "climate": {"summary": "No climate data yet", "vulnerability": "moderate", "events": []},
        "scores": {"sustainability": 50, "financialRisk": 50, "longTermImpact": 50},
        "drivers": {
            "sustainability": [],
            "financialRisk": [],
            "longTermImpact": [],
        },
    }
