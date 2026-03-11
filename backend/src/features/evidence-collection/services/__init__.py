from .evidence_service import (
    create_claim,
    create_email_document,
    create_uploaded_document,
    get_claim_trace,
    get_dashboard_summary,
    get_document,
    list_documents,
    list_review_tasks,
    run_document_extraction,
    submit_review_decision,
)

__all__ = [
    "create_claim",
    "create_email_document",
    "create_uploaded_document",
    "get_claim_trace",
    "get_dashboard_summary",
    "get_document",
    "list_documents",
    "list_review_tasks",
    "run_document_extraction",
    "submit_review_decision",
]
