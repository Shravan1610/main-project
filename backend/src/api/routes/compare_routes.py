from pydantic import BaseModel, Field
from fastapi import APIRouter

from src.api.controllers.compare_controller import compare_entities

router = APIRouter()


class CompareRequest(BaseModel):
    entities: list[str] = Field(default_factory=list, min_length=1, max_length=3)


@router.post("/compare")
async def compare(payload: CompareRequest) -> dict:
    return await compare_entities(payload.entities)
