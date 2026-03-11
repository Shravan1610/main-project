from __future__ import annotations

import importlib.util
from pathlib import Path
import re
from typing import Any

from src.shared.clients.http_client import get_http_client


def _load_fetch_esg_scores():
    file_path = Path(__file__).resolve().parents[2] / "esg-bridge" / "services" / "esg_client.py"
    spec = importlib.util.spec_from_file_location("doc_analyzer_esg_client", file_path)
    if spec is None or spec.loader is None:
        raise ImportError("Unable to load ESG client")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    fn = getattr(module, "fetch_esg_scores", None)
    if not callable(fn):
        raise AttributeError("fetch_esg_scores function missing in ESG client")
    return fn


fetch_esg_scores = _load_fetch_esg_scores()


def _strip_html(content: str) -> str:
    cleaned = re.sub(r"<script[\s\S]*?</script>", " ", content, flags=re.IGNORECASE)
    cleaned = re.sub(r"<style[\s\S]*?</style>", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _fallback_extract(text: str) -> dict[str, Any]:
    emails = sorted(set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)))
    urls = sorted(set(re.findall(r"https?://[^\s)]+", text)))
    dates = sorted(set(re.findall(r"\b\d{4}-\d{2}-\d{2}\b", text)))

    org_candidates = re.findall(r"\b[A-Z][A-Za-z0-9&.-]{2,}(?:\s+[A-Z][A-Za-z0-9&.-]{2,})*\b", text)
    organizations = sorted(set(org_candidates[:20]))

    return {
        "entities": {
            "emails": emails[:10],
            "urls": urls[:10],
            "dates": dates[:10],
            "organizations": organizations[:10],
        },
        "summary": text[:450].strip(),
    }


def _try_model_extract(text: str) -> tuple[dict[str, Any], str]:
    try:
        model_path = Path(__file__).resolve().parents[1] / "models" / "nlp_extractor.py"
        if not model_path.exists():
            return _fallback_extract(text), "model_not_integrated"

        spec = importlib.util.spec_from_file_location("document_nlp_extractor", model_path)
        if spec is None or spec.loader is None:
            return _fallback_extract(text), "model_not_integrated"
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        extract_fn = getattr(module, "extract_document_entities", None)
        if not callable(extract_fn):
            return _fallback_extract(text), "model_not_integrated"

        payload = extract_fn(text)
        if isinstance(payload, dict):
            return payload, "model_loaded"
        return _fallback_extract(text), "model_invalid_output"
    except Exception:
        return _fallback_extract(text), "model_not_integrated"


async def _resolve_text(input_type: str, document_bytes: bytes | None, url: str | None, webpage: str | None) -> str:
    normalized = input_type.strip().lower()
    if normalized == "document":
        if not document_bytes:
            return ""
        return document_bytes.decode("utf-8", errors="ignore").strip()

    if normalized == "url":
        if not url:
            return ""
        client = get_http_client()
        response = await client.get(url)
        response.raise_for_status()
        html = response.text
        return _strip_html(html)

    if normalized == "webpage":
        return _strip_html(webpage or "")

    return ""


def _derive_subject(text: str) -> str:
    for token in text.split():
        stripped = token.strip(",.()[]{}")
        if len(stripped) > 2 and stripped[0].isalpha():
            return stripped
    return "Document"


async def analyze_document_input(
    input_type: str,
    document_bytes: bytes | None,
    url: str | None,
    webpage: str | None,
) -> dict:
    text = await _resolve_text(input_type, document_bytes, url, webpage)
    if not text:
        return {
            "inputType": input_type,
            "contentLength": 0,
            "esg": None,
            "esk": None,
            "extraction": {"entities": {}, "summary": ""},
            "modelStatus": "empty_input",
            "source": {"url": url},
        }

    extraction, model_status = _try_model_extract(text)
    subject = _derive_subject(text)

    try:
        esg = await fetch_esg_scores(subject)
    except Exception:
        esg = {
            "overall_score": 50.0,
            "scores": [],
            "confidence": 0.2,
            "source": "fallback",
        }

    return {
        "inputType": input_type,
        "contentLength": len(text),
        "esg": esg,
        "esk": esg,
        "extraction": extraction,
        "modelStatus": model_status,
        "source": {"url": url},
    }
