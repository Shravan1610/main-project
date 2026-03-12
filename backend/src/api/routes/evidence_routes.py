from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, File, Form, Query, UploadFile
from pydantic import BaseModel, Field

from src.api.controllers.evidence_controller import (
    apply_review_decision,
    connect_google_integration,
    create_claim_record,
    fetch_claim_trace,
    fetch_dashboard_summary,
    fetch_document,
    fetch_documents,
    fetch_review_tasks,
    ingest_email_document,
    run_extraction,
    sync_google_integration,
    upload_document,
)

router = APIRouter()


class EmailIngestRequest(BaseModel):
    organization_id: str = Field(default="org_demo")
    facility_id: str | None = None
    supplier_id: str | None = None
    document_type: Literal["utility_bill", "fuel_invoice", "renewable_certificate"]
    period_start: str | None = None
    period_end: str | None = None
    region: str | None = None
    currency: str | None = None
    actor_id: str = Field(default="system")
    from_email: str = Field(min_length=3)
    subject: str = Field(min_length=3)
    body: str = Field(min_length=1)


class ExtractionRunRequest(BaseModel):
    actor_id: str = Field(default="system")
    overrides: dict[str, Any] | None = None


class ReviewDecisionRequest(BaseModel):
    reviewer_id: str = Field(min_length=1)
    decision: Literal["approved", "rejected", "superseded"]
    notes: str | None = None
    overrides: dict[str, Any] | None = None


class ClaimCreateRequest(BaseModel):
    organization_id: str = Field(default="org_demo")
    facility_id: str | None = None
    claim_type: Literal["scope1_emissions", "scope2_emissions", "renewable_electricity"]
    statement: str = Field(min_length=5)
    period_start: str | None = None
    period_end: str | None = None
    evidence_record_ids: list[str] = Field(min_length=1)
    created_by: str = Field(default="system")


class GoogleConnectRequest(BaseModel):
    organization_id: str = Field(default="org_demo")
    actor_id: str = Field(default="system")
    user_email: str = Field(min_length=5)
    supabase_user_id: str = Field(min_length=3)
    provider_token: str | None = None
    provider_refresh_token: str | None = None
    granted_scopes: list[str] | None = None


class GoogleSyncRequest(BaseModel):
    organization_id: str = Field(default="org_demo")
    actor_id: str = Field(default="system")
    scope: Literal["last_90_days", "last_180_days", "all_mail"] = "last_180_days"
    query_hint: str | None = None


@router.post("/evidence/documents/upload")
async def evidence_upload_document(
    organization_id: str = Form(...),
    facility_id: str | None = Form(default=None),
    supplier_id: str | None = Form(default=None),
    document_type: str = Form(...),
    period_start: str | None = Form(default=None),
    period_end: str | None = Form(default=None),
    region: str | None = Form(default=None),
    currency: str | None = Form(default=None),
    actor_id: str = Form(default="system"),
    document: UploadFile = File(...),
) -> dict:
    content = await document.read()
    return upload_document(
        organization_id=organization_id,
        facility_id=facility_id,
        supplier_id=supplier_id,
        document_type=document_type,
        period_start=period_start,
        period_end=period_end,
        region=region,
        currency=currency,
        actor_id=actor_id,
        file_name=document.filename or "uploaded-document",
        content_type=document.content_type,
        file_bytes=content,
    )


@router.post("/evidence/documents/email-ingest")
async def evidence_email_ingest(payload: EmailIngestRequest) -> dict:
    return ingest_email_document(
        organization_id=payload.organization_id,
        facility_id=payload.facility_id,
        supplier_id=payload.supplier_id,
        document_type=payload.document_type,
        period_start=payload.period_start,
        period_end=payload.period_end,
        region=payload.region,
        currency=payload.currency,
        actor_id=payload.actor_id,
        from_email=payload.from_email,
        subject=payload.subject,
        body=payload.body,
    )


@router.get("/evidence/documents")
def evidence_list_documents() -> dict:
    return fetch_documents()


@router.get("/evidence/documents/{document_id}")
def evidence_get_document(document_id: str) -> dict:
    return fetch_document(document_id)


@router.post("/evidence/extractions/{document_id}/run")
def evidence_run_extraction(document_id: str, payload: ExtractionRunRequest) -> dict:
    return run_extraction(document_id=document_id, actor_id=payload.actor_id, overrides=payload.overrides)


@router.get("/evidence/review-tasks")
def evidence_list_review_tasks(status: str | None = Query(default=None)) -> dict:
    return fetch_review_tasks(status=status)


@router.patch("/evidence/review-tasks/{task_id}")
def evidence_update_review_task(task_id: str, payload: ReviewDecisionRequest) -> dict:
    return apply_review_decision(
        task_id=task_id,
        reviewer_id=payload.reviewer_id,
        decision=payload.decision,
        notes=payload.notes,
        overrides=payload.overrides,
    )


@router.post("/evidence/claims")
def evidence_create_claim(payload: ClaimCreateRequest) -> dict:
    return create_claim_record(
        organization_id=payload.organization_id,
        facility_id=payload.facility_id,
        claim_type=payload.claim_type,
        statement=payload.statement,
        period_start=payload.period_start,
        period_end=payload.period_end,
        evidence_record_ids=payload.evidence_record_ids,
        created_by=payload.created_by,
    )


@router.get("/evidence/claims/{claim_id}/trace")
def evidence_get_claim_trace(claim_id: str) -> dict:
    return fetch_claim_trace(claim_id)


@router.get("/evidence/dashboard/summary")
def evidence_dashboard_summary() -> dict:
    return fetch_dashboard_summary()


@router.post("/evidence/integrations/google/supabase-connect")
def evidence_connect_google(payload: GoogleConnectRequest) -> dict:
    return connect_google_integration(
        organization_id=payload.organization_id,
        actor_id=payload.actor_id,
        user_email=payload.user_email,
        supabase_user_id=payload.supabase_user_id,
        provider_token=payload.provider_token,
        provider_refresh_token=payload.provider_refresh_token,
        granted_scopes=payload.granted_scopes,
    )


@router.post("/evidence/integrations/google/sync")
def evidence_sync_google(payload: GoogleSyncRequest) -> dict:
    return sync_google_integration(
        organization_id=payload.organization_id,
        actor_id=payload.actor_id,
        scope=payload.scope,
        query_hint=payload.query_hint,
    )
