from __future__ import annotations

from dataclasses import dataclass

from src.shared.clients import get_http_client
from src.shared.config import get_settings


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


async def create_phone_call(phone_number: str) -> dict:
    """Create an outbound phone call via the VAPI REST API."""
    settings = get_settings()

    if not settings.vapi_api_key:
        raise ValueError("Missing VAPI_API_KEY in backend configuration.")
    if not settings.vapi_assistant_id:
        raise ValueError("Missing VAPI_ASSISTANT_ID in backend configuration.")

    client = get_http_client()

    payload: dict = {
        "assistantId": settings.vapi_assistant_id,
        "customer": {
            "number": phone_number,
        },
    }

    if settings.vapi_phone_number_id:
        payload["phoneNumberId"] = settings.vapi_phone_number_id

    response = await client.post(
        "https://api.vapi.ai/call/phone",
        json=payload,
        headers={
            "Authorization": f"Bearer {settings.vapi_api_key}",
            "Content-Type": "application/json",
        },
        timeout=15.0,
    )

    if response.status_code >= 400:
        detail = response.text
        try:
            detail = response.json().get("message", detail)
        except Exception:
            pass
        raise ValueError(f"VAPI API error ({response.status_code}): {detail}")

    return response.json()
