from fastapi import APIRouter

from src.api.controllers.voice_agent_controller import (
    PhoneCallRequest,
    fetch_voice_tools,
    start_phone_call,
)

router = APIRouter()


@router.get("/voice-agent/tools")
async def voice_agent_tools() -> dict:
    return fetch_voice_tools()


@router.post("/voice-agent/phone-call")
async def voice_agent_phone_call(body: PhoneCallRequest) -> dict:
    return await start_phone_call(body)
