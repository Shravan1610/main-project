from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ESGCategory(str, Enum):
    environmental = "environmental"
    social = "social"
    governance = "governance"


class ESGScore(BaseModel):
    category: ESGCategory
    score: float
    confidence: float = 0.5
    drivers: list[str] = Field(default_factory=list)


class ESGData(BaseModel):
    entity_id: str
    overall_score: float
    scores: list[ESGScore] = Field(default_factory=list)
    raw_response: dict[str, Any] | None = None
