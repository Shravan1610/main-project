"""
backend/src/features/news-intel/services/news_geocoder.py
Extracts geographic coordinates from news articles for map placement.

Owner: Afham
Task: AF-2-09
Phase: 2

Expected functions:
  geocode_article(article: NewsArticle) -> tuple[float, float] | None
    — Extracts location mentions from article, geocodes to lat/lng via Nominatim/OpenCage.
  geocode_articles(articles: list[NewsArticle]) -> list[NewsArticle]
    — Batch-geocodes articles, attaching coordinates where possible.
"""
# Stub — implement in AF-2-09
