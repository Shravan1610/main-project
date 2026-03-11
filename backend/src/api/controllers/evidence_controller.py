from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from src.api.controllers._service_loader import load_function

create_uploaded_document = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "create_uploaded_document",
)
create_email_document = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "create_email_document",
)
run_document_extraction = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "run_document_extraction",
)
list_documents = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "list_documents",
)
get_document = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "get_document",
)
list_review_tasks = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "list_review_tasks",
)
submit_review_decision = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "submit_review_decision",
)
create_claim = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "create_claim",
)
get_claim_trace = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "get_claim_trace",
)
get_dashboard_summary = load_function(
    "features/evidence-collection/services/evidence_service.py",
    "get_dashboard_summary",
)


def upload_document(
    *,
    organization_id: str,
    facility_id: str | None,
    supplier_id: str | None,
    document_type: str,
    period_start: str | None,
    period_end: str | None,
    region: str | None,
    currency: str | None,
    actor_id: str,
    file_name: str,
    content_type: str | None,
    file_bytes: bytes,
) -> dict[str, Any]:
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded document is empty")
    try:
        return create_uploaded_document(
            organization_id=organization_id,
            facility_id=facility_id,
            supplier_id=supplier_id,
            document_type=document_type,
            period_start=period_start,
            period_end=period_end,
            region=region,
            currency=currency,
            actor_id=actor_id,
            file_name=file_name,
            content_type=content_type,
            file_bytes=file_bytes,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


def ingest_email_document(
    *,
    organization_id: str,
    facility_id: str | None,
    supplier_id: str | None,
    document_type: str,
    period_start: str | None,
    period_end: str | None,
    region: str | None,
    currency: str | None,
    actor_id: str,
    from_email: str,
    subject: str,
    body: str,
) -> dict[str, Any]:
    try:
        return create_email_document(
            organization_id=organization_id,
            facility_id=facility_id,
            supplier_id=supplier_id,
            document_type=document_type,
            period_start=period_start,
            period_end=period_end,
            region=region,
            currency=currency,
            actor_id=actor_id,
            from_email=from_email,
            subject=subject,
            body=body,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


def run_extraction(document_id: str, actor_id: str, overrides: dict[str, Any] | None) -> dict[str, Any]:
    try:
        return run_document_extraction(document_id, actor_id=actor_id, overrides=overrides)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=error.args[0]) from error


def fetch_documents() -> dict[str, Any]:
    return list_documents()


def fetch_document(document_id: str) -> dict[str, Any]:
    try:
        return get_document(document_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=error.args[0]) from error


def fetch_review_tasks(status: str | None = None) -> dict[str, Any]:
    return list_review_tasks(status)


def apply_review_decision(
    task_id: str,
    reviewer_id: str,
    decision: str,
    notes: str | None,
    overrides: dict[str, Any] | None,
) -> dict[str, Any]:
    try:
        return submit_review_decision(task_id, reviewer_id, decision, notes, overrides)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=error.args[0]) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


def create_claim_record(
    *,
    organization_id: str,
    facility_id: str | None,
    claim_type: str,
    statement: str,
    period_start: str | None,
    period_end: str | None,
    evidence_record_ids: list[str],
    created_by: str,
) -> dict[str, Any]:
    try:
        return create_claim(
            organization_id=organization_id,
            facility_id=facility_id,
            claim_type=claim_type,
            statement=statement,
            period_start=period_start,
            period_end=period_end,
            evidence_record_ids=evidence_record_ids,
            created_by=created_by,
        )
    except KeyError as error:
        raise HTTPException(status_code=404, detail=error.args[0]) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


def fetch_claim_trace(claim_id: str) -> dict[str, Any]:
    try:
        return get_claim_trace(claim_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=error.args[0]) from error


def fetch_dashboard_summary() -> dict[str, Any]:
    return get_dashboard_summary()
