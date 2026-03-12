"""Pydantic models for the Digital Trail feature."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ── Requests ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    hash: str = Field(min_length=64, max_length=64, description="SHA-256 hex digest")
    asset_name: str = Field(min_length=1, max_length=256)
    asset_type: str = Field(default="document")
    encrypted_chunk: str | None = Field(default=None, description="Base64-encoded AES-encrypted PDF fragment")


class VerifyRequest(BaseModel):
    hash: str = Field(min_length=64, max_length=64, description="SHA-256 hex digest to verify")


# ── Registry record ─────────────────────────────────────────────────────────

class RegistryRecord(BaseModel):
    hash: str
    asset_name: str
    asset_type: str
    encrypted_chunk: str | None = None
    blockchain_tx: str
    registered_at: str
    last_verified_at: str | None = None
    version: int = 1
    status: Literal["anchored", "pending"] = "anchored"


# ── Forensic data ───────────────────────────────────────────────────────────

class ForensicEvent(BaseModel):
    ip: str
    timestamp: str
    attempted_hash: str
    original_hash: str


class ForensicTrailResponse(BaseModel):
    original_hash: str
    asset_name: str
    events: list[ForensicEvent]
    total_tamper_attempts: int


# ── Responses ───────────────────────────────────────────────────────────────

class RegisterResponse(BaseModel):
    record: RegistryRecord
    message: str = "Document registered and anchored on blockchain."


class VerifyResponse(BaseModel):
    status: Literal["verified", "tampered", "not_found"]
    hash: str
    record: RegistryRecord | None = None
    forensic_event: ForensicEvent | None = None
    message: str
