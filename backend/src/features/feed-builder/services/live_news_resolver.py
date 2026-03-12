from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from src.shared.clients import get_http_client
from src.shared.clients.cache_client import get_cached, set_cached
from src.shared.utils.logger import get_logger

logger = get_logger(__name__)

SHORT_CACHE_SECONDS = 120
RESOLVE_WINDOW_SECONDS = 600  # 10 min — scraping is lightweight

NEWS_CHANNELS: list[dict[str, str]] = [
    {"id": "bloomberg", "label": "Bloomberg", "channelId": "UCIALMKvObZNtJ6AmdCLP7Lg", "channelTitle": "Bloomberg Television"},
    {"id": "skynews", "label": "SkyNews", "channelId": "UCoMdktPbSTixAyNGwb-UYkQ", "channelTitle": "Sky News"},
    {"id": "euronews", "label": "Euronews", "channelId": "UCSrZ3UV4jOidv8ppoVuvW9Q", "channelTitle": "euronews"},
    {"id": "dw", "label": "DW", "channelId": "UCknLrEdhRCp1aegoMqRaCZg", "channelTitle": "DW News"},
    {"id": "cnbc", "label": "CNBC", "channelId": "UCrp_UI8XtuYfpiqluWLD7Lw", "channelTitle": "CNBC Television"},
    {"id": "cnn", "label": "CNN", "channelId": "UCupvZG-5ko_eiXAupbDfxWw", "channelTitle": "CNN"},
    {"id": "france24", "label": "France 24", "channelId": "UCQfwfsi5VrQ8yKZ-UWmAEFg", "channelTitle": "FRANCE 24 English"},
    {"id": "alarabiya", "label": "AlArabiya", "channelId": "UCLmAUr6t2ScKbXMRIFnfkfQ", "channelTitle": "Al Arabiya English"},
    {"id": "aljazeera", "label": "AlJazeera", "channelId": "UCNye-wNBqNL5ZzHSJj3l8Bg", "channelTitle": "Al Jazeera English"},
]

_VIDEO_ID_RE = re.compile(r'"videoId":"([a-zA-Z0-9_-]{11})"')


async def _scrape_channel_live_video(channel_id: str) -> str | None:
    """Fetch the /live page for a channel and extract the videoId from the HTML."""
    url = f"https://www.youtube.com/channel/{channel_id}/live"
    client = get_http_client()
    try:
        response = await client.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
            follow_redirects=True,
            timeout=12.0,
        )
        if response.status_code != 200:
            logger.warning("YouTube channel page returned %s for %s", response.status_code, channel_id)
            return None

        html = response.text
        match = _VIDEO_ID_RE.search(html)
        if match:
            return match.group(1)

        return None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to scrape live video for channel %s: %s", channel_id, exc)
        return None


async def _resolve_all_channels() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for ch in NEWS_CHANNELS:
        video_id = await _scrape_channel_live_video(ch["channelId"])
        results.append({
            "id": ch["id"],
            "label": ch["label"],
            "channelId": ch["channelId"],
            "channelTitle": ch["channelTitle"],
            "videoId": video_id,
            "liveUrl": f"https://www.youtube.com/watch?v={video_id}" if video_id else f"https://www.youtube.com/channel/{ch['channelId']}/live",
        })

    return results


async def get_live_news_feeds() -> dict[str, Any]:
    short_bucket = int(datetime.now(timezone.utc).timestamp() // SHORT_CACHE_SECONDS)
    short_key = f"live-news:short:{short_bucket}"
    cached_short = get_cached(short_key)
    if cached_short is not None:
        return cached_short

    resolve_bucket = int(datetime.now(timezone.utc).timestamp() // RESOLVE_WINDOW_SECONDS)
    resolve_key = f"live-news:resolve:{resolve_bucket}"
    resolved = get_cached(resolve_key)
    if resolved is None:
        channels = await _resolve_all_channels()
        resolved = {
            "channels": channels,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "hasApiKey": True,
        }
        set_cached(resolve_key, resolved)

    set_cached(short_key, resolved)
    return resolved
