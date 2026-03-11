def get_news(entity: dict) -> list[dict]:
    name = entity.get("name") or entity.get("id") or "Entity"
    return [
        {
            "id": f"news-{str(name).lower()}",
            "title": f"{name} update",
            "summary": "Placeholder news item",
            "category": "general",
            "relevance_score": 0.5,
        }
    ]
