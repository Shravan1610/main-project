from __future__ import annotations

from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


def _upload_document(*, document_type: str, content: str, period_start: str = "2026-01-01", period_end: str = "2026-01-31") -> dict:
    response = client.post(
        "/evidence/documents/upload",
        data={
            "organization_id": "org_test",
            "facility_id": "facility_test",
            "document_type": document_type,
            "period_start": period_start,
            "period_end": period_end,
            "actor_id": "test_uploader",
        },
        files={"document": ("evidence.txt", content.encode("utf-8"), "text/plain")},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _run_extraction(document_id: str) -> dict:
    response = client.post(
        f"/evidence/extractions/{document_id}/run",
        json={"actor_id": "test_extractor"},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _approve_task(task_id: str) -> dict:
    response = client.patch(
        f"/evidence/review-tasks/{task_id}",
        json={
            "reviewer_id": "test_reviewer",
            "decision": "approved",
            "notes": "Looks good",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_scope2_claim_trace_flow() -> None:
    upload_payload = _upload_document(
        document_type="utility_bill",
        content="Facility A consumed 1450 kWh for period Jan 2026.",
    )
    document_id = upload_payload["document"]["id"]

    extraction_payload = _run_extraction(document_id)
    activity_record_id = extraction_payload["activity_record"]["id"]
    review_task_id = extraction_payload["review_task"]["id"]

    _approve_task(review_task_id)

    claim_response = client.post(
        "/evidence/claims",
        json={
            "organization_id": "org_test",
            "facility_id": "facility_test",
            "claim_type": "scope2_emissions",
            "statement": "Facility A reported Scope 2 electricity usage for Jan 2026",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "evidence_record_ids": [activity_record_id],
            "created_by": "qa_test",
        },
    )
    assert claim_response.status_code == 200, claim_response.text
    claim_payload = claim_response.json()
    assert claim_payload["claim"]["sufficiency_status"] == "complete"

    trace_response = client.get(f"/evidence/claims/{claim_payload['claim']['id']}/trace")
    assert trace_response.status_code == 200, trace_response.text
    trace_payload = trace_response.json()
    assert trace_payload["claim"]["id"] == claim_payload["claim"]["id"]
    assert any(record["id"] == activity_record_id for record in trace_payload["evidence_records"])
    assert len(trace_payload["audit_events"]) >= 3

    dashboard_response = client.get("/evidence/dashboard/summary")
    assert dashboard_response.status_code == 200, dashboard_response.text
    metrics = dashboard_response.json()["metrics"]
    assert metrics["total_documents"] >= 1
    assert metrics["total_activity_records"] >= 1


def test_scope2_claim_requires_utility_bill() -> None:
    upload_payload = _upload_document(
        document_type="fuel_invoice",
        content="Diesel purchase 320 liters for Jan 2026",
    )
    document_id = upload_payload["document"]["id"]

    extraction_payload = _run_extraction(document_id)
    activity_record_id = extraction_payload["activity_record"]["id"]
    review_task_id = extraction_payload["review_task"]["id"]
    _approve_task(review_task_id)

    claim_response = client.post(
        "/evidence/claims",
        json={
            "organization_id": "org_test",
            "facility_id": "facility_test",
            "claim_type": "scope2_emissions",
            "statement": "Scope 2 claim with wrong evidence set",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "evidence_record_ids": [activity_record_id],
            "created_by": "qa_test",
        },
    )
    assert claim_response.status_code == 200, claim_response.text
    payload = claim_response.json()
    assert payload["claim"]["sufficiency_status"] == "incomplete"
    assert "utility_bill_required" in payload["claim"]["missing_requirements"]
