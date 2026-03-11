from src.features.scoring.schemas.score_schema import DriverItem, ScoreDrivers


def generate_drivers(esg: dict, market: dict, news: list[dict], climate: dict) -> ScoreDrivers:
    sustainability = [
        DriverItem(label="ESG baseline", impact="positive", detail=f"Overall ESG: {esg.get('overall_score', 0):.1f}"),
    ]
    financial_risk = [
        DriverItem(label="Climate exposure", impact="neutral", detail=f"Vulnerability: {climate.get('vulnerability', 'unknown')}"),
    ]
    longterm_impact = [
        DriverItem(label="Regulation signal", impact="neutral", detail=f"News items: {len(news)}"),
    ]

    return ScoreDrivers(
        sustainability=sustainability,
        financial_risk=financial_risk,
        longterm_impact=longterm_impact,
    )
