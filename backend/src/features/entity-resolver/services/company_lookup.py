def lookup_company(query: str) -> list[dict]:
    normalized = query.strip()
    if not normalized:
        return []

    return [
        {
            "id": f"COMP-{normalized.upper()}",
            "name": normalized.title(),
            "type": "company",
            "ticker": normalized[:5].upper(),
            "coordinates": {"lat": 37.7749, "lng": -122.4194},
        }
    ]
