import asyncio

from src.api.controllers._service_loader import load_function

lookup_company = load_function("features/entity-resolver/services/company_lookup.py", "lookup_company")
lookup_ticker = load_function("features/entity-resolver/services/ticker_lookup.py", "lookup_ticker")
lookup_crypto = load_function("features/entity-resolver/services/crypto_lookup.py", "lookup_crypto")
deduplicate_entities = load_function("features/entity-resolver/utils/normalization.py", "deduplicate_entities")


async def search_entities(query: str) -> dict:
    normalized = query.strip()
    if not normalized:
        return {"query": query, "results": [], "total": 0}

    company_results, ticker_results, crypto_results = await asyncio.gather(
        lookup_company(normalized),
        lookup_ticker(normalized),
        lookup_crypto(normalized),
    )

    merged = deduplicate_entities([*company_results, *ticker_results, *crypto_results])
    return {
        "query": query,
        "results": merged[:10],
        "total": len(merged[:10]),
    }
