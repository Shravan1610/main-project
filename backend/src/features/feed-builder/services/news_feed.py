from datetime import datetime, timezone


def fetch_news_feed(limit: int = 10) -> list[dict]:
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    items = [
        {
            "title": "Fed policy comments keep global equities cautious",
            "summary": "Rate path uncertainty pushes mixed risk sentiment across US and Europe.",
            "source": "Reuters",
            "publishedAt": now,
            "url": "https://example.com/news/fed-policy-comments",
            "category": "macro",
        },
        {
            "title": "Major chipmaker raises AI infrastructure capex outlook",
            "summary": "Analysts flag supply-chain upside for equipment vendors.",
            "source": "Bloomberg",
            "publishedAt": now,
            "url": "https://example.com/news/chipmaker-capex",
            "category": "opportunity",
        },
        {
            "title": "EU opens new review on cross-border data compliance",
            "summary": "Large cloud and platform companies may face revised disclosure timelines.",
            "source": "Financial Times",
            "publishedAt": now,
            "url": "https://example.com/news/eu-data-compliance",
            "category": "regulation",
        },
        {
            "title": "Port congestion warning adds pressure to electronics logistics",
            "summary": "Freight delays may affect near-term inventory cycles for import-heavy sectors.",
            "source": "WSJ",
            "publishedAt": now,
            "url": "https://example.com/news/port-congestion",
            "category": "supply-chain",
        },
    ]
    return items[:limit]
