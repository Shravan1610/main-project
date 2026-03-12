from fastapi import APIRouter

from src.api.controllers.layer_controller import get_map_layers
from src.api.controllers._service_loader import load_function

_get_global_climate_heatmap = load_function(
    "features/climate-intel/services/climate_service.py",
    "get_global_climate_heatmap",
)

router = APIRouter()


@router.get("/layers")
async def layers() -> dict:
    return await get_map_layers()


@router.get("/layers/climate-heatmap")
async def climate_heatmap() -> list[dict]:
    return await _get_global_climate_heatmap()
