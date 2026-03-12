"""Shared Gemini client using the google-genai SDK with Google Search grounding."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from google import genai
from google.genai import types

from src.shared.config import get_settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


def _get_client() -> genai.Client | None:
    global _client
    settings = get_settings()
    api_key = settings.google_ai_studio_api_key.strip()
    if not api_key:
        logger.warning("GEMINI_API_KEY / GOOGLE_AI_STUDIO_API_KEY not configured")
        return None
    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


def _parse_json_from_text(text: str) -> Any | None:
    """Extract JSON from potentially markdown-wrapped LLM output."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def call_gemini_grounded(
    prompt: str,
    *,
    temperature: float = 0.3,
    json_response: bool = True,
) -> dict | list | None:
    """Call Gemini with Google Search grounding (for real-time / news data).

    Uses the google-genai SDK with GoogleSearch tool so responses
    are backed by live web results.
    """
    client = _get_client()
    if client is None:
        return None

    settings = get_settings()
    model = settings.gemini_model.strip()
    if not model:
        return None

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        ),
    ]

    tools = [
        types.Tool(google_search=types.GoogleSearch()),
    ]

    config = types.GenerateContentConfig(
        tools=tools,
        temperature=temperature,
        response_mime_type="application/json" if json_response else "text/plain",
    )

    try:
        response = await client.aio.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
        raw_text = response.text or ""
        if json_response:
            return _parse_json_from_text(raw_text)
        return raw_text  # type: ignore[return-value]
    except Exception:
        logger.exception("Gemini grounded call failed")
        return None


async def call_gemini(
    prompt: str,
    *,
    temperature: float = 0.3,
    json_response: bool = True,
) -> dict | list | None:
    """Call Gemini *without* grounding (for analysis / scoring tasks)."""
    client = _get_client()
    if client is None:
        return None

    settings = get_settings()
    model = settings.gemini_model.strip()
    if not model:
        return None

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        ),
    ]

    config = types.GenerateContentConfig(
        temperature=temperature,
        response_mime_type="application/json" if json_response else "text/plain",
    )

    try:
        response = await client.aio.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
        raw_text = response.text or ""
        if json_response:
            return _parse_json_from_text(raw_text)
        return raw_text  # type: ignore[return-value]
    except Exception:
        logger.exception("Gemini call failed")
        return None
