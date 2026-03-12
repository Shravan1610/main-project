from __future__ import annotations

import io
import re
from typing import Any

from fastapi import HTTPException, UploadFile

from src.api.controllers._service_loader import load_function

_analyze_disclosure_gaps = load_function(
    "features/regulatory-compliance/services/disclosure_gap_service.py",
    "analyze_disclosure_gaps",
)
_analyze_compliance_risk = load_function(
    "features/regulatory-compliance/services/compliance_risk_service.py",
    "analyze_compliance_risk",
)


async def _resolve_text(
    input_type: str,
    document: UploadFile | None,
    url: str | None,
    webpage: str | None,
) -> str:
    _resolve = load_function(
        "features/document-analyzer/services/document_analysis_service.py",
        "_resolve_text",
    )

    document_bytes = await document.read() if document else None
    return await _resolve(input_type, document_bytes, url, webpage)


def _parse_frameworks(raw: str | None) -> list[str]:
    if not raw:
        return ["GRI", "TCFD"]
    return [fw.strip().upper() for fw in re.split(r"[,;\s]+", raw) if fw.strip()]


async def analyze_disclosure_gaps_request(
    input_type: str,
    document: UploadFile | None,
    url: str | None,
    webpage: str | None,
    frameworks: str | None,
) -> dict[str, Any]:
    normalized = input_type.strip().lower()
    valid_types = {"document", "url", "webpage"}
    if normalized not in valid_types:
        raise HTTPException(status_code=400, detail=f"input_type must be one of {sorted(valid_types)}")

    if normalized == "document" and not document:
        raise HTTPException(status_code=400, detail="Document file is required for input_type=document")
    if normalized == "url" and not url:
        raise HTTPException(status_code=400, detail="URL is required for input_type=url")
    if normalized == "webpage" and not webpage:
        raise HTTPException(status_code=400, detail="Webpage content is required for input_type=webpage")

    try:
        text = await _resolve_text(normalized, document, url, webpage)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Text extraction failed: {exc}") from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from the input")

    fw_list = _parse_frameworks(frameworks)

    try:
        return await _analyze_disclosure_gaps(text, fw_list)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Disclosure gap analysis failed: {exc}") from exc


async def analyze_compliance_risk_request(
    input_type: str,
    document: UploadFile | None,
    url: str | None,
    webpage: str | None,
    frameworks: str | None,
) -> dict[str, Any]:
    normalized = input_type.strip().lower()
    valid_types = {"document", "url", "webpage"}
    if normalized not in valid_types:
        raise HTTPException(status_code=400, detail=f"input_type must be one of {sorted(valid_types)}")

    if normalized == "document" and not document:
        raise HTTPException(status_code=400, detail="Document file is required for input_type=document")
    if normalized == "url" and not url:
        raise HTTPException(status_code=400, detail="URL is required for input_type=url")
    if normalized == "webpage" and not webpage:
        raise HTTPException(status_code=400, detail="Webpage content is required for input_type=webpage")

    try:
        text = await _resolve_text(normalized, document, url, webpage)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Text extraction failed: {exc}") from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from the input")

    fw_list = _parse_frameworks(frameworks)

    try:
        return await _analyze_compliance_risk(text, fw_list)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Compliance risk analysis failed: {exc}") from exc
