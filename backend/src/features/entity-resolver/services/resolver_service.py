"""
backend/src/features/entity-resolver/services/resolver_service.py
Main resolver: takes a search query, returns matched entities across all types.

Owner: Afham
Task: AF-1-14
Phase: 1

Expected functions:
  resolve_entities(query: str) -> list[EntityResult]
    — Fans out to company_lookup, ticker_lookup, crypto_lookup,
      deduplicates, ranks, and returns top matches.
"""
# Stub — implement in AF-1-14
