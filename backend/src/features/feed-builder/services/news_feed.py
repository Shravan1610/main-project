import json
from datetime import datetime, timezone

from src.shared.clients.http_client import get_http_client
from src.shared.clients.gemini_client import call_gemini_grounded
from src.shared.config import get_settings

NEWS_QUERY = "global markets OR policy OR regulation OR supply chain OR AI OR crypto"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _safe_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)


def _normalize_item(item: dict, source_name: str) -> dict:
    source = item.get("source")
    parsed_source = source_name
    if isinstance(source, dict):
        parsed_source = source.get("name") or source_name
    elif isinstance(source, str) and source.strip():
        parsed_source = source.strip()

    published = item.get("publishedAt") or item.get("published_at") or _now_iso()
    title = item.get("title") or "Market update"
    summary = item.get("description") or item.get("snippet") or item.get("summary")
    url = item.get("url") or item.get("link") or "https://example.com/news"

    return {
        "title": str(title).strip(),
        "summary": str(summary).strip() if summary else None,
        "source": parsed_source,
        "publishedAt": str(published),
        "url": str(url),
        "category": "general",
    }


def _parse_json_from_text(raw_text: str) -> list[dict] | None:
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [item for item in parsed if isinstance(item, dict)]
    except json.JSONDecodeError:
        return None
    return None


async def _fetch_newsapi(api_key: str, limit: int) -> list[dict]:
    client = get_http_client()
    response = await client.get(
        "https://newsapi.org/v2/everything",
        params={
            "q": NEWS_QUERY,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": min(limit, 10),
            "apiKey": api_key,
        },
    )
    response.raise_for_status()
    payload = response.json() if response.content else {}
    return [_normalize_item(item, "NewsAPI") for item in payload.get("articles", [])]


async def _fetch_gnews(api_key: str, limit: int) -> list[dict]:
    client = get_http_client()
    response = await client.get(
        "https://gnews.io/api/v4/search",
        params={
            "q": NEWS_QUERY,
            "lang": "en",
            "sortby": "publishedAt",
            "max": min(limit, 10),
            "token": api_key,
        },
    )
    response.raise_for_status()
    payload = response.json() if response.content else {}
    return [_normalize_item(item, "GNews") for item in payload.get("articles", [])]


async def _fetch_the_news(api_key: str, limit: int) -> list[dict]:
    client = get_http_client()
    response = await client.get(
        "https://api.thenewsapi.com/v1/news/all",
        params={
            "api_token": api_key,
            "search": NEWS_QUERY,
            "language": "en",
            "sort": "published_at",
            "limit": min(limit, 10),
        },
    )
    response.raise_for_status()
    payload = response.json() if response.content else {}
    return [_normalize_item(item, "TheNewsAPI") for item in payload.get("data", [])]


async def _summarize_with_gemini(items: list[dict]) -> list[dict]:
    settings = get_settings()
    api_key = settings.google_ai_studio_api_key

    if not api_key or not items:
        return items

    prompt_items: list[str] = []
    for index, item in enumerate(items, start=1):
        prompt_items.append(
            "\n".join(
                [
                    f"{index}.",
                    f"Title: {item.get('title', '')}",
                    f"Summary: {item.get('summary') or 'N/A'}",
                    f"Source: {item.get('source') or 'Unknown'}",
                ]
            )
        )

    prompt = "\n\n".join(
        [
            "You summarize financial and macro news for a terminal dashboard.",
            "Return ONLY a JSON array with objects: {\"index\": number, \"summary\": string}.",
            "Each summary must be <= 120 characters, factual, and no markdown.",
            "Items:",
            "\n\n".join(prompt_items),
        ]
    )

    parsed = await call_gemini_grounded(prompt, temperature=0.2)
    if not parsed or not isinstance(parsed, list):
        return items

    summarized = [dict(item) for item in items]
    for entry in parsed:
        if not isinstance(entry, dict):
            continue
        index = entry.get("index")
        summary = entry.get("summary")
        if not isinstance(index, int) or not isinstance(summary, str):
            continue
        target_index = index - 1
        if target_index < 0 or target_index >= len(summarized):
            continue
        clean_summary = summary.strip()
        if clean_summary:
            summarized[target_index]["summary"] = clean_summary

    return summarized


def _dedupe_sort(items: list[dict], limit: int) -> list[dict]:
    seen: set[str] = set()
    deduped: list[dict] = []
    for item in items:
        url = str(item.get("url") or "").strip().lower()
        title = str(item.get("title") or "").strip().lower()
        dedupe_key = url or title
        if not dedupe_key or dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        deduped.append(item)

    deduped.sort(key=lambda item: _safe_datetime(item.get("publishedAt")), reverse=True)
    return deduped[:limit]


def _fallback_news(limit: int) -> list[dict]:
    now = _now_iso()
    items = [
        {
            "title": "No live news APIs configured",
            "summary": "Add NewsAPI, GNews, and TheNewsAPI keys to enable live + Gemini summaries.",
            "source": "System",
            "publishedAt": now,
            "url": "https://example.com/news/setup",
            "category": "general",
        }
    ]
    return items[:limit]


async def fetch_news_feed(limit: int = 10) -> list[dict]:
    settings = get_settings()
    errors: list[str] = []
    aggregated: list[dict] = []

    if settings.news_api_key:
        try:
            aggregated.extend(await _fetch_newsapi(settings.news_api_key, limit))
        except Exception as error:  # pragma: no cover
            errors.append(f"newsapi:{error}")

    if settings.gnews_api_key:
        try:
            aggregated.extend(await _fetch_gnews(settings.gnews_api_key, limit))
        except Exception as error:  # pragma: no cover
            errors.append(f"gnews:{error}")

    if settings.the_news_api_key:
        try:
            aggregated.extend(await _fetch_the_news(settings.the_news_api_key, limit))
        except Exception as error:  # pragma: no cover
            errors.append(f"the_news:{error}")

    items = _dedupe_sort(aggregated, limit)
    if not items:
        return _fallback_news(limit)

    try:
        return await _summarize_with_gemini(items)
    except Exception:  # pragma: no cover
        return items
