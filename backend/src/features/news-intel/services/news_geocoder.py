def geocode_article(article: dict) -> tuple[float, float] | None:
    return article.get("coordinates")


def geocode_articles(articles: list[dict]) -> list[dict]:
    for article in articles:
        article.setdefault("coordinates", None)
    return articles
