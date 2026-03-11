from datetime import datetime
import importlib.util
from pathlib import Path

from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


def _load_local_function(file_name: str, fn_name: str):
    path = Path(__file__).resolve().with_name(file_name)
    spec = importlib.util.spec_from_file_location(f"news_intel_{file_name.replace('.', '_')}", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load {file_name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    fn = getattr(module, fn_name, None)
    if fn is None:
        raise AttributeError(f"Missing function '{fn_name}' in {file_name}")
    return fn


tag_articles = _load_local_function("news_tagger.py", "tag_articles")
geocode_articles = _load_local_function("news_geocoder.py", "geocode_articles")


def _fallback_news(name: str, source: str, summary: str, coordinates: dict | None = None) -> list[dict]:
    return [
        {
            "title": f"{name} update",
            "summary": summary,
            "source": source,
            "publishedAt": datetime.utcnow().isoformat() + "Z",
            "url": "https://example.com",
            "category": "general",
            "coordinates": coordinates,
        }
    ]


def _normalize_article(article: dict, source_name: str, name: str) -> dict:
    source = article.get("source")
    source_value = source_name
    if isinstance(source, dict):
        source_value = source.get("name") or source_name
    elif isinstance(source, str):
        source_value = source

    return {
        "title": article.get("title") or f"{name} news",
        "summary": article.get("description"),
        "source": source_value or "unknown",
        "publishedAt": article.get("publishedAt") or datetime.utcnow().isoformat() + "Z",
        "url": article.get("url") or "https://example.com",
        "category": "general",
        "coordinates": None,
    }


async def _fetch_newsapi(name: str, api_key: str) -> list[dict]:
    client = get_http_client()
    response = await client.get(
        "https://newsapi.org/v2/everything",
        params={
            "q": str(name),
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 5,
            "apiKey": api_key,
        },
    )
    response.raise_for_status()
    payload = response.json() if response.content else {}
    articles = payload.get("articles", [])
    return [_normalize_article(article, "NewsAPI", name) for article in articles]


async def _fetch_gnews(name: str, api_key: str) -> list[dict]:
    client = get_http_client()
    response = await client.get(
        "https://gnews.io/api/v4/search",
        params={
            "q": str(name),
            "lang": "en",
            "sortby": "publishedAt",
            "max": 5,
            "token": api_key,
        },
    )
    response.raise_for_status()
    payload = response.json() if response.content else {}
    articles = payload.get("articles", [])
    return [_normalize_article(article, "GNews", name) for article in articles]


def _with_default_coordinates(news: list[dict], entity_coordinates: dict | None) -> list[dict]:
    if not entity_coordinates:
        return news

    lat = float(entity_coordinates.get("lat", 0.0))
    lng = float(entity_coordinates.get("lng", 0.0))
    seeded_offsets = [(0.0, 0.0), (0.22, -0.14), (-0.18, 0.12), (0.12, 0.24), (-0.27, -0.2)]

    enriched: list[dict] = []
    for index, article in enumerate(news):
        item = dict(article)
        if item.get("coordinates") is None:
            offset = seeded_offsets[index % len(seeded_offsets)]
            item["coordinates"] = {"lat": round(lat + offset[0], 4), "lng": round(lng + offset[1], 4)}
        enriched.append(item)
    return enriched


async def get_news(entity: dict) -> list[dict]:
    name = entity.get("name") or entity.get("id") or "Entity"
    coordinates = entity.get("coordinates")
    settings = get_settings()
    news_api_key = settings.news_api_key
    gnews_api_key = settings.gnews_api_key

    if not news_api_key and not gnews_api_key:
        fallback = _fallback_news(str(name), "local", "Placeholder news item", coordinates)
        return tag_articles(geocode_articles(fallback))

    if news_api_key:
        try:
            news = await _fetch_newsapi(str(name), news_api_key)
            if news:
                normalized = _with_default_coordinates(news, coordinates)
                return tag_articles(geocode_articles(normalized))
        except Exception:
            pass

    if gnews_api_key:
        try:
            news = await _fetch_gnews(str(name), gnews_api_key)
            if news:
                normalized = _with_default_coordinates(news, coordinates)
                return tag_articles(geocode_articles(normalized))
        except Exception:
            pass

    fallback = _fallback_news(str(name), "fallback", "Fallback news item", coordinates)
    return tag_articles(geocode_articles(fallback))
