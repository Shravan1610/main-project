from src.shared.utils.response_builder import success_response


async def search_entities(query: str) -> dict:
    normalized = query.strip().lower()

    if not normalized:
        return success_response({"query": query, "results": [], "total": 0}, message="No query provided")

    results = [
        {
            "id": normalized.upper(),
            "name": query.strip().title(),
            "type": "company",
            "ticker": normalized[:5].upper(),
            "country": "US",
            "exchange": "NASDAQ",
            "coordinates": {"lat": 37.7749, "lng": -122.4194},
        }
    ]

    return {"query": query, "results": results, "total": len(results)}
