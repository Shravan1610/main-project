from fastapi import APIRouter, File, Form, Query, UploadFile

from src.api.controllers.regulatory_compliance_controller import (
    analyze_compliance_risk_request,
    analyze_disclosure_gaps_request,
)

router = APIRouter(prefix="/regulatory-compliance", tags=["regulatory-compliance"])


@router.post("/disclosure-gaps")
async def disclosure_gaps(
    input_type: str = Form(...),
    document: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
    webpage: str | None = Form(default=None),
    frameworks: str | None = Form(default=None),
) -> dict:
    return await analyze_disclosure_gaps_request(
        input_type=input_type,
        document=document,
        url=url,
        webpage=webpage,
        frameworks=frameworks,
    )


@router.post("/compliance-risk")
async def compliance_risk(
    input_type: str = Form(...),
    document: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
    webpage: str | None = Form(default=None),
    frameworks: str | None = Form(default=None),
) -> dict:
    return await analyze_compliance_risk_request(
        input_type=input_type,
        document=document,
        url=url,
        webpage=webpage,
        frameworks=frameworks,
    )
