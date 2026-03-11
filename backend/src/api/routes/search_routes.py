from fastapi import APIRouter, Query

from src.api.controllers.search_controller import search_entities

router = APIRouter()


@router.get("/search")
async def search(q: str = Query(..., min_length=1)) -> dict:
    return await search_entities(q)
