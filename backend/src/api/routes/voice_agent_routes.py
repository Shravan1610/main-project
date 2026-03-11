from fastapi import APIRouter, File, Form, UploadFile

from src.api.controllers.voice_agent_controller import fetch_voice_tools, transcribe_voice_audio

router = APIRouter()


@router.get("/voice-agent/tools")
async def voice_agent_tools() -> dict:
    return fetch_voice_tools()


@router.post("/voice-agent/transcribe")
async def voice_agent_transcribe(
    audio: UploadFile = File(...),
    tools: str | None = Form(default=None),
) -> dict:
    return await transcribe_voice_audio(audio=audio, tools=tools)
