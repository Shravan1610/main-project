"""
backend/src/features/news-intel/schemas/news_schema.py
Pydantic models for news articles and categories.

Owner: Afham
Task: AF-2-06
Phase: 2

Expected classes:
  NewsCategory(str, Enum) — "risk", "opportunity", "regulation", "disaster", "general"
  NewsArticle(BaseModel) — id, title, summary, url, source, published_at,
                           category: NewsCategory, coordinates: tuple[float, float] | None,
                           relevance_score: float
"""
# Stub — implement in AF-2-06
