"""
backend/src/features/feed-builder/utils/aggregator.py
Merges and sorts feed items by relevance and time.

Owner: Afham
Task: AF-2-21
Phase: 2

Expected functions:
  sort_by_relevance(items: list, key: str = "relevance_score") -> list
    — Sorts feed items by relevance score descending.
  sort_by_time(items: list, key: str = "published_at") -> list
    — Sorts feed items by timestamp descending (newest first).
  merge_feeds(stocks: list, news: list, crypto: list) -> FeedResponse
    — Combines all feeds into a single FeedResponse with updated_at timestamp.
"""
# Stub — implement in AF-2-21
