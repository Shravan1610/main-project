from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from statistics import mean
from threading import Lock
from typing import Any
from uuid import uuid4

SUPPORTED_DOCUMENT_TYPES = {"utility_bill", "fuel_invoice", "renewable_certificate"}
SUPPORTED_CLAIM_TYPES = {"scope1_emissions", "scope2_emissions", "renewable_electricity"}


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

    if not record.get("quantity"):
        issues.append("quantity_missing")

    if not record.get("unit"):
        issues.append("unit_missing")

    return issues


def _build_review_notes(document_type: str, issues: list[str]) -> str:
    if not issues:
        return f"{document_type} extracted successfully; reviewer must confirm mapped values."
    return f"Needs review due to: {', '.join(issues)}"


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

        with self.lock:
            document_id = _next_id("doc")
            digest = hashlib.sha256(file_bytes).hexdigest()
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
                "created_at": _utc_now(),
                "updated_at": _utc_now(),
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
        with self.lock:
            document = self.documents.get(document_id)
            if document is None:
                raise KeyError("Document not found")

            text = document.get("text_preview", "")
            extracted_quantity, extracted_unit = _extract_quantity_and_unit(text)
            extraction_version = 1
            if document.get("latest_extraction_id"):
                previous = self.extractions.get(document["latest_extraction_id"])
                if previous:
                    extraction_version = int(previous.get("version", 1)) + 1

            quantity = _parse_float((overrides or {}).get("quantity"))
            if quantity is None:
                quantity = extracted_quantity

            unit = (overrides or {}).get("unit") or extracted_unit
            period_start = (overrides or {}).get("period_start") or document.get("period_start")
            period_end = (overrides or {}).get("period_end") or document.get("period_end")
            facility_id = (overrides or {}).get("facility_id") or document.get("facility_id")

            base_confidence = {
                "utility_bill": 0.72,
                "fuel_invoice": 0.75,
                "renewable_certificate": 0.8,
            }[document["document_type"]]
            confidence = base_confidence
            if quantity is not None:
                confidence += 0.08
            if unit:
                confidence += 0.06
            if period_start and period_end:
                confidence += 0.05
            if facility_id:
                confidence += 0.04
            confidence = min(0.99, round(confidence, 2))

            extraction = {
                "id": _next_id("extract"),
                "document_id": document_id,
                "version": extraction_version,
                "model_name": "hybrid_v1_regex_template",
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
        events = [
            event
            for event in self.audit_events.values()
            if event["entity_id"] in linked_event_ids
        ]
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

        with self.lock:
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

        # preserve order while deduplicating
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

        with self.lock:
            evidence_records: list[dict[str, Any]] = []
            missing_record_ids: list[str] = []
            for record_id in evidence_record_ids:
                record = self.activity_records.get(record_id)
                if record is None:
                    missing_record_ids.append(record_id)
                    continue
                evidence_records.append(record)

            if missing_record_ids:
                raise KeyError(f"Evidence record(s) not found: {', '.join(missing_record_ids)}")

            missing_requirements = self._claim_sufficiency(claim_type, evidence_records)
            sufficiency_status = "complete" if not missing_requirements else "incomplete"

            claim = {
                "id": _next_id("claim"),
                "organization_id": organization_id,
                "facility_id": facility_id,
                "claim_type": claim_type,
                "statement": statement,
                "period_start": period_start,
                "period_end": period_end,
                "evidence_record_ids": evidence_record_ids,
                "sufficiency_status": sufficiency_status,
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
                    "sufficiency_status": sufficiency_status,
                    "evidence_record_ids": evidence_record_ids,
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
            self.activity_records[record_id]
            for record_id in claim["evidence_record_ids"]
            if record_id in self.activity_records
        ]

        document_ids = [record["source_document_id"] for record in evidence_records]
        documents = [self.documents[doc_id] for doc_id in document_ids if doc_id in self.documents]

        extraction_ids = [record["extraction_id"] for record in evidence_records if record.get("extraction_id")]
        extractions = [self.extractions[extract_id] for extract_id in extraction_ids if extract_id in self.extractions]

        review_tasks = [
            task for task in self.review_tasks.values() if task["activity_record_id"] in {record["id"] for record in evidence_records}
        ]
        approval_decisions = [
            decision for decision in self.approval_decisions.values() if decision["activity_record_id"] in {record["id"] for record in evidence_records}
        ]

        trace_entity_ids = {
            claim_id,
            *[record["id"] for record in evidence_records],
            *[doc["id"] for doc in documents],
            *[extract["id"] for extract in extractions],
            *[task["id"] for task in review_tasks],
        }
        audit_events = [
            event
            for event in self.audit_events.values()
            if event["entity_id"] in trace_entity_ids
        ]
        audit_events.sort(key=lambda item: item["timestamp"])

        return {
            "claim": claim,
            "documents": documents,
            "evidence_records": evidence_records,
            "extractions": extractions,
            "review_tasks": review_tasks,
            "approval_decisions": approval_decisions,
            "audit_events": audit_events,
        }

    def dashboard_summary(self) -> dict[str, Any]:
        total_documents = len(self.documents)
        total_records = len(self.activity_records)
        pending_tasks = [task for task in self.review_tasks.values() if task["status"] == "needs_review"]
        approved_records = [record for record in self.activity_records.values() if record["reviewer_status"] == "approved"]
        rejected_records = [record for record in self.activity_records.values() if record["reviewer_status"] == "rejected"]
        complete_claims = [claim for claim in self.claims.values() if claim["sufficiency_status"] == "complete"]

        traceable_claim_ratio = 0.0
        if self.claims:
            traceable_claim_ratio = round((len(complete_claims) / len(self.claims)) * 100, 2)

        turnaround_minutes: list[float] = []
        for task in self.review_tasks.values():
            if not task.get("resolved_at"):
                continue
            created_at = datetime.fromisoformat(task["created_at"])
            resolved_at = datetime.fromisoformat(task["resolved_at"])
            minutes = (resolved_at - created_at).total_seconds() / 60
            turnaround_minutes.append(round(minutes, 2))

        average_turnaround_minutes = round(mean(turnaround_minutes), 2) if turnaround_minutes else None

        recent_documents = sorted(self.documents.values(), key=lambda item: item["created_at"], reverse=True)[:10]
        recent_review_tasks = sorted(self.review_tasks.values(), key=lambda item: item["created_at"], reverse=True)[:10]
        recent_claims = sorted(self.claims.values(), key=lambda item: item["created_at"], reverse=True)[:10]

        return {
            "metrics": {
                "total_documents": total_documents,
                "total_activity_records": total_records,
                "pending_review_tasks": len(pending_tasks),
                "approved_records": len(approved_records),
                "rejected_records": len(rejected_records),
                "traceable_claim_ratio": traceable_claim_ratio,
                "average_review_turnaround_minutes": average_turnaround_minutes,
            },
            "recent_documents": recent_documents,
            "recent_review_tasks": recent_review_tasks,
            "recent_claims": recent_claims,
        }


STORE = EvidenceStore()


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
    return STORE.create_document(
        source_system="manual_upload",
        source_channel="upload",
        source_reference=file_name,
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
    synthetic_name = f"email-{from_email}-{subject[:32]}.txt"
    payload = f"From: {from_email}\nSubject: {subject}\n\n{body}".encode("utf-8")
    return STORE.create_document(
        source_system="email_forward",
        source_channel="email",
        source_reference=from_email,
        organization_id=organization_id,
        facility_id=facility_id,
        supplier_id=supplier_id,
        document_type=document_type,
        period_start=period_start,
        period_end=period_end,
        region=region,
        currency=currency,
        actor_id=actor_id,
        file_name=synthetic_name,
        content_type="text/plain",
        file_bytes=payload,
        body_text=body,
    )


def run_document_extraction(document_id: str, actor_id: str, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    return STORE.run_extraction(document_id=document_id, actor_id=actor_id, overrides=overrides)


def list_documents() -> dict[str, Any]:
    return STORE.list_documents()


def get_document(document_id: str) -> dict[str, Any]:
    return STORE.get_document(document_id)


def list_review_tasks(status: str | None = None) -> dict[str, Any]:
    return STORE.list_review_tasks(status=status)


def submit_review_decision(
    task_id: str,
    reviewer_id: str,
    decision: str,
    notes: str | None,
    overrides: dict[str, Any] | None,
) -> dict[str, Any]:
    return STORE.apply_review_decision(
        task_id=task_id,
        reviewer_id=reviewer_id,
        decision=decision,
        notes=notes,
        overrides=overrides,
    )


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
    return STORE.create_claim(
        organization_id=organization_id,
        facility_id=facility_id,
        claim_type=claim_type,
        statement=statement,
        period_start=period_start,
        period_end=period_end,
        evidence_record_ids=evidence_record_ids,
        created_by=created_by,
    )


def get_claim_trace(claim_id: str) -> dict[str, Any]:
    return STORE.get_claim_trace(claim_id)


def get_dashboard_summary() -> dict[str, Any]:
    return STORE.dashboard_summary()
