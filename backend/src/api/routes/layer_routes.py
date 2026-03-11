from fastapi import APIRouter

from src.api.controllers.layer_controller import get_map_layers

router = APIRouter()


@router.get("/layers")
async def layers() -> dict:
    return await get_map_layers()
