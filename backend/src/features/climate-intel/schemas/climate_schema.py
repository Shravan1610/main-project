from enum import Enum

from pydantic import BaseModel


class VulnerabilityLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    critical = "critical"


class WeatherEvent(BaseModel):
    id: str
    type: str
    severity: str
    coordinates: tuple[float, float]
    description: str | None = None
    timestamp: str | None = None


class ClimateData(BaseModel):
    coordinates: tuple[float, float]
    vulnerability: VulnerabilityLevel = VulnerabilityLevel.moderate
    vulnerability_score: float = 50.0
    events: list[WeatherEvent] = []
    temperature_trend: float | None = None
    risk_factors: list[str] = []
