"""Shared FastAPI dependency functions for authentication and authorization."""

from __future__ import annotations

import logging

from fastapi import Depends, Header, HTTPException, status

logger = logging.getLogger(__name__)


def _get_service_role_key() -> str:
    from src.shared.config import get_settings
    return get_settings().supabase_service_role_key


def require_internal_key(
    x_internal_key: str | None = Header(default=None, alias="x-internal-key"),
    service_key: str = Depends(_get_service_role_key),
) -> None:
    """Dependency that enforces an internal API key for system-only endpoints.

    The caller must supply the ``X-Internal-Key`` header containing the
    ``SUPABASE_SERVICE_ROLE_KEY`` value.  This prevents public access to
    endpoints that expose sensitive or PII-containing data.
    """
    if not service_key:
        logger.warning("SUPABASE_SERVICE_ROLE_KEY is not configured; denying access to protected endpoint.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal key validation is not configured on this server.",
        )
    if x_internal_key is None or x_internal_key != service_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-Internal-Key header.",
        )


def require_supabase_jwt(
    authorization: str | None = Header(default=None),
    x_supabase_user_id: str | None = Header(default=None, alias="x-supabase-user-id"),
) -> str:
    """Dependency that validates a Supabase JWT from the Authorization header.

    Returns the authenticated user's subject (Supabase user UUID) so route
    handlers can enforce per-user authorization (e.g. ensuring
    ``supabase_user_id`` in the request body matches the authenticated caller).

    Raises HTTP 401 when the token is absent or invalid, and HTTP 403 when the
    JWT subject does not match the ``X-Supabase-User-Id`` header supplied by
    the client.
    """
    from src.shared.config import get_settings

    settings = get_settings()

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header (expected 'Bearer <jwt>').",
        )

    token = authorization.removeprefix("Bearer ").strip()

    subject: str | None = None

    if not settings.supabase_url or not settings.supabase_service_role_key:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured; "
            "cannot validate JWT for protected endpoint."
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT validation is not configured on this server.",
        )

    try:
        from supabase import create_client

        client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        user_response = client.auth.get_user(token)
        if user_response and user_response.user:
            subject = user_response.user.id
    except Exception as exc:
        logger.warning("JWT validation via Supabase admin API failed: %s", exc)

    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    if x_supabase_user_id and x_supabase_user_id != subject:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user does not match the requested supabase_user_id.",
        )

    return subject
