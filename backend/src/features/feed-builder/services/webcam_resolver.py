from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from httpx import HTTPStatusError

from src.shared.clients import get_http_client
from src.shared.clients.cache_client import get_cached, set_cached
from src.shared.config import get_settings
from src.shared.utils.logger import get_logger

logger = get_logger(__name__)

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"
EMBED_TITLE_BLOCKLIST = ("replay", "highlights", "premiere", "recap")
WEBCAM_KEYWORDS = ("webcam", "live cam", "earth cam", "traffic cam", "city cam", "skyline", "downtown")
SHORT_CACHE_SECONDS = 90
RESOLVE_WINDOW_SECONDS = 180
PROVIDER_BLOCK_CACHE_SECONDS = RESOLVE_WINDOW_SECONDS

WebcamSource = dict[str, str | list[str]]

REGION_SOURCES: dict[str, list[WebcamSource]] = {
    "iran": [
        {"id": "tehran", "city": "Tehran", "country": "Iran", "query": "Tehran live webcam"},
        {"id": "tel-aviv", "city": "Tel Aviv", "country": "Israel", "query": "Tel Aviv live webcam"},
        {"id": "jerusalem", "city": "Jerusalem", "country": "Israel", "query": "Jerusalem live webcam"},
        {"id": "middle-east", "city": "Middle East", "country": "Multi", "query": "Middle East live webcam"},
    ],
    "middle-east": [
        {"id": "jerusalem", "city": "Jerusalem", "country": "Israel", "query": "Jerusalem live webcam"},
        {"id": "tehran", "city": "Tehran", "country": "Iran", "query": "Tehran live webcam"},
        {"id": "tel-aviv", "city": "Tel Aviv", "country": "Israel", "query": "Tel Aviv live webcam"},
        {"id": "mecca", "city": "Mecca", "country": "Saudi Arabia", "query": "Mecca live camera"},
    ],
    "europe": [
        {"id": "kyiv", "city": "Kyiv", "country": "Ukraine", "query": "Kyiv live webcam"},
        {"id": "london", "city": "London", "country": "UK", "query": "London live webcam"},
        {"id": "paris", "city": "Paris", "country": "France", "query": "Paris live webcam"},
        {"id": "odessa", "city": "Odessa", "country": "Ukraine", "query": "Odessa live webcam"},
    ],
    "americas": [
        {"id": "washington", "city": "Washington DC", "country": "USA", "query": "Washington DC live webcam"},
        {"id": "new-york", "city": "New York", "country": "USA", "query": "New York live webcam"},
        {"id": "los-angeles", "city": "Los Angeles", "country": "USA", "query": "Los Angeles live webcam"},
        {"id": "miami", "city": "Miami", "country": "USA", "query": "Miami live webcam"},
    ],
    "asia": [
        {"id": "tokyo", "city": "Tokyo", "country": "Japan", "query": "Tokyo live webcam"},
        {"id": "seoul", "city": "Seoul", "country": "South Korea", "query": "Seoul live webcam"},
        {"id": "taipei", "city": "Taipei", "country": "Taiwan", "query": "Taipei live webcam"},
        {"id": "sydney", "city": "Sydney", "country": "Australia", "query": "Sydney live webcam"},
    ],
    "space": [
        {"id": "iss", "city": "ISS Earth View", "country": "Space", "query": "ISS live earth view"},
        {"id": "nasa", "city": "NASA TV", "country": "Space", "query": "NASA live stream"},
        {"id": "spacex", "city": "SpaceX", "country": "Space", "query": "SpaceX live stream"},
        {"id": "earth-cam", "city": "Earth from Space", "country": "Space", "query": "earth live stream from space"},
    ],
}

REGION_SOURCES["all"] = [
    REGION_SOURCES["middle-east"][0],
    REGION_SOURCES["europe"][0],
    REGION_SOURCES["americas"][0],
    REGION_SOURCES["asia"][0],
]


def _valid_live_video(item: dict[str, Any]) -> bool:
    snippet = item.get("snippet") or {}
    live = item.get("liveStreamingDetails") or {}
    status = item.get("status") or {}
    title = str(snippet.get("title") or "").lower()

    if snippet.get("liveBroadcastContent") != "live":
        return False
    if not live.get("actualStartTime"):
        return False
    if live.get("actualEndTime"):
        return False
    if not status.get("embeddable", False):
        return False
    if any(blocked in title for blocked in EMBED_TITLE_BLOCKLIST):
        return False

    return True


def _score_video(item: dict[str, Any], source: WebcamSource) -> int:
    snippet = item.get("snippet") or {}
    title = str(snippet.get("title") or "").lower()
    description = str(snippet.get("description") or "").lower()
    haystack = f"{title} {description}"

    score = 0
    for keyword in WEBCAM_KEYWORDS:
        if keyword in haystack:
            score += 4

    city = str(source.get("city") or "").lower()
    country = str(source.get("country") or "").lower()
    if city and city in haystack:
        score += 6
    if country and country in haystack:
        score += 3

    return score


async def _fetch_live_candidates(source: WebcamSource, api_key: str) -> list[str]:
    params: dict[str, Any] = {
        "part": "snippet",
        "type": "video",
        "eventType": "live",
        "maxResults": 8,
        "q": source["query"],
        "key": api_key,
    }

    channel_id = source.get("channelId")
    if channel_id:
        params["channelId"] = channel_id

    client = get_http_client()
    response = await client.get(YOUTUBE_SEARCH_URL, params=params)
    response.raise_for_status()

    payload = response.json()
    ids: list[str] = []
    for item in payload.get("items", []):
        video_id = ((item.get("id") or {}).get("videoId") or "").strip()
        if video_id:
            ids.append(video_id)

    return ids


async def _hydrate_videos(video_ids: list[str], api_key: str) -> list[dict[str, Any]]:
    if not video_ids:
        return []

    client = get_http_client()
    response = await client.get(
        YOUTUBE_VIDEOS_URL,
        params={
            "part": "snippet,liveStreamingDetails,status",
            "id": ",".join(video_ids[:50]),
            "key": api_key,
            "maxResults": 50,
        },
    )
    response.raise_for_status()

    return response.json().get("items", [])


def _to_feed(source: WebcamSource, item: dict[str, Any], score: int) -> dict[str, Any]:
    snippet = item.get("snippet") or {}
    video_id = str(item.get("id") or "")

    return {
        "id": str(source["id"]),
        "city": str(source["city"]),
        "country": str(source["country"]),
        "region": str(source.get("region") or ""),
        "videoId": video_id,
        "title": snippet.get("title") or "Live webcam",
        "channelTitle": snippet.get("channelTitle") or "",
        "score": score,
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }


def _provider_block_cache_key(resolve_bucket: int) -> str:
    return f"webcams:provider-block:youtube:{resolve_bucket}"


async def _resolve_region(region: str, limit: int) -> list[dict[str, Any]]:
    settings = get_settings()
    api_key = settings.youtube_api_key
    if not api_key:
        return []

    resolve_bucket = int(datetime.now(timezone.utc).timestamp() // PROVIDER_BLOCK_CACHE_SECONDS)
    provider_block_key = _provider_block_cache_key(resolve_bucket)
    if get_cached(provider_block_key):
        return []

    sources = REGION_SOURCES.get(region, REGION_SOURCES["all"])
    region_sources: list[WebcamSource] = [{**source, "region": region} for source in sources]

    picked: list[dict[str, Any]] = []
    fallback_pool: list[dict[str, Any]] = []
    used_video_ids: set[str] = set()

    for source in region_sources:
        try:
            candidate_ids = await _fetch_live_candidates(source, api_key)
            videos = await _hydrate_videos(candidate_ids, api_key)
        except HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code in {401, 403}:
                set_cached(
                    provider_block_key,
                    {
                        "statusCode": status_code,
                        "blockedAt": datetime.now(timezone.utc).isoformat(),
                    },
                )
                logger.info(
                    "YouTube webcam resolver unavailable (HTTP %s); skipping webcam lookup for region=%s during this resolve window",
                    status_code,
                    region,
                )
                break
            logger.warning("Failed to resolve webcam source %s: %s", source.get("id"), exc)
            continue
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to resolve webcam source %s: %s", source.get("id"), exc)
            continue

        scored = []
        for item in videos:
            if not _valid_live_video(item):
                continue
            score = _score_video(item, source)
            scored.append((score, item))

        scored.sort(key=lambda pair: pair[0], reverse=True)

        if not scored:
            continue

        selected_for_source = False
        for score, item in scored:
            candidate_feed = _to_feed(source, item, score)
            candidate_video_id = str(candidate_feed.get("videoId") or "")
            if candidate_video_id in used_video_ids:
                continue

            used_video_ids.add(candidate_video_id)
            picked.append(candidate_feed)
            selected_for_source = True
            break

        if not selected_for_source:
            continue

        for score, item in scored:
            fallback_feed = _to_feed(source, item, score)
            fallback_video_id = str(fallback_feed.get("videoId") or "")
            if fallback_video_id in used_video_ids:
                continue
            fallback_pool.append(fallback_feed)

    if len(picked) >= limit:
        return picked[:limit]

    fallback_pool.sort(key=lambda feed: int(feed.get("score", 0)), reverse=True)
    for feed in fallback_pool:
        video_id = str(feed.get("videoId") or "")
        if video_id in used_video_ids:
            continue
        picked.append(feed)
        used_video_ids.add(video_id)
        if len(picked) >= limit:
            break

    return picked[:limit]


async def get_live_webcam_feeds(region: str = "all", limit: int = 4) -> dict[str, Any]:
    safe_region = region if region in REGION_SOURCES else "all"
    safe_limit = max(1, min(limit, 8))

    short_cache_bucket = int(datetime.now(timezone.utc).timestamp() // SHORT_CACHE_SECONDS)
    short_cache_key = f"webcams:short:{safe_region}:{safe_limit}:{short_cache_bucket}"
    cached_short = get_cached(short_cache_key)
    if cached_short is not None:
        return cached_short

    resolve_bucket = int(datetime.now(timezone.utc).timestamp() // RESOLVE_WINDOW_SECONDS)
    resolve_cache_key = f"webcams:resolve:{safe_region}:{safe_limit}:{resolve_bucket}"
    resolved = get_cached(resolve_cache_key)
    if resolved is None:
        feeds = await _resolve_region(safe_region, safe_limit)
        resolved = {
            "region": safe_region,
            "feeds": feeds,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "resolver": {
                "cacheSeconds": SHORT_CACHE_SECONDS,
                "reResolveSeconds": RESOLVE_WINDOW_SECONDS,
                "hasApiKey": bool(get_settings().youtube_api_key),
            },
        }
        set_cached(resolve_cache_key, resolved)

    set_cached(short_cache_key, resolved)
    return resolved
