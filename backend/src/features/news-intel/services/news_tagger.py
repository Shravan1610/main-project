def tag_article(article: dict) -> str:
    text = f"{article.get('title', '')} {article.get('summary', '')}".lower()

    if any(token in text for token in ("regulation", "policy", "compliance", "antitrust", "sec", "law")):
        return "regulation"
    if any(token in text for token in ("supply chain", "logistics", "shipping", "factory", "port")):
        return "supply-chain"
    if any(token in text for token in ("earnings", "guidance", "revenue", "profit", "quarter", "eps")):
        return "earnings"
    if any(token in text for token in ("inflation", "interest rate", "fed", "ecb", "macro", "gdp", "jobs report")):
        return "macro"
    if any(token in text for token in ("disaster", "storm", "flood", "wildfire", "earthquake", "hurricane")):
        return "disaster"
    if any(token in text for token in ("risk", "lawsuit", "downgrade", "probe", "uncertainty", "layoff")):
        return "risk"
    if any(token in text for token in ("opportunity", "growth", "partnership", "launch", "upgrade", "expansion")):
        return "opportunity"
    return "general"


def tag_articles(articles: list[dict]) -> list[dict]:
    tagged: list[dict] = []
    for article in articles:
        enriched = dict(article)
        enriched["category"] = tag_article(enriched)
        tagged.append(enriched)
    return tagged
