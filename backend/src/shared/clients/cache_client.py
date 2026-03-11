"""
backend/src/shared/clients/cache_client.py
In-memory TTL cache — cachetools-based, avoids repeated API calls.

Owner: Shravan
Task: SH-1-11
Phase: 1 — Scaffolding

Expected:
  cache = TTLCache(maxsize=100, ttl=300)
  cached(key: str) -> decorator
  get_cached(key: str) -> any | None
  set_cached(key: str, value: any) -> None
"""
# Stub — implement in SH-1-11
