from __future__ import annotations

import re

from fastapi import HTTPException
from pydantic import BaseModel, field_validator
from src.api.controllers._service_loader import load_function

get_voice_tools = load_function("features/voice-agent/services/voice_service.py", "get_voice_tools")
create_phone_call = load_function("features/voice-agent/services/voice_service.py", "create_phone_call")

# E.164 pattern: + followed by 1-15 digits
_E164_RE = re.compile(r"^\+[1-9]\d{1,14}$")


class PhoneCallRequest(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not _E164_RE.match(v):
            raise ValueError("Phone number must be in E.164 format (e.g. +14155551234)")
        return v


def fetch_voice_tools() -> dict:
    return {"tools": get_voice_tools()}


async def start_phone_call(body: PhoneCallRequest) -> dict:
    try:
        result = await create_phone_call(body.phone_number)
        return {
            "status": "initiated",
            "callId": result.get("id"),
            "phoneNumber": body.phone_number,
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Phone call failed: {error}") from error
