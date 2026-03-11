from fastapi import APIRouter, Query

from src.api.controllers.brief_controller import get_entity_brief

router = APIRouter()


@router.get("/brief")
async def brief(entity: str = Query(..., min_length=1)) -> dict:
    return await get_entity_brief(entity)
