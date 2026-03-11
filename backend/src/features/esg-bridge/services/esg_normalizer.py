from ..schemas.esg_schema import ESGData, ESGScore


def normalize_score(raw_score: float, source_range: tuple[float, float] = (0, 100)) -> float:
    low, high = source_range
    if high <= low:
        return 0.0

    normalized = ((raw_score - low) / (high - low)) * 100
    return max(0.0, min(100.0, normalized))


def normalize_esg_data(data: ESGData) -> ESGData:
    normalized_scores: list[ESGScore] = []
    for score in data.scores:
        normalized_scores.append(
            ESGScore(
                category=score.category,
                score=normalize_score(score.score),
                confidence=max(0.0, min(1.0, score.confidence)),
                drivers=score.drivers,
            )
        )

    overall = normalize_score(data.overall_score)
    return ESGData(entity_id=data.entity_id, overall_score=overall, scores=normalized_scores, raw_response=data.raw_response)
