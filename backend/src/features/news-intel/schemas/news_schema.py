from enum import Enum
from datetime import datetime

from pydantic import BaseModel


class NewsCategory(str, Enum):
    risk = "risk"
    opportunity = "opportunity"
    regulation = "regulation"
    disaster = "disaster"
    general = "general"


class NewsArticle(BaseModel):
    id: str
    title: str
    summary: str | None = None
    url: str | None = None
    source: str | None = None
    published_at: datetime | None = None
    category: NewsCategory = NewsCategory.general
    coordinates: tuple[float, float] | None = None
    relevance_score: float = 0.0
