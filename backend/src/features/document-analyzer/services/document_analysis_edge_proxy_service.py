from __future__ import annotations

import importlib.util
import io
import sys
from pathlib import Path
from typing import Any

from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


def _load_local_function(function_name: str):
    file_path = Path(__file__).resolve().with_name("document_analysis_service.py")
    module_name = "document_analysis_local_fallback"
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load local analyzer from {file_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    fn = getattr(module, function_name, None)
    if not callable(fn):
        raise AttributeError(f"Missing fallback function {function_name}")
    return fn


_local_analyze_document_input = _load_local_function("analyze_document_input")
_local_list_document_analysis_runs = _load_local_function("list_document_analysis_runs")


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)
    except Exception:
        return pdf_bytes.decode("utf-8", errors="ignore").strip()


def _resolve_document_text(document_bytes: bytes | None) -> str:
    if not document_bytes:
        return ""
    if document_bytes[:5] == b"%PDF-":
        return _extract_pdf_text(document_bytes)
    return document_bytes.decode("utf-8", errors="ignore").strip()


def _is_edge_ready() -> bool:
    settings = get_settings()
    return bool(
        settings.supabase_url.strip()
        and settings.supabase_service_role_key.strip()
        and settings.document_analyzer_edge_function_name.strip()
    )


def _edge_url() -> str:
    settings = get_settings()
    return (
        f"{settings.supabase_url.rstrip('/')}/functions/v1/"
        f"{settings.document_analyzer_edge_function_name.strip()}"
    )


def _edge_headers() -> dict[str, str]:
    service_role = get_settings().supabase_service_role_key.strip()
    return {
        "Authorization": f"Bearer {service_role}",
        "apikey": service_role,
        "Content-Type": "application/json",
    }


async def _invoke_edge_function(payload: dict[str, Any]) -> dict[str, Any]:
    client = get_http_client()
    response = await client.post(_edge_url(), headers=_edge_headers(), json=payload)
    response.raise_for_status()
    data = response.json() if response.content else {}
    if not isinstance(data, dict):
        raise ValueError("Edge function returned invalid payload")
    return data


async def analyze_document_input(
    input_type: str,
    document_bytes: bytes | None,
    url: str | None,
    webpage: str | None,
) -> dict:
    if _is_edge_ready():
        text = _resolve_document_text(document_bytes) if input_type == "document" else None
        payload = {
            "inputType": input_type,
            "text": text,
            "url": url,
            "webpage": webpage,
        }
        try:
            return await _invoke_edge_function(payload)
        except Exception:
            pass

    return await _local_analyze_document_input(input_type, document_bytes, url, webpage)


async def list_document_analysis_runs(limit: int = 10) -> list[dict[str, Any]]:
    if _is_edge_ready():
        client = get_http_client()
        settings = get_settings()
        response = await client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/document_analyzer_runs",
            headers={
                "Authorization": f"Bearer {settings.supabase_service_role_key.strip()}",
                "apikey": settings.supabase_service_role_key.strip(),
            },
            params={
                "select": "id,input_type,analysis_engine,model_status,source,content_length,extraction,ai_analytics,created_at",
                "order": "created_at.desc",
                "limit": str(max(1, min(limit, 25))),
            },
        )
        response.raise_for_status()
        payload = response.json() if response.content else []
        if isinstance(payload, list):
            return payload
        return []

    return await _local_list_document_analysis_runs(limit)
