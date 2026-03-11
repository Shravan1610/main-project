"""
backend/src/features/climate-intel/schemas/climate_schema.py
Pydantic models for climate data and vulnerability levels.

Owner: Afham
Task: AF-2-11
Phase: 2

Expected classes:
  VulnerabilityLevel(str, Enum) — "low", "moderate", "high", "critical"
  WeatherEvent(BaseModel) — id, type, severity, coordinates, description, timestamp
  ClimateData(BaseModel) — coordinates, vulnerability: VulnerabilityLevel,
                           vulnerability_score: float, events: list[WeatherEvent],
                           temperature_trend: float | None, risk_factors: list[str]
"""
# Stub — implement in AF-2-11
