from __future__ import annotations

import asyncio
from dataclasses import dataclass

from src.shared.config import get_settings

try:
    from deepgram import DeepgramClient
except ModuleNotFoundError:  # optional dependency in local/dev environments
    DeepgramClient = None


@dataclass(frozen=True)
class VoiceTool:
    id: str
    label: str
    description: str


VOICE_TOOLS: list[VoiceTool] = [
    VoiceTool("search_entity", "Search Entity", "Find and focus an entity on the map."),
    VoiceTool("toggle_layers", "Toggle Layers", "Enable/disable map intelligence layers."),
    VoiceTool("summarize_news", "Summarize News", "Pull latest headlines and summarize."),
    VoiceTool("compare_entities", "Compare Entities", "Run side-by-side entity comparison."),
]


def get_voice_tools() -> list[dict]:
    return [
        {"id": item.id, "label": item.label, "description": item.description}
        for item in VOICE_TOOLS
    ]


def _guess_tool_suggestions(transcript: str, selected_tools: list[str]) -> list[str]:
    lower = transcript.lower()
    suggestions: list[str] = []
    tool_set = set(selected_tools)

    if "compare" in lower and "compare_entities" in tool_set:
        suggestions.append("compare_entities")
    if any(word in lower for word in ["layer", "overlay", "heatmap"]) and "toggle_layers" in tool_set:
        suggestions.append("toggle_layers")
    if any(word in lower for word in ["news", "headline", "brief"]) and "summarize_news" in tool_set:
        suggestions.append("summarize_news")
    if any(word in lower for word in ["company", "ticker", "find", "search"]) and "search_entity" in tool_set:
        suggestions.append("search_entity")

    if not suggestions and selected_tools:
        suggestions.append(selected_tools[0])

    return suggestions[:2]


def _transcribe_sync(audio_bytes: bytes, model: str, mimetype: str | None) -> str:
    if DeepgramClient is None:
        raise ValueError("Deepgram SDK is not installed. Run `pip install -r requirements.txt`.")

    settings = get_settings()
    if not settings.deepgram_api_key:
        raise ValueError("Missing DEEPGRAM_API_KEY in backend configuration.")

    client = DeepgramClient(api_key=settings.deepgram_api_key)
    response = client.listen.v1.media.transcribe_file(
        request=audio_bytes,
        model=model,
        smart_format=True,
        punctuate=True,
        mimetype=mimetype,
    )

    results = getattr(response, "results", None)
    if not results or not getattr(results, "channels", None):
        return ""

    alternatives = results.channels[0].alternatives if results.channels else []
    if not alternatives:
        return ""

    transcript = alternatives[0].transcript or ""
    return str(transcript).strip()


async def transcribe_audio_with_tools(
    audio_bytes: bytes,
    selected_tools: list[str],
    mimetype: str | None,
) -> dict:
    transcript = await asyncio.to_thread(
        _transcribe_sync,
        audio_bytes,
        "nova-3",
        mimetype,
    )
    suggestions = _guess_tool_suggestions(transcript, selected_tools)

    return {
        "transcript": transcript,
        "toolSuggestions": suggestions,
        "selectedTools": selected_tools,
    }
