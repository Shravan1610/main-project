def tag_article(article: dict) -> str:
    text = f"{article.get('title', '')} {article.get('summary', '')}".lower()
    if "risk" in text:
        return "risk"
    if "regulation" in text:
        return "regulation"
    if "disaster" in text:
        return "disaster"
    if "opportunity" in text:
        return "opportunity"
    return "general"


def tag_articles(articles: list[dict]) -> list[dict]:
    tagged: list[dict] = []
    for article in articles:
        enriched = dict(article)
        enriched["category"] = tag_article(enriched)
        tagged.append(enriched)
    return tagged
