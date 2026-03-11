"""
backend/src/features/esg-bridge/schemas/esg_schema.py
Pydantic models for ESG data from the external model.

Owner: Shravan
Task: SH-1-12
Phase: 1

Expected classes:
  ESGCategory(str, Enum) — "environmental", "social", "governance"
  ESGScore(BaseModel) — category: ESGCategory, score: float, confidence: float, drivers: list[str]
  ESGData(BaseModel) — entity_id: str, overall_score: float,
                       scores: list[ESGScore], raw_response: dict | None
"""
# Stub — implement in SH-1-12
