def filter_duplicates(articles: list[dict]) -> list[dict]:
    seen_titles: set[str] = set()
    output: list[dict] = []
    for article in articles:
        title = str(article.get("title", "")).strip().lower()
        if not title or title in seen_titles:
            continue
        seen_titles.add(title)
        output.append(article)
    return output


def score_relevance(article: dict, entity_name: str) -> float:
    title = str(article.get("title", "")).lower()
    return 1.0 if entity_name.lower() in title else 0.5
