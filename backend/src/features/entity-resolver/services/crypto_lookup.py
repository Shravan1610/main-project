def lookup_crypto(query: str) -> list[dict]:
    normalized = query.strip().upper()
    if not normalized:
        return []

    return [
        {
            "id": normalized,
            "name": normalized,
            "type": "crypto",
            "ticker": normalized,
            "coordinates": {"lat": 0.0, "lng": 0.0},
        }
    ]
