"""Routes for PDF report generation."""

from fastapi import APIRouter, Request
from fastapi.responses import Response

from src.api.controllers._service_loader import load_function

generate_document_analyzer_report = load_function(
    "features/report-generator/services/pdf_report_service.py",
    "generate_document_analyzer_report",
)
generate_disclosure_gap_report = load_function(
    "features/report-generator/services/pdf_report_service.py",
    "generate_disclosure_gap_report",
)
generate_compliance_risk_report = load_function(
    "features/report-generator/services/pdf_report_service.py",
    "generate_compliance_risk_report",
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/document-analyzer")
async def document_analyzer_report(request: Request) -> Response:
    data = await request.json()
    pdf_bytes = generate_document_analyzer_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="document-analysis-report.pdf"'},
    )


@router.post("/disclosure-gaps")
async def disclosure_gaps_report(request: Request) -> Response:
    data = await request.json()
    pdf_bytes = generate_disclosure_gap_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="disclosure-gap-report.pdf"'},
    )


@router.post("/compliance-risk")
async def compliance_risk_report(request: Request) -> Response:
    data = await request.json()
    pdf_bytes = generate_compliance_risk_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="compliance-risk-report.pdf"'},
    )
