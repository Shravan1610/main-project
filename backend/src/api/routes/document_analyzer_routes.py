from fastapi import APIRouter, File, Form, UploadFile

from src.api.controllers.document_analyzer_controller import analyze_document_request

router = APIRouter()


@router.post("/document-analyzer/analyze")
async def analyze_document(
    input_type: str = Form(...),
    document: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
    webpage: str | None = Form(default=None),
) -> dict:
    return await analyze_document_request(
        input_type=input_type,
        document=document,
        url=url,
        webpage=webpage,
    )
