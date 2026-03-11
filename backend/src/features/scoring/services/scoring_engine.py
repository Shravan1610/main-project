from src.features.scoring.schemas.score_schema import ScoreResult
from src.features.scoring.services.driver_generator import generate_drivers
from src.features.scoring.services.financial_risk_scorer import compute_financial_risk_score
from src.features.scoring.services.longterm_impact_scorer import compute_longterm_impact_score
from src.features.scoring.services.sustainability_scorer import compute_sustainability_score


def compute_scores(esg: dict, market: dict, news: list[dict], climate: dict) -> ScoreResult:
    sustainability_score = compute_sustainability_score(esg, news)
    financial_risk_score = compute_financial_risk_score(market, climate, news)
    longterm_impact_score = compute_longterm_impact_score(esg, climate, news)

    drivers = generate_drivers(esg=esg, market=market, news=news, climate=climate)

    return ScoreResult(
        sustainability_score=sustainability_score,
        financial_risk_score=financial_risk_score,
        longterm_impact_score=longterm_impact_score,
        drivers=drivers,
    )
