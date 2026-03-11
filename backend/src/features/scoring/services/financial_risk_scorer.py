from src.features.scoring.utils.weights import FINANCIAL_RISK_WEIGHTS, weighted_average


def compute_financial_risk_score(market: dict, climate: dict, news: list[dict]) -> float:
    market_signal = 50.0
    climate_signal = float(climate.get("vulnerability_score", 50.0)) if climate else 50.0

    negative_news_count = sum(1 for item in news if item.get("category") in {"risk", "disaster"})
    news_signal = min(100.0, 40.0 + negative_news_count * 10.0)
    geography_signal = 50.0

    return weighted_average(
        {
            "market": market_signal,
            "climate": climate_signal,
            "news": news_signal,
            "geography": geography_signal,
        },
        FINANCIAL_RISK_WEIGHTS,
    )
