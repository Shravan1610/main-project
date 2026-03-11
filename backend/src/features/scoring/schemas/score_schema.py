"""
backend/src/features/scoring/schemas/score_schema.py
Pydantic models for composite score results and drivers.

Owner: Shravan
Task: SH-1-16
Phase: 1

Expected classes:
  DriverItem(BaseModel) — label: str, impact: str ("positive"/"negative"/"neutral"), detail: str
  ScoreDrivers(BaseModel) — sustainability: list[DriverItem],
                            financial_risk: list[DriverItem],
                            longterm_impact: list[DriverItem]
  ScoreResult(BaseModel) — sustainability_score: float, financial_risk_score: float,
                           longterm_impact_score: float, drivers: ScoreDrivers
"""
# Stub — implement in SH-1-16
