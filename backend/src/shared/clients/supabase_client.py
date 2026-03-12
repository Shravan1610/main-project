"""Supabase client for persistence (write-through cache alongside in-memory store).

Uses the `supabase` Python library with service role key for backend operations.
Gracefully degrades if Supabase is not configured — returns None and logs a warning.
"""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

_client = None
_initialized = False


def get_supabase_client():
    """Get or create Supabase client singleton. Returns None if not configured."""
    global _client, _initialized

    if _initialized:
        return _client

    _initialized = True

    try:
        from src.shared.config import get_settings
        settings = get_settings()

        if not settings.supabase_url or not settings.supabase_service_role_key:
            logger.info("Supabase not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing). Persistence disabled.")
            return None

        from supabase import create_client
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        logger.info("Supabase client initialized for %s", settings.supabase_url)
        return _client

    except ImportError:
        logger.warning("supabase package not installed. Persistence disabled.")
        return None
    except Exception as exc:
        logger.warning("Failed to initialize Supabase client: %s", exc)
        return None


def _serialize_for_db(data: dict[str, Any]) -> dict[str, Any]:
    """Convert Python dict to DB-safe format (handle lists as JSON, etc)."""
    result = {}
    for key, value in data.items():
        if isinstance(value, (list, dict)):
            result[key] = json.dumps(value) if not isinstance(value, str) else value
        elif isinstance(value, set):
            result[key] = json.dumps(list(value))
        else:
            result[key] = value
    return result


# ── Evidence persistence functions ──────────────────────────────────────────

def persist_document(document: dict[str, Any]) -> bool:
    """Persist an evidence document to Supabase. Returns True on success."""
    client = get_supabase_client()
    if client is None:
        return False
    try:
        row = {k: v for k, v in document.items() if k != "text_preview"}  # skip large text
        row["text_preview"] = (document.get("text_preview") or "")[:500]
        client.table("evidence_documents").upsert(row).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist document %s: %s", document.get("id"), exc)
        return False


def persist_extraction(extraction: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_extractions").upsert(extraction).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist extraction %s: %s", extraction.get("id"), exc)
        return False


def persist_activity_record(record: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_activity_records").upsert(record).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist activity record %s: %s", record.get("id"), exc)
        return False


def persist_review_task(task: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_review_tasks").upsert(task).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist review task %s: %s", task.get("id"), exc)
        return False


def persist_approval_decision(decision: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_approval_decisions").upsert(decision).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist approval decision %s: %s", decision.get("id"), exc)
        return False


def persist_claim(claim: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_claims").upsert(claim).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist claim %s: %s", claim.get("id"), exc)
        return False


def persist_audit_event(event: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_audit_events").upsert(event).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist audit event %s: %s", event.get("id"), exc)
        return False


def persist_google_connection(connection: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        # Don't persist actual tokens to database for security
        row = {k: v for k, v in connection.items()
               if k not in ("provider_token", "provider_refresh_token")}
        client.table("evidence_google_connections").upsert(row).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist google connection: %s", exc)
        return False


def persist_sync_run(sync_run: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("evidence_email_sync_runs").upsert(sync_run).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist sync run %s: %s", sync_run.get("id"), exc)
        return False


def persist_digital_trail_record(record: dict[str, Any]) -> bool:
    client = get_supabase_client()
    if client is None:
        return False
    try:
        client.table("digital_trail_records").upsert(record).execute()
        return True
    except Exception as exc:
        logger.warning("Failed to persist digital trail record: %s", exc)
        return False


# ── Hydration (load from Supabase on startup) ──────────────────────────────

def load_evidence_documents() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_documents").select("*").order("created_at", desc=True).limit(200).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load documents from Supabase: %s", exc)
        return []


def load_evidence_extractions() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_extractions").select("*").limit(500).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load extractions: %s", exc)
        return []


def load_activity_records() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_activity_records").select("*").limit(500).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load activity records: %s", exc)
        return []


def load_review_tasks() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_review_tasks").select("*").limit(500).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load review tasks: %s", exc)
        return []


def load_approval_decisions() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_approval_decisions").select("*").limit(500).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load approval decisions: %s", exc)
        return []


def load_claims() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_claims").select("*").limit(200).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load claims: %s", exc)
        return []


def load_audit_events() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_audit_events").select("*").order("timestamp", desc=True).limit(1000).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load audit events: %s", exc)
        return []


def load_google_connections() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_google_connections").select("*").limit(50).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load google connections: %s", exc)
        return []


def load_sync_runs() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("evidence_email_sync_runs").select("*").order("started_at", desc=True).limit(100).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load sync runs: %s", exc)
        return []


def load_digital_trail_records() -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is None:
        return []
    try:
        result = client.table("digital_trail_records").select("*").limit(500).execute()
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to load digital trail records: %s", exc)
        return []
