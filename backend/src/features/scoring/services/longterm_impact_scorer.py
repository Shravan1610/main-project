from src.features.scoring.utils.weights import LONGTERM_IMPACT_WEIGHTS, weighted_average


def compute_longterm_impact_score(esg: dict, climate: dict, news: list[dict]) -> float:
    climate_vuln = float(climate.get("vulnerability_score", 50.0)) if climate else 50.0
    esg_resilience = float(esg.get("overall_score", 50.0))

    regulation_signal = 55.0 if any(item.get("category") == "regulation" for item in news) else 50.0
    opportunity_signal = 55.0 if any(item.get("category") == "opportunity" for item in news) else 50.0

    return weighted_average(
        {
            "climate_vuln": climate_vuln,
            "esg_resilience": esg_resilience,
            "regulation": regulation_signal,
            "opportunity": opportunity_signal,
        },
        LONGTERM_IMPACT_WEIGHTS,
    )
