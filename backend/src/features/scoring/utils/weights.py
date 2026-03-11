SUSTAINABILITY_WEIGHTS = {"esg": 0.60, "news": 0.25, "regulation": 0.15}
FINANCIAL_RISK_WEIGHTS = {"market": 0.30, "climate": 0.25, "news": 0.25, "geography": 0.20}
LONGTERM_IMPACT_WEIGHTS = {"climate_vuln": 0.30, "esg_resilience": 0.25, "regulation": 0.25, "opportunity": 0.20}


def clamp_score(score: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    return max(min_val, min(max_val, score))


def weighted_average(values: dict[str, float], weights: dict[str, float]) -> float:
    if not weights:
        return 0.0

    total = 0.0
    for key, weight in weights.items():
        total += float(values.get(key, 0.0)) * weight

    return clamp_score(total)
