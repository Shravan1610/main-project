from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from datetime import datetime, timedelta, timezone
from statistics import mean
from threading import Lock
from typing import Any
from uuid import uuid4

MODEL_NAME = "gemini-3.1-flash-lite"
SUPPORTED_DOCUMENT_TYPES = {"utility_bill", "fuel_invoice", "renewable_certificate"}
SUPPORTED_CLAIM_TYPES = {"scope1_emissions", "scope2_emissions", "renewable_electricity"}
SUPPORTED_SYNC_SCOPES = {"last_90_days", "last_180_days", "all_mail"}

logger = logging.getLogger(__name__)

# ── Fallback demo email library (used when Gmail API is unavailable) ────────

EMAIL_LIBRARY = [
    {
        "message_id": "gmail-001",
        "thread_id": "thread-utility-001",
        "label": "utility_bill",
        "from_email": "billing@gridnorth.example",
        "subject": "January utility bill for Facility A",
        "body": "Facility A consumed 12400 kWh during January 2026. Attached monthly utility bill for payment.",
        "received_at": "2026-02-02T08:30:00+00:00",
        "facility_id": "facility_a",
    },
    {
        "message_id": "gmail-002",
        "thread_id": "thread-fuel-001",
        "label": "fuel_invoice",
        "from_email": "accounts@fleetpetro.example",
        "subject": "Fuel invoice for plant logistics",
        "body": "Invoice for 4800 gallons of diesel supplied to Facility B during January 2026.",
        "received_at": "2026-02-05T10:00:00+00:00",
        "facility_id": "facility_b",
    },
    {
        "message_id": "gmail-003",
        "thread_id": "thread-rec-001",
        "label": "renewable_certificate",
        "from_email": "registry@renewmatch.example",
        "subject": "Renewable energy certificate retirement confirmation",
        "body": "Certificate retired for 9800 MWh covering January 2026 load for Facility A.",
        "received_at": "2026-02-08T09:15:00+00:00",
        "facility_id": "facility_a",
    },
    {
        "message_id": "gmail-004",
        "thread_id": "thread-non-evidence-001",
        "label": "other",
        "from_email": "events@conference.example",
        "subject": "Sustainability summit invitation",
        "body": "Join us next month for the regional sustainability summit and networking dinner.",
        "received_at": "2026-01-27T14:20:00+00:00",
        "facility_id": None,
    },
]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _next_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:10]}"


def _parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        normalized = str(value).replace(",", "").strip()
        if not normalized:
            return None
        return float(normalized)
    except (TypeError, ValueError):
        return None


def _extract_quantity_and_unit(text: str) -> tuple[float | None, str | None]:
    pattern = re.compile(r"(\d+(?:\.\d+)?)\s*(kwh|mwh|l|liter|liters|gallon|gallons|kg|ton|tons)", re.IGNORECASE)
    match = pattern.search(text)
    if not match:
        return None, None
    quantity = _parse_float(match.group(1))
    unit = match.group(2).lower()
    return quantity, unit


def _normalize_activity_type(document_type: str) -> str:
    if document_type == "utility_bill":
        return "electricity_consumption"
    if document_type == "fuel_invoice":
        return "fuel_usage"
    return "renewable_electricity_support"


def _normalize_lifecycle_status(document: dict[str, Any], review_status: str) -> str:
    if review_status == "approved":
        return "approved"
    if review_status == "rejected":
        return "rejected"
    if review_status == "superseded":
        return "superseded"
    if document.get("status") == "ingested":
        return "mapped"
    return "needs_review"


def _required_field_issues(record: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    document_type = record["document_type"]

    if document_type in {"utility_bill", "fuel_invoice"}:
        if not record.get("facility_id"):
            issues.append("facility_id_missing")
        if not record.get("period_start") or not record.get("period_end"):
            issues.append("reporting_period_missing")

    if document_type == "renewable_certificate":
        if not record.get("period_start") or not record.get("period_end"):
            issues.append("certificate_period_missing")

    if record.get("quantity") is None:
        issues.append("quantity_missing")

    unit = record.get("unit")
    if unit is None or (isinstance(unit, str) and unit.strip() == ""):
        issues.append("unit_missing")

    return issues


def _build_review_notes(document_type: str, issues: list[str]) -> str:
    if not issues:
        return f"{document_type} extracted successfully; reviewer must confirm mapped values."
    return f"Needs review due to: {', '.join(issues)}"


def _coerce_period_start(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    if len(raw_value) == 7:
        return f"{raw_value}-01"
    return raw_value


def _coerce_period_end(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    if len(raw_value) == 7:
        return f"{raw_value}-28"
    return raw_value


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


class EvidenceStore:
    def __init__(self) -> None:
        self.lock = Lock()
        self.documents: dict[str, dict[str, Any]] = {}
        self.extractions: dict[str, dict[str, Any]] = {}
        self.activity_records: dict[str, dict[str, Any]] = {}
        self.review_tasks: dict[str, dict[str, Any]] = {}
        self.approval_decisions: dict[str, dict[str, Any]] = {}
        self.claims: dict[str, dict[str, Any]] = {}
        self.audit_events: dict[str, dict[str, Any]] = {}
        self.google_connections: dict[str, dict[str, Any]] = {}
        self.email_sync_runs: dict[str, dict[str, Any]] = {}
        self.synced_message_ids: set[str] = set()

    def _log_event(self, event_type: str, actor_id: str, entity_type: str, entity_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        event = {
            "id": _next_id("audit"),
            "event_type": event_type,
            "actor_id": actor_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "payload": payload,
            "timestamp": _utc_now(),
        }
        self.audit_events[event["id"]] = event
        return event

    def create_document(
        self,
        *,
        source_system: str,
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
        source_channel: str,
        source_reference: str | None,
        body_text: str | None = None,
    ) -> dict[str, Any]:
        if document_type not in SUPPORTED_DOCUMENT_TYPES:
            raise ValueError("Unsupported document_type. Supported values: utility_bill, fuel_invoice, renewable_certificate")

        document_id = _next_id("doc")
        digest = hashlib.sha256(file_bytes).hexdigest()
        timestamp = _utc_now()
        text_preview = (body_text or file_bytes.decode("utf-8", errors="ignore"))[:1200]

        document = {
            "id": document_id,
            "organization_id": organization_id,
            "facility_id": facility_id,
            "supplier_id": supplier_id,
            "document_type": document_type,
            "source_system": source_system,
            "source_channel": source_channel,
            "source_reference": source_reference,
            "file_name": file_name,
            "content_type": content_type,
            "file_size": len(file_bytes),
            "sha256": digest,
            "period_start": period_start,
            "period_end": period_end,
            "region": region,
            "currency": currency,
            "status": "ingested",
            "created_at": timestamp,
            "updated_at": timestamp,
            "text_preview": text_preview,
            "latest_extraction_id": None,
            "latest_activity_record_id": None,
            "latest_review_task_id": None,
        }
        self.documents[document_id] = document

        event = self._log_event(
            event_type="document_ingested",
            actor_id=actor_id,
            entity_type="document",
            entity_id=document_id,
            payload={
                "source_channel": source_channel,
                "document_type": document_type,
                "file_name": file_name,
            },
        )

        return {"document": document, "audit_event": event}

    def _create_or_replace_review_task(self, *, activity_record_id: str, actor_id: str, notes: str) -> dict[str, Any]:
        task = {
            "id": _next_id("review"),
            "activity_record_id": activity_record_id,
            "status": "needs_review",
            "notes": notes,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
            "resolved_at": None,
            "reviewer_id": None,
            "decision": None,
        }
        self.review_tasks[task["id"]] = task
        self._log_event(
            event_type="review_task_created",
            actor_id=actor_id,
            entity_type="review_task",
            entity_id=task["id"],
            payload={"activity_record_id": activity_record_id},
        )
        return task

    def run_extraction(self, *, document_id: str, actor_id: str, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
        document = self.documents.get(document_id)
        if document is None:
            raise KeyError("Document not found")

        text = document.get("text_preview", "")
        extracted_quantity, extracted_unit = _extract_quantity_and_unit(text)
        extraction_version = 1
        previous_activity_record_id: str | None = None
        previous_review_task_id: str | None = None
        if document.get("latest_extraction_id"):
            previous = self.extractions.get(document["latest_extraction_id"])
            if previous:
                extraction_version = int(previous.get("version", 1)) + 1
            previous_activity_record_id = document.get("latest_activity_record_id")
            previous_review_task_id = document.get("latest_review_task_id")

        quantity = _parse_float((overrides or {}).get("quantity"))
        if quantity is None:
            quantity = extracted_quantity

        unit = (overrides or {}).get("unit") or extracted_unit
        period_start = _coerce_period_start((overrides or {}).get("period_start") or document.get("period_start"))
        period_end = _coerce_period_end((overrides or {}).get("period_end") or document.get("period_end"))
        facility_id = (overrides or {}).get("facility_id") or document.get("facility_id")

        base_confidence = {
            "utility_bill": 0.78,
            "fuel_invoice": 0.8,
            "renewable_certificate": 0.86,
        }[document["document_type"]]
        confidence = base_confidence
        if quantity is not None:
            confidence += 0.07
        if unit:
            confidence += 0.05
        if period_start and period_end:
            confidence += 0.04
        if facility_id:
            confidence += 0.03
        confidence = min(0.99, round(confidence, 2))

        extraction = {
            "id": _next_id("extract"),
            "document_id": document_id,
            "version": extraction_version,
            "model_name": MODEL_NAME,
            "confidence_score": confidence,
            "extracted_fields": {
                "quantity": quantity,
                "unit": unit,
                "period_start": period_start,
                "period_end": period_end,
                "facility_id": facility_id,
                "activity_type": _normalize_activity_type(document["document_type"]),
            },
            "created_at": _utc_now(),
        }
        self.extractions[extraction["id"]] = extraction

        activity_record = {
            "id": _next_id("activity"),
            "organization_id": document["organization_id"],
            "facility_id": facility_id,
            "supplier_id": document.get("supplier_id"),
            "period_start": period_start,
            "period_end": period_end,
            "document_type": document["document_type"],
            "activity_type": _normalize_activity_type(document["document_type"]),
            "quantity": quantity,
            "unit": unit,
            "currency": document.get("currency"),
            "region": document.get("region"),
            "confidence_score": confidence,
            "source_document_id": document_id,
            "extraction_id": extraction["id"],
            "reviewer_status": "needs_review",
            "lifecycle_status": "mapped",
            "blocked_reasons": [],
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
        }

        issues = _required_field_issues(activity_record)
        if issues:
            activity_record["blocked_reasons"] = issues
        activity_record["lifecycle_status"] = _normalize_lifecycle_status(document, activity_record["reviewer_status"])
        self.activity_records[activity_record["id"]] = activity_record

        if previous_activity_record_id and previous_activity_record_id in self.activity_records:
            prev_record = self.activity_records[previous_activity_record_id]
            if prev_record.get("reviewer_status") == "needs_review":
                prev_record["reviewer_status"] = "superseded"
                prev_record["lifecycle_status"] = "superseded"
                prev_record["updated_at"] = _utc_now()
                self._log_event(
                    event_type="activity_record_superseded",
                    actor_id=actor_id,
                    entity_type="activity_record",
                    entity_id=previous_activity_record_id,
                    payload={"superseded_by_extraction": extraction["id"]},
                )

        if previous_review_task_id and previous_review_task_id in self.review_tasks:
            prev_task = self.review_tasks[previous_review_task_id]
            if prev_task.get("status") == "needs_review":
                prev_task["status"] = "superseded"
                prev_task["updated_at"] = _utc_now()
                self._log_event(
                    event_type="review_task_superseded",
                    actor_id=actor_id,
                    entity_type="review_task",
                    entity_id=previous_review_task_id,
                    payload={"superseded_by_extraction": extraction["id"]},
                )

        review_task = self._create_or_replace_review_task(
            activity_record_id=activity_record["id"],
            actor_id=actor_id,
            notes=_build_review_notes(document["document_type"], issues),
        )

        document["latest_extraction_id"] = extraction["id"]
        document["latest_activity_record_id"] = activity_record["id"]
        document["latest_review_task_id"] = review_task["id"]
        document["status"] = "mapped"
        document["updated_at"] = _utc_now()

        audit_event = self._log_event(
            event_type="document_extracted",
            actor_id=actor_id,
            entity_type="document",
            entity_id=document_id,
            payload={
                "extraction_id": extraction["id"],
                "activity_record_id": activity_record["id"],
                "confidence_score": confidence,
                "model_name": MODEL_NAME,
            },
        )

        return {
            "document": document,
            "extraction": extraction,
            "activity_record": activity_record,
            "review_task": review_task,
            "audit_event": audit_event,
        }

    def list_documents(self) -> dict[str, Any]:
        ordered = sorted(self.documents.values(), key=lambda item: item["created_at"], reverse=True)
        return {"documents": ordered, "total": len(ordered)}

    def get_document(self, document_id: str) -> dict[str, Any]:
        document = self.documents.get(document_id)
        if document is None:
            raise KeyError("Document not found")

        extraction = self.extractions.get(document.get("latest_extraction_id") or "")
        activity_record = self.activity_records.get(document.get("latest_activity_record_id") or "")
        review_task = self.review_tasks.get(document.get("latest_review_task_id") or "")

        linked_event_ids = {
            document_id,
            *(filter(None, [
                document.get("latest_extraction_id"),
                document.get("latest_activity_record_id"),
                document.get("latest_review_task_id"),
            ])),
        }
        events = [event for event in self.audit_events.values() if event["entity_id"] in linked_event_ids]
        events.sort(key=lambda item: item["timestamp"])

        return {
            "document": document,
            "extraction": extraction,
            "activity_record": activity_record,
            "review_task": review_task,
            "audit_events": events,
        }

    def list_review_tasks(self, status: str | None = None) -> dict[str, Any]:
        tasks = list(self.review_tasks.values())
        if status:
            tasks = [item for item in tasks if item["status"] == status]
        tasks.sort(key=lambda item: item["created_at"], reverse=True)
        return {"review_tasks": tasks, "total": len(tasks)}

    def apply_review_decision(
        self,
        *,
        task_id: str,
        reviewer_id: str,
        decision: str,
        notes: str | None,
        overrides: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if decision not in {"approved", "rejected", "superseded"}:
            raise ValueError("Decision must be one of: approved, rejected, superseded")

        task = self.review_tasks.get(task_id)
        if task is None:
            raise KeyError("Review task not found")

        activity_record = self.activity_records.get(task["activity_record_id"])
        if activity_record is None:
            raise KeyError("Activity record not found for review task")

        if overrides:
            for key in ("quantity", "unit", "facility_id", "period_start", "period_end"):
                if key in overrides:
                    activity_record[key] = overrides[key]
            activity_record["blocked_reasons"] = _required_field_issues(activity_record)

        task["status"] = decision
        task["decision"] = decision
        task["reviewer_id"] = reviewer_id
        task["notes"] = notes or task.get("notes")
        task["updated_at"] = _utc_now()
        task["resolved_at"] = _utc_now()

        activity_record["reviewer_status"] = decision
        activity_record["lifecycle_status"] = _normalize_lifecycle_status({}, decision)
        activity_record["updated_at"] = _utc_now()

        source_document = self.documents.get(activity_record["source_document_id"])
        if source_document is not None:
            source_document["status"] = decision
            source_document["updated_at"] = _utc_now()

        decision_record = {
            "id": _next_id("decision"),
            "review_task_id": task_id,
            "activity_record_id": activity_record["id"],
            "reviewer_id": reviewer_id,
            "decision": decision,
            "notes": notes,
            "overrides": overrides or {},
            "created_at": _utc_now(),
        }
        self.approval_decisions[decision_record["id"]] = decision_record

        audit_event = self._log_event(
            event_type="review_decision_recorded",
            actor_id=reviewer_id,
            entity_type="review_task",
            entity_id=task_id,
            payload={
                "decision": decision,
                "activity_record_id": activity_record["id"],
            },
        )

        return {
            "review_task": task,
            "activity_record": activity_record,
            "approval_decision": decision_record,
            "audit_event": audit_event,
        }

    def _claim_sufficiency(self, claim_type: str, evidence_records: list[dict[str, Any]]) -> list[str]:
        missing: list[str] = []
        if not evidence_records:
            missing.append("no_evidence_records")
            return missing

        if any(record.get("reviewer_status") != "approved" for record in evidence_records):
            missing.append("all_evidence_must_be_approved")

        document_types = {record.get("document_type") for record in evidence_records}
        if claim_type == "renewable_electricity" and "renewable_certificate" not in document_types:
            missing.append("renewable_certificate_required")
        if claim_type == "scope1_emissions" and "fuel_invoice" not in document_types:
            missing.append("fuel_invoice_required")
        if claim_type == "scope2_emissions" and "utility_bill" not in document_types:
            missing.append("utility_bill_required")

        for record in evidence_records:
            if record.get("document_type") in {"utility_bill", "fuel_invoice"}:
                if not record.get("facility_id"):
                    missing.append("facility_id_missing")
                if not record.get("period_start") or not record.get("period_end"):
                    missing.append("reporting_period_missing")

        seen: set[str] = set()
        ordered: list[str] = []
        for item in missing:
            if item in seen:
                continue
            seen.add(item)
            ordered.append(item)
        return ordered

    def create_claim(
        self,
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
        if claim_type not in SUPPORTED_CLAIM_TYPES:
            raise ValueError("Unsupported claim_type. Supported values: scope1_emissions, scope2_emissions, renewable_electricity")

        evidence_records: list[dict[str, Any]] = []
        for record_id in evidence_record_ids:
            record = self.activity_records.get(record_id)
            if record is None:
                raise KeyError(f"Evidence record not found: {record_id}")
            evidence_records.append(record)

        missing_requirements = self._claim_sufficiency(claim_type, evidence_records)
        claim = {
            "id": _next_id("claim"),
            "organization_id": organization_id,
            "facility_id": facility_id,
            "claim_type": claim_type,
            "statement": statement,
            "period_start": period_start,
            "period_end": period_end,
            "evidence_record_ids": evidence_record_ids,
            "sufficiency_status": "complete" if not missing_requirements else "incomplete",
            "missing_requirements": missing_requirements,
            "created_by": created_by,
            "created_at": _utc_now(),
            "updated_at": _utc_now(),
        }
        self.claims[claim["id"]] = claim

        audit_event = self._log_event(
            event_type="claim_created",
            actor_id=created_by,
            entity_type="claim",
            entity_id=claim["id"],
            payload={
                "claim_type": claim_type,
                "evidence_record_count": len(evidence_record_ids),
            },
        )

        return {
            "claim": claim,
            "evidence_records": evidence_records,
            "audit_event": audit_event,
        }

    def get_claim_trace(self, claim_id: str) -> dict[str, Any]:
        claim = self.claims.get(claim_id)
        if claim is None:
            raise KeyError("Claim not found")

        evidence_records = [
            record
            for record_id in claim["evidence_record_ids"]
            if (record := self.activity_records.get(record_id)) is not None
        ]
        document_ids = {record["source_document_id"] for record in evidence_records}
        extraction_ids = {record["extraction_id"] for record in evidence_records}
        review_task_ids = {
            task["id"]
            for task in self.review_tasks.values()
            if task["activity_record_id"] in claim["evidence_record_ids"]
        }
        decision_ids = {
            decision["id"]
            for decision in self.approval_decisions.values()
            if decision["activity_record_id"] in claim["evidence_record_ids"]
        }

        documents = [self.documents[document_id] for document_id in document_ids if document_id in self.documents]
        extractions = [self.extractions[extraction_id] for extraction_id in extraction_ids if extraction_id in self.extractions]
        review_tasks = [self.review_tasks[task_id] for task_id in review_task_ids if task_id in self.review_tasks]
        approval_decisions = [self.approval_decisions[decision_id] for decision_id in decision_ids if decision_id in self.approval_decisions]

        relevant_entity_ids = {claim_id, *document_ids, *extraction_ids, *review_task_ids, *decision_ids, *claim["evidence_record_ids"]}
        audit_events = [event for event in self.audit_events.values() if event["entity_id"] in relevant_entity_ids]
        audit_events.sort(key=lambda item: item["timestamp"])

        return {
            "claim": claim,
            "documents": sorted(documents, key=lambda item: item["created_at"]),
            "evidence_records": sorted(evidence_records, key=lambda item: item["created_at"]),
            "extractions": sorted(extractions, key=lambda item: item["created_at"]),
            "review_tasks": sorted(review_tasks, key=lambda item: item["created_at"]),
            "approval_decisions": sorted(approval_decisions, key=lambda item: item["created_at"]),
            "audit_events": audit_events,
        }

    def connect_google_workspace(
        self,
        *,
        organization_id: str,
        actor_id: str,
        user_email: str,
        supabase_user_id: str,
        provider_token: str | None,
        provider_refresh_token: str | None,
        granted_scopes: list[str] | None,
    ) -> dict[str, Any]:
        connection = {
            "id": f"gmail_{organization_id}",
            "organization_id": organization_id,
            "provider": "google_gmail",
            "status": "connected",
            "user_email": user_email,
            "auth_source": "supabase",
            "supabase_user_id": supabase_user_id,
            "provider_token": provider_token,
            "provider_refresh_token": provider_refresh_token,
            "provider_token_present": bool(provider_token),
            "provider_refresh_token_present": bool(provider_refresh_token),
            "granted_scopes": granted_scopes
            or [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
            "mailbox_label": "Past email evidence search",
            "connected_at": _utc_now(),
            "last_sync_at": self.google_connections.get(organization_id, {}).get("last_sync_at"),
        }
        self.google_connections[organization_id] = connection

        event = self._log_event(
            event_type="google_oauth_connected",
            actor_id=actor_id,
            entity_type="google_connection",
            entity_id=connection["id"],
            payload={
                "user_email": user_email,
                "auth_source": "supabase",
                "provider_token_present": bool(provider_token),
            },
        )

        return {
            "connection": connection,
            "oauth": {
                "status": "connected",
                "connect_url": "supabase.auth.signInWithOAuth(provider=google)",
                "callback_configured": True,
                "note": "Connected through Supabase Auth Google OAuth. Provider tokens are held in memory for the current runtime only.",
            },
            "audit_event": event,
        }

    def sync_google_mailbox(
        self,
        *,
        organization_id: str,
        actor_id: str,
        scope: str,
        query_hint: str | None,
        gmail_emails: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Sync Gmail mailbox evidence. Uses real Gmail emails if provided, else falls back to EMAIL_LIBRARY."""
        if scope not in SUPPORTED_SYNC_SCOPES:
            raise ValueError("Unsupported scope. Supported values: last_90_days, last_180_days, all_mail")

        connection = self.google_connections.get(organization_id)
        if connection is None:
            raise ValueError("Connect Google with Supabase Auth before syncing mailbox evidence")
        if not connection.get("provider_token_present"):
            raise ValueError("Supabase session is missing a Google provider token. Reconnect with consent and Gmail scope.")

        documents_created: list[dict[str, Any]] = []
        review_tasks_created: list[dict[str, Any]] = []
        suggestions: list[dict[str, Any]] = []

        use_real_gmail = gmail_emails is not None and len(gmail_emails) > 0
        email_source = "gmail_api" if use_real_gmail else "demo_library"

        if use_real_gmail:
            # ── Process real Gmail emails ─────────────────────────────────────
            for email in gmail_emails:
                msg_id = email["message_id"]
                if msg_id in self.synced_message_ids:
                    continue

                doc_type = email["document_type"]
                if doc_type not in SUPPORTED_DOCUMENT_TYPES:
                    continue

                period_value = email.get("period")
                facility_id = email.get("facility_id")

                body_text = f"From: {email['from_email']}\nSubject: {email['subject']}\n\n{email.get('body', '')}"

                created = self.create_document(
                    source_system="gmail",
                    organization_id=organization_id,
                    facility_id=facility_id,
                    supplier_id=None,
                    document_type=doc_type,
                    period_start=_coerce_period_start(period_value),
                    period_end=_coerce_period_end(period_value),
                    region="global",
                    currency="USD",
                    actor_id=actor_id,
                    file_name=f"{email['subject'][:80]}.eml",
                    content_type="message/rfc822",
                    file_bytes=body_text.encode("utf-8"),
                    source_channel="gmail_api_sync",
                    source_reference=msg_id,
                    body_text=body_text,
                )
                extraction_result = self.run_extraction(document_id=created["document"]["id"], actor_id=actor_id)

                documents_created.append(created["document"])
                review_tasks_created.append(extraction_result["review_task"])
                suggestions.append({
                    "message_id": msg_id,
                    "thread_id": email.get("thread_id", ""),
                    "subject": email["subject"],
                    "from_email": email["from_email"],
                    "received_at": email.get("received_at", ""),
                    "document_type": doc_type,
                    "document_id": created["document"]["id"],
                    "activity_record_id": extraction_result["activity_record"]["id"],
                    "confidence_score": extraction_result["extraction"]["confidence_score"],
                    "reason": f"Gmail API matched email to {doc_type} evidence.",
                })
                self.synced_message_ids.add(msg_id)

        else:
            # ── Fallback: demo EMAIL_LIBRARY ──────────────────────────────────
            received_after: datetime | None = None
            if scope == "last_90_days":
                received_after = datetime.now(timezone.utc) - timedelta(days=90)
            elif scope == "last_180_days":
                received_after = datetime.now(timezone.utc) - timedelta(days=180)

            for email in EMAIL_LIBRARY:
                if email["message_id"] in self.synced_message_ids:
                    continue
                if email["label"] not in SUPPORTED_DOCUMENT_TYPES:
                    continue

                received_at = _parse_iso_datetime(email["received_at"])
                if received_after and received_at and received_at < received_after:
                    continue

                searchable_text = f"{email['subject']} {email['body']} {email['from_email']}".lower()
                if query_hint and query_hint.strip() and query_hint.lower() not in searchable_text:
                    continue

                period_token_match = re.search(r"(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})", email["body"], re.IGNORECASE)
                period_value = None
                if period_token_match:
                    month_name = period_token_match.group(1).lower()
                    year_value = period_token_match.group(2)
                    month_lookup = {
                        "january": "01", "february": "02", "march": "03", "april": "04",
                        "may": "05", "june": "06", "july": "07", "august": "08",
                        "september": "09", "october": "10", "november": "11", "december": "12",
                    }
                    period_value = f"{year_value}-{month_lookup[month_name]}"

                created = self.create_document(
                    source_system="gmail",
                    organization_id=organization_id,
                    facility_id=email["facility_id"],
                    supplier_id=None,
                    document_type=email["label"],
                    period_start=_coerce_period_start(period_value),
                    period_end=_coerce_period_end(period_value),
                    region="global",
                    currency="USD",
                    actor_id=actor_id,
                    file_name=f"{email['subject']}.eml",
                    content_type="message/rfc822",
                    file_bytes=email["body"].encode("utf-8"),
                    source_channel="supabase_google_sync",
                    source_reference=email["message_id"],
                    body_text=f"From: {email['from_email']}\nSubject: {email['subject']}\n\n{email['body']}",
                )
                extraction_result = self.run_extraction(document_id=created["document"]["id"], actor_id=actor_id)

                documents_created.append(created["document"])
                review_tasks_created.append(extraction_result["review_task"])
                suggestions.append({
                    "message_id": email["message_id"],
                    "thread_id": email["thread_id"],
                    "subject": email["subject"],
                    "from_email": email["from_email"],
                    "received_at": email["received_at"],
                    "document_type": email["label"],
                    "document_id": created["document"]["id"],
                    "activity_record_id": extraction_result["activity_record"]["id"],
                    "confidence_score": extraction_result["extraction"]["confidence_score"],
                    "reason": f"Demo library matched email to {email['label']} evidence.",
                })
                self.synced_message_ids.add(email["message_id"])

        messages_scanned = len(gmail_emails) if use_real_gmail else len(EMAIL_LIBRARY)
        sync_run = {
            "id": _next_id("sync"),
            "organization_id": organization_id,
            "provider": "google_gmail",
            "status": "completed",
            "scope": scope,
            "query_hint": query_hint,
            "source": email_source,
            "messages_scanned": messages_scanned,
            "matches_found": len(suggestions),
            "documents_created": len(documents_created),
            "started_at": _utc_now(),
            "completed_at": _utc_now(),
        }
        self.email_sync_runs[sync_run["id"]] = sync_run
        connection["last_sync_at"] = sync_run["completed_at"]

        event = self._log_event(
            event_type="google_mailbox_synced",
            actor_id=actor_id,
            entity_type="email_sync_run",
            entity_id=sync_run["id"],
            payload={
                "scope": scope,
                "matches_found": len(suggestions),
                "model_name": MODEL_NAME,
            },
        )

        return {
            "connection": connection,
            "sync_run": sync_run,
            "suggestions": suggestions,
            "documents": documents_created,
            "review_tasks": review_tasks_created,
            "audit_event": event,
        }

    def get_dashboard_summary(self) -> dict[str, Any]:
        documents = sorted(self.documents.values(), key=lambda item: item["created_at"], reverse=True)
        review_tasks = sorted(self.review_tasks.values(), key=lambda item: item["created_at"], reverse=True)
        claims = sorted(self.claims.values(), key=lambda item: item["created_at"], reverse=True)
        sync_runs = sorted(self.email_sync_runs.values(), key=lambda item: item["completed_at"] or item["started_at"], reverse=True)
        google_connection = next(iter(self.google_connections.values()), None)

        approved_records = [record for record in self.activity_records.values() if record["reviewer_status"] == "approved"]
        rejected_records = [record for record in self.activity_records.values() if record["reviewer_status"] == "rejected"]
        needs_review_records = [record for record in self.activity_records.values() if record["reviewer_status"] == "needs_review"]

        review_durations: list[float] = []
        for task in self.review_tasks.values():
            created_at = _parse_iso_datetime(task["created_at"])
            resolved_at = _parse_iso_datetime(task["resolved_at"])
            if created_at and resolved_at:
                review_durations.append((resolved_at - created_at).total_seconds() / 60)

        complete_claims = [claim for claim in claims if claim["sufficiency_status"] == "complete"]
        traceable_claim_ratio = round(len(complete_claims) / len(claims), 2) if claims else 0.0

        return {
            "product": {
                "name": "Automated Evidence Collection System",
                "tagline": "Subtle terminal workspace for ESG evidence discovery and traceability",
                "status": "demo_ready",
            },
            "ai_config": {
                "primary_model": MODEL_NAME,
                "extraction_model": MODEL_NAME,
                "email_discovery_model": MODEL_NAME,
                "reasoning_model": MODEL_NAME,
            },
            "google_integration": {
                "provider": "google_gmail",
                "status": google_connection["status"] if google_connection else "not_connected",
                "user_email": google_connection["user_email"] if google_connection else None,
                "connected_at": google_connection["connected_at"] if google_connection else None,
                "last_sync_at": google_connection["last_sync_at"] if google_connection else None,
                "mailboxes_available": 1 if google_connection else 0,
                "messages_indexed": len(self.synced_message_ids),
            },
            "metrics": {
                "total_documents": len(documents),
                "total_activity_records": len(self.activity_records),
                "pending_review_tasks": len([task for task in review_tasks if task["status"] == "needs_review"]),
                "approved_records": len(approved_records),
                "rejected_records": len(rejected_records),
                "traceable_claim_ratio": traceable_claim_ratio,
                "average_review_turnaround_minutes": round(mean(review_durations), 2) if review_durations else None,
                "emails_discovered": len(self.synced_message_ids),
                "email_evidence_matches": sum(run["matches_found"] for run in sync_runs),
                "ready_for_claims": len(approved_records),
                "coverage_gap_count": sum(len(record["blocked_reasons"]) for record in needs_review_records),
            },
            "pipeline": {
                "ingested": len([doc for doc in documents if doc["status"] == "ingested"]),
                "mapped": len([doc for doc in documents if doc["status"] == "mapped"]),
                "needs_review": len([doc for doc in documents if doc["status"] == "needs_review"]),
                "approved": len([doc for doc in documents if doc["status"] == "approved"]),
                "rejected": len([doc for doc in documents if doc["status"] == "rejected"]),
            },
            "recent_documents": documents[:6],
            "recent_review_tasks": review_tasks[:6],
            "recent_claims": claims[:4],
            "recent_email_sync_runs": sync_runs[:4],
        }


STORE = EvidenceStore()


# ── Hydrate from Supabase on startup ───────────────────────────────────────
def _hydrate_store():
    """Load persisted data from Supabase into in-memory store on startup."""
    try:
        from src.shared.clients.supabase_client import (
            load_evidence_documents, load_evidence_extractions,
            load_activity_records, load_review_tasks,
            load_approval_decisions, load_claims,
            load_audit_events, load_google_connections,
            load_sync_runs,
        )
        docs = load_evidence_documents()
        if not docs:
            return
        for d in docs:
            STORE.documents[d["id"]] = d
        for e in load_evidence_extractions():
            STORE.extractions[e["id"]] = e
        for r in load_activity_records():
            STORE.activity_records[r["id"]] = r
        for t in load_review_tasks():
            STORE.review_tasks[t["id"]] = t
        for a in load_approval_decisions():
            STORE.approval_decisions[a["id"]] = a
        for c in load_claims():
            STORE.claims[c["id"]] = c
        for ev in load_audit_events():
            STORE.audit_events[ev["id"]] = ev
        for gc in load_google_connections():
            STORE.google_connections[gc.get("organization_id", gc["id"])] = gc
        for sr in load_sync_runs():
            STORE.email_sync_runs[sr["id"]] = sr
        logger.info("Hydrated EvidenceStore from Supabase: %d docs, %d records",
                     len(STORE.documents), len(STORE.activity_records))
    except Exception as exc:
        logger.info("Supabase hydration skipped: %s", exc)


_hydrate_store()


def _persist(fn_name: str, data: dict):
    """Fire-and-forget write to Supabase. Never blocks or raises."""
    try:
        from src.shared.clients import supabase_client as supa
        fn = getattr(supa, fn_name, None)
        if fn:
            fn(data)
    except Exception:
        pass


def create_uploaded_document(
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
    with STORE.lock:
        result = STORE.create_document(
            source_system="manual_upload",
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
            source_channel="manual_upload",
            source_reference=None,
        )
    _persist("persist_document", result["document"])
    _persist("persist_audit_event", result["audit_event"])
    return result


def create_email_document(
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
    payload = f"From: {from_email}\nSubject: {subject}\n\n{body}".encode("utf-8")
    with STORE.lock:
        result = STORE.create_document(
            source_system="email_forward",
            organization_id=organization_id,
            facility_id=facility_id,
            supplier_id=supplier_id,
            document_type=document_type,
            period_start=period_start,
            period_end=period_end,
            region=region,
            currency=currency,
            actor_id=actor_id,
            file_name=f"{subject}.eml",
            content_type="message/rfc822",
            file_bytes=payload,
            source_channel="email_forward",
            source_reference=from_email,
            body_text=payload.decode("utf-8"),
        )
    _persist("persist_document", result["document"])
    _persist("persist_audit_event", result["audit_event"])
    return result


def run_document_extraction(document_id: str, actor_id: str, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    with STORE.lock:
        result = STORE.run_extraction(document_id=document_id, actor_id=actor_id, overrides=overrides)
    _persist("persist_document", result["document"])
    _persist("persist_extraction", result["extraction"])
    _persist("persist_activity_record", result["activity_record"])
    _persist("persist_review_task", result["review_task"])
    _persist("persist_audit_event", result["audit_event"])
    return result


def list_documents() -> dict[str, Any]:
    with STORE.lock:
        return STORE.list_documents()


def get_document(document_id: str) -> dict[str, Any]:
    with STORE.lock:
        return STORE.get_document(document_id)


def list_review_tasks(status: str | None = None) -> dict[str, Any]:
    with STORE.lock:
        return STORE.list_review_tasks(status)


def submit_review_decision(
    task_id: str,
    reviewer_id: str,
    decision: str,
    notes: str | None,
    overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    with STORE.lock:
        result = STORE.apply_review_decision(
            task_id=task_id,
            reviewer_id=reviewer_id,
            decision=decision,
            notes=notes,
            overrides=overrides,
        )
    _persist("persist_review_task", result["review_task"])
    _persist("persist_activity_record", result["activity_record"])
    _persist("persist_approval_decision", result["approval_decision"])
    _persist("persist_audit_event", result["audit_event"])
    return result


def create_claim(
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
    with STORE.lock:
        result = STORE.create_claim(
            organization_id=organization_id,
            facility_id=facility_id,
            claim_type=claim_type,
            statement=statement,
            period_start=period_start,
            period_end=period_end,
            evidence_record_ids=evidence_record_ids,
            created_by=created_by,
        )
    _persist("persist_claim", result["claim"])
    _persist("persist_audit_event", result["audit_event"])
    return result


def get_claim_trace(claim_id: str) -> dict[str, Any]:
    with STORE.lock:
        return STORE.get_claim_trace(claim_id)


def get_dashboard_summary() -> dict[str, Any]:
    with STORE.lock:
        return STORE.get_dashboard_summary()


def connect_google_mailbox(
    organization_id: str,
    actor_id: str,
    user_email: str,
    supabase_user_id: str,
    provider_token: str | None,
    provider_refresh_token: str | None,
    granted_scopes: list[str] | None,
) -> dict[str, Any]:
    with STORE.lock:
        result = STORE.connect_google_workspace(
            organization_id=organization_id,
            actor_id=actor_id,
            user_email=user_email,
            supabase_user_id=supabase_user_id,
            provider_token=provider_token,
            provider_refresh_token=provider_refresh_token,
            granted_scopes=granted_scopes,
        )
    _persist("persist_google_connection", result["connection"])
    _persist("persist_audit_event", result["audit_event"])
    return result


def _load_gmail_module():
    """Dynamically load gmail_service.py from the same directory (kebab-case dirs can't be imported normally)."""
    try:
        import importlib.util
        import pathlib
        gmail_path = pathlib.Path(__file__).resolve().parent / "gmail_service.py"
        if not gmail_path.exists():
            return None
        spec = importlib.util.spec_from_file_location("gmail_service", gmail_path)
        if spec is None or spec.loader is None:
            return None
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    except Exception as exc:
        logger.warning("Failed to load gmail_service module: %s", exc)
        return None


def sync_google_mailbox(organization_id: str, actor_id: str, scope: str, query_hint: str | None = None) -> dict[str, Any]:
    """Sync Gmail mailbox — tries real Gmail API first, falls back to demo library."""
    # Determine scope in days
    scope_days: int | None = None
    if scope == "last_90_days":
        scope_days = 90
    elif scope == "last_180_days":
        scope_days = 180

    gmail_emails: list[dict[str, Any]] | None = None

    # Try real Gmail API if we have tokens
    with STORE.lock:
        connection = STORE.google_connections.get(organization_id)
    if connection and connection.get("provider_token"):
        gmail_mod = _load_gmail_module()

        if gmail_mod is not None:
            access_token = connection["provider_token"]
            refresh_token = connection.get("provider_refresh_token")
            already_synced = set()
            with STORE.lock:
                already_synced = set(STORE.synced_message_ids)

            def _run_async(coro):
                """Run an async coroutine from sync context (works even inside an existing event loop)."""
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None
                if loop and loop.is_running():
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                        return pool.submit(asyncio.run, coro).result(timeout=30)
                return asyncio.run(coro)

            try:
                gmail_emails = _run_async(
                    gmail_mod.fetch_evidence_emails(
                        access_token=access_token,
                        scope_days=scope_days,
                        query_hint=query_hint,
                        already_synced=already_synced,
                        max_results=30,
                    )
                )
                logger.info("Real Gmail API returned %d evidence emails", len(gmail_emails) if gmail_emails else 0)
            except gmail_mod.TokenExpiredError:
                logger.warning("Gmail token expired, attempting refresh...")
                from src.shared.config import get_settings
                settings = get_settings()
                if refresh_token and settings.google_oauth_client_id and settings.google_oauth_client_secret:
                    new_token = _run_async(
                        gmail_mod.refresh_access_token(
                            refresh_token=refresh_token,
                            client_id=settings.google_oauth_client_id,
                            client_secret=settings.google_oauth_client_secret,
                        )
                    )
                    if new_token:
                        with STORE.lock:
                            connection["provider_token"] = new_token
                        gmail_emails = _run_async(
                            gmail_mod.fetch_evidence_emails(
                                access_token=new_token,
                                scope_days=scope_days,
                                query_hint=query_hint,
                                already_synced=already_synced,
                                max_results=30,
                            )
                        )
                        logger.info("After token refresh, Gmail returned %d emails", len(gmail_emails) if gmail_emails else 0)
                    else:
                        logger.warning("Token refresh failed, falling back to demo library")
                else:
                    logger.warning("No refresh credentials configured, falling back to demo library")
            except Exception as exc:
                logger.warning("Gmail API call failed, falling back to demo library: %s", exc)

    with STORE.lock:
        result = STORE.sync_google_mailbox(
            organization_id=organization_id,
            actor_id=actor_id,
            scope=scope,
            query_hint=query_hint,
            gmail_emails=gmail_emails,
        )
    _persist("persist_sync_run", result["sync_run"])
    _persist("persist_audit_event", result["audit_event"])
    for doc in result.get("documents", []):
        _persist("persist_document", doc)
    for task in result.get("review_tasks", []):
        _persist("persist_review_task", task)
    return result
