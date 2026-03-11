from ..schemas.esg_schema import ESGCategory, ESGData, ESGScore

FALLBACK_SCORES: dict[str, float] = {
    "environmental": 55.0,
    "social": 55.0,
    "governance": 55.0,
    "overall": 55.0,
}


def get_fallback_esg(entity_name: str) -> ESGData:
    return ESGData(
        entity_id=entity_name.strip().upper() or "UNKNOWN",
        overall_score=FALLBACK_SCORES["overall"],
        scores=[
            ESGScore(category=ESGCategory.environmental, score=FALLBACK_SCORES["environmental"], confidence=0.3),
            ESGScore(category=ESGCategory.social, score=FALLBACK_SCORES["social"], confidence=0.3),
            ESGScore(category=ESGCategory.governance, score=FALLBACK_SCORES["governance"], confidence=0.3),
        ],
        raw_response={"source": "fallback"},
    )
