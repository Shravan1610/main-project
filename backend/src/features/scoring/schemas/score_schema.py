from pydantic import BaseModel, Field


class DriverItem(BaseModel):
    label: str
    impact: str
    detail: str = ""


class ScoreDrivers(BaseModel):
    sustainability: list[DriverItem] = Field(default_factory=list)
    financial_risk: list[DriverItem] = Field(default_factory=list)
    longterm_impact: list[DriverItem] = Field(default_factory=list)


class ScoreResult(BaseModel):
    sustainability_score: float
    financial_risk_score: float
    longterm_impact_score: float
    drivers: ScoreDrivers
