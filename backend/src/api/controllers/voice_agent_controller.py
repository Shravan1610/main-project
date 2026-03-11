from __future__ import annotations

import json

from fastapi import HTTPException, UploadFile
from src.api.controllers._service_loader import load_function

get_voice_tools = load_function("features/voice-agent/services/voice_service.py", "get_voice_tools")
transcribe_audio_with_tools = load_function(
    "features/voice-agent/services/voice_service.py",
    "transcribe_audio_with_tools",
)


def fetch_voice_tools() -> dict:
    return {"tools": get_voice_tools()}


async def transcribe_voice_audio(audio: UploadFile, tools: str | None = None) -> dict:
    if audio is None:
        raise HTTPException(status_code=400, detail="Audio file is required.")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Uploaded audio is empty.")

    try:
        selected_tools = json.loads(tools) if tools else []
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=400, detail=f"Invalid tools payload: {error}") from error

    if not isinstance(selected_tools, list):
        raise HTTPException(status_code=400, detail="Tools payload must be a JSON array.")

    selected_tools = [str(item) for item in selected_tools if item]

    try:
        payload = await transcribe_audio_with_tools(audio_bytes, selected_tools, audio.content_type)
        return payload
    except ValueError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Voice transcription failed: {error}") from error
