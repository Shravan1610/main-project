from src.features.scoring.utils.weights import SUSTAINABILITY_WEIGHTS, weighted_average


def compute_sustainability_score(esg: dict, news: list[dict]) -> float:
    overall_score = float(esg.get("overall_score", 50.0))
    sustainability_news_signal = 55.0 if news else 50.0
    regulation_signal = 50.0

    return weighted_average(
        {
            "esg": overall_score,
            "news": sustainability_news_signal,
            "regulation": regulation_signal,
        },
        SUSTAINABILITY_WEIGHTS,
    )
