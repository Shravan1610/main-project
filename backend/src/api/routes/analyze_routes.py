from fastapi import APIRouter, Query

from src.api.controllers.analyze_controller import analyze_entity

router = APIRouter()


@router.get("/analyze")
async def analyze(entity: str = Query(..., min_length=1)) -> dict:
    return await analyze_entity(entity)
