"""Digital Trail API routes — document integrity + forensic capture."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from src.api.controllers._service_loader import load_function
from src.api.deps import require_internal_key

# ── Dynamic imports via service loader (kebab-case dir) ─────────────────────
_register = load_function(
    "features/digital-trail/digital_trail_service.py", "register_document"
)
_verify = load_function(
    "features/digital-trail/digital_trail_service.py", "verify_document"
)
_verify_original = load_function(
    "features/digital-trail/digital_trail_service.py", "verify_against_original"
)
_get_record = load_function(
    "features/digital-trail/digital_trail_service.py", "get_record"
)
_get_forensic = load_function(
    "features/digital-trail/digital_trail_service.py", "get_forensic_trail"
)
_get_all = load_function(
    "features/digital-trail/digital_trail_service.py", "get_all_records"
)

router = APIRouter()


# ── Request schemas ─────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    hash: str = Field(min_length=64, max_length=64)
    asset_name: str = Field(min_length=1, max_length=256)
    asset_type: str = Field(default="document")
    encrypted_chunk: str | None = None


class VerifyBody(BaseModel):
    hash: str = Field(min_length=64, max_length=64)
    original_hash: str | None = None


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/digital-trail/register")
async def register_document(body: RegisterBody) -> dict[str, Any]:
    """Register a document hash on the blockchain."""
    return _register(
        hash_hex=body.hash,
        asset_name=body.asset_name,
        asset_type=body.asset_type,
        encrypted_chunk=body.encrypted_chunk,
    )


@router.post("/digital-trail/verify")
async def verify_document(body: VerifyBody, request: Request) -> dict[str, Any]:
    """Verify a document hash. Captures forensic data on mismatch."""
    client_ip = _extract_client_ip(request)

    if body.original_hash:
        return _verify_original(
            attempted_hash=body.hash,
            original_hash=body.original_hash,
            client_ip=client_ip,
        )

    return _verify(hash_hex=body.hash, client_ip=client_ip)


@router.get("/digital-trail/records")
async def list_records() -> dict[str, Any]:
    """List all registered documents."""
    records = _get_all()
    return {"records": records, "total": len(records)}


@router.get("/digital-trail/records/{hash_hex}")
async def get_record(hash_hex: str) -> dict[str, Any]:
    """Look up a public blockchain record by hash."""
    record = _get_record(hash_hex)
    if not record:
        return {"error": "Record not found", "hash": hash_hex}
    return {"record": record}


@router.get("/digital-trail/forensic/{hash_hex}", dependencies=[Depends(require_internal_key)])
async def get_forensic_trail(hash_hex: str) -> dict[str, Any]:
    """Return decrypted forensic trail for a document (system-only access).

    Requires the ``X-Internal-Key`` header to equal the server's
    ``SUPABASE_SERVICE_ROLE_KEY``.  This endpoint exposes PII (client IPs)
    and must not be publicly accessible.
    """
    trail = _get_forensic(hash_hex)
    if not trail:
        return {"error": "No forensic trail found", "hash": hash_hex}
    return trail


# ── Helpers ─────────────────────────────────────────────────────────────────

def _extract_client_ip(request: Request) -> str:
    """Extract client IP from request headers (supports proxies)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
