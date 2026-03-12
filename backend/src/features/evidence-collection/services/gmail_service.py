"""Real Gmail API integration using OAuth tokens from Supabase.

Uses httpx to call Gmail REST API directly — no heavy google-api-python-client dependency.
Falls back gracefully if tokens are expired or API is unreachable.
"""

from __future__ import annotations

import base64
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

# Gmail search queries for ESG evidence documents
ESG_EVIDENCE_QUERIES = [
    "subject:(utility bill OR electricity bill OR power bill OR energy bill)",
    "subject:(fuel invoice OR diesel invoice OR gas invoice OR petrol invoice)",
    "subject:(renewable certificate OR renewable energy certificate OR REC)",
    "subject:(carbon report OR emissions report OR sustainability report)",
    "subject:(energy consumption OR energy usage)",
]

# Patterns to classify emails into evidence document types
DOCUMENT_TYPE_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "utility_bill": [
        re.compile(r"utility\s*bill|electricity\s*bill|power\s*bill|energy\s*bill|kwh|kilowatt|electric\s*usage|consumption\s*statement", re.IGNORECASE),
    ],
    "fuel_invoice": [
        re.compile(r"fuel\s*invoice|diesel|petrol|gasoline|gallons?\b|liters?\s*of\s*fuel|fleet\s*fuel|natural\s*gas\s*invoice", re.IGNORECASE),
    ],
    "renewable_certificate": [
        re.compile(r"renewable\s*(energy\s*)?certificate|REC\b|green\s*certificate|carbon\s*offset|carbon\s*credit|mwh.*certificate", re.IGNORECASE),
    ],
}

# Patterns to extract period from email body
PERIOD_PATTERN = re.compile(
    r"(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})",
    re.IGNORECASE,
)
MONTH_MAP = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
}

# Facility extraction pattern
FACILITY_PATTERN = re.compile(r"facility[\s_-]?([a-zA-Z0-9]+)", re.IGNORECASE)


async def refresh_access_token(
    refresh_token: str,
    client_id: str,
    client_secret: str,
) -> str | None:
    """Refresh a Google OAuth access token using the refresh token."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("access_token")
            logger.warning("Token refresh failed: %s %s", resp.status_code, resp.text[:200])
            return None
    except Exception as exc:
        logger.warning("Token refresh request failed: %s", exc)
        return None


async def search_gmail_messages(
    access_token: str,
    query: str,
    max_results: int = 50,
) -> list[dict[str, str]]:
    """Search Gmail for messages matching a query. Returns list of {id, threadId}."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{GMAIL_API_BASE}/messages",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"q": query, "maxResults": max_results},
            )
            if resp.status_code == 401:
                raise TokenExpiredError("Gmail access token expired")
            if resp.status_code != 200:
                logger.warning("Gmail search failed: %s %s", resp.status_code, resp.text[:200])
                return []
            data = resp.json()
            return data.get("messages", [])
    except TokenExpiredError:
        raise
    except Exception as exc:
        logger.warning("Gmail search request failed: %s", exc)
        return []


async def get_message_detail(
    access_token: str,
    message_id: str,
) -> dict[str, Any] | None:
    """Get full message detail from Gmail API. Returns parsed headers + body."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{GMAIL_API_BASE}/messages/{message_id}",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"format": "full"},
            )
            if resp.status_code == 401:
                raise TokenExpiredError("Gmail access token expired")
            if resp.status_code != 200:
                logger.warning("Gmail get message failed: %s", resp.status_code)
                return None
            return _parse_gmail_message(resp.json())
    except TokenExpiredError:
        raise
    except Exception as exc:
        logger.warning("Gmail get message request failed: %s", exc)
        return None


def _parse_gmail_message(raw: dict[str, Any]) -> dict[str, Any]:
    """Parse raw Gmail API message response into a clean structure."""
    headers_list = raw.get("payload", {}).get("headers", [])
    headers = {h["name"].lower(): h["value"] for h in headers_list}

    body_text = _extract_body_text(raw.get("payload", {}))

    # Parse received date
    internal_date_ms = raw.get("internalDate")
    received_at = None
    if internal_date_ms:
        try:
            received_at = datetime.fromtimestamp(int(internal_date_ms) / 1000, tz=timezone.utc).isoformat()
        except (ValueError, TypeError):
            pass

    return {
        "message_id": raw.get("id", ""),
        "thread_id": raw.get("threadId", ""),
        "subject": headers.get("subject", "(no subject)"),
        "from_email": headers.get("from", ""),
        "date": headers.get("date", ""),
        "received_at": received_at or headers.get("date", ""),
        "body": body_text,
        "snippet": raw.get("snippet", ""),
        "label_ids": raw.get("labelIds", []),
        "has_attachments": _has_attachments(raw.get("payload", {})),
    }


def _extract_body_text(payload: dict[str, Any]) -> str:
    """Extract plain text body from Gmail message payload (handles multipart)."""
    mime_type = payload.get("mimeType", "")

    # Direct text/plain
    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    # Multipart — recurse into parts
    parts = payload.get("parts", [])
    for part in parts:
        part_mime = part.get("mimeType", "")
        if part_mime == "text/plain":
            data = part.get("body", {}).get("data", "")
            if data:
                return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    # Try text/html as fallback (strip tags roughly)
    for part in parts:
        if part.get("mimeType") == "text/html":
            data = part.get("body", {}).get("data", "")
            if data:
                html = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
                return re.sub(r"<[^>]+>", " ", html).strip()

    # Nested multipart
    for part in parts:
        nested = _extract_body_text(part)
        if nested:
            return nested

    return ""


def _has_attachments(payload: dict[str, Any]) -> bool:
    """Check if message has file attachments."""
    for part in payload.get("parts", []):
        if part.get("filename"):
            return True
        if _has_attachments(part):
            return True
    return False


def classify_email_document_type(subject: str, body: str) -> str | None:
    """Classify an email into an evidence document type based on content patterns."""
    combined = f"{subject} {body}"
    for doc_type, patterns in DOCUMENT_TYPE_PATTERNS.items():
        for pattern in patterns:
            if pattern.search(combined):
                return doc_type
    return None


def extract_period_from_text(text: str) -> str | None:
    """Extract reporting period (YYYY-MM) from email text."""
    match = PERIOD_PATTERN.search(text)
    if match:
        month_name = match.group(1).lower()
        year = match.group(2)
        month_num = MONTH_MAP.get(month_name)
        if month_num:
            return f"{year}-{month_num}"
    return None


def extract_facility_id(text: str) -> str | None:
    """Try to extract a facility identifier from email text."""
    match = FACILITY_PATTERN.search(text)
    if match:
        return f"facility_{match.group(1).lower()}"
    return None


def build_gmail_search_query(scope_days: int | None, query_hint: str | None) -> str:
    """Build a Gmail search query combining ESG evidence keywords + scope + hint."""
    # Core ESG query
    core = "(utility bill OR fuel invoice OR renewable certificate OR energy bill OR diesel invoice OR emissions report OR sustainability report OR carbon offset)"

    parts = [core]

    # Date filter
    if scope_days:
        after_date = (datetime.now(timezone.utc) - timedelta(days=scope_days)).strftime("%Y/%m/%d")
        parts.append(f"after:{after_date}")

    # User-provided hint
    if query_hint and query_hint.strip():
        parts.append(query_hint.strip())

    return " ".join(parts)


class TokenExpiredError(Exception):
    """Raised when a Gmail access token has expired."""
    pass


async def fetch_evidence_emails(
    access_token: str,
    scope_days: int | None,
    query_hint: str | None,
    already_synced: set[str],
    max_results: int = 30,
) -> list[dict[str, Any]]:
    """High-level function: search Gmail, fetch details, classify as evidence.

    Returns a list of classified email dicts ready for evidence ingestion.
    Skips emails that are already synced or can't be classified.
    """
    query = build_gmail_search_query(scope_days, query_hint)
    logger.info("Gmail search query: %s", query)

    message_stubs = await search_gmail_messages(access_token, query, max_results)
    logger.info("Gmail returned %d message stubs", len(message_stubs))

    results: list[dict[str, Any]] = []

    for stub in message_stubs:
        msg_id = stub.get("id", "")
        if msg_id in already_synced:
            continue

        detail = await get_message_detail(access_token, msg_id)
        if detail is None:
            continue

        # Classify
        doc_type = classify_email_document_type(detail["subject"], detail["body"])
        if doc_type is None:
            continue

        # Extract metadata
        period = extract_period_from_text(f"{detail['subject']} {detail['body']}")
        facility = extract_facility_id(f"{detail['subject']} {detail['body']}")

        results.append({
            "message_id": msg_id,
            "thread_id": detail["thread_id"],
            "subject": detail["subject"],
            "from_email": detail["from_email"],
            "received_at": detail["received_at"],
            "body": detail["body"][:2000],  # truncate for storage
            "document_type": doc_type,
            "period": period,
            "facility_id": facility,
            "has_attachments": detail["has_attachments"],
            "snippet": detail["snippet"],
        })

    logger.info("Classified %d emails as evidence out of %d fetched", len(results), len(message_stubs))
    return results
