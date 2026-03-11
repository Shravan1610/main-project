def lookup_ticker(query: str) -> list[dict]:
    normalized = query.strip().upper()
    if not normalized:
        return []

    return [
        {
            "id": normalized,
            "name": normalized,
            "type": "stock",
            "ticker": normalized,
            "coordinates": {"lat": 40.7069, "lng": -74.0113},
        }
    ]
