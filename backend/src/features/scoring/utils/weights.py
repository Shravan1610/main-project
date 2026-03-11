"""
backend/src/features/scoring/utils/weights.py
Score weight constants and normalization helpers.

Owner: Shravan
Task: SH-2-06
Phase: 2

Expected constants/functions:
  SUSTAINABILITY_WEIGHTS — {"esg": 0.60, "news": 0.25, "regulation": 0.15}
  FINANCIAL_RISK_WEIGHTS — {"market": 0.30, "climate": 0.25, "news": 0.25, "geography": 0.20}
  LONGTERM_IMPACT_WEIGHTS — {"climate_vuln": 0.30, "esg_resilience": 0.25, "regulation": 0.25, "opportunity": 0.20}
  clamp_score(score: float, min_val: float = 0, max_val: float = 100) -> float
  weighted_average(values: dict[str, float], weights: dict[str, float]) -> float
"""
# Stub — implement in SH-2-06
