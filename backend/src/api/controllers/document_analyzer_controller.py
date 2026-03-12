from __future__ import annotations

from fastapi import HTTPException, UploadFile

from src.api.controllers._service_loader import load_function

analyze_document_input = load_function(
    "features/document-analyzer/services/document_analysis_edge_proxy_service.py",
    "analyze_document_input",
)
list_document_analysis_runs = load_function(
    "features/document-analyzer/services/document_analysis_edge_proxy_service.py",
    "list_document_analysis_runs",
)


async def analyze_document_request(
    input_type: str,
    document: UploadFile | None,
    url: str | None,
    webpage: str | None,
) -> dict:
    normalized = input_type.strip().lower()
    valid_types = {"document", "url", "webpage"}
    if normalized not in valid_types:
        raise HTTPException(status_code=400, detail=f"input_type must be one of {sorted(valid_types)}")

    document_bytes = await document.read() if document else None
    if normalized == "document" and not document_bytes:
        raise HTTPException(status_code=400, detail="Document file is required for input_type=document")
    if normalized == "url" and not url:
        raise HTTPException(status_code=400, detail="URL is required for input_type=url")
    if normalized == "webpage" and not webpage:
        raise HTTPException(status_code=400, detail="Webpage content is required for input_type=webpage")

    try:
        return await analyze_document_input(normalized, document_bytes, url, webpage)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Document analysis failed: {error}") from error


async def list_document_history_request(limit: int) -> dict:
    safe_limit = max(1, min(limit, 25))

    try:
        runs = await list_document_analysis_runs(safe_limit)
        return {"items": runs, "total": len(runs)}
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Document history failed: {error}") from error
