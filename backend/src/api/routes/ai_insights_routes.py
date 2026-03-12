from fastapi import APIRouter

from src.features.ai_insights.services.gemini_insights import (
    generate_ai_insights,
    generate_ai_regulation,
    generate_daily_brief,
    generate_global_situation,
    generate_market_analysis,
    generate_panel_data,
    generate_predictions,
)

router = APIRouter(prefix="/ai", tags=["ai-insights"])


@router.get("/insights")
async def ai_insights() -> dict:
    return await generate_ai_insights()


@router.get("/global-situation")
async def global_situation() -> dict:
    return await generate_global_situation()


@router.get("/market-analysis")
async def market_analysis() -> dict:
    return await generate_market_analysis()


@router.get("/predictions")
async def predictions() -> dict:
    return await generate_predictions()


@router.get("/daily-brief")
async def daily_brief() -> dict:
    return await generate_daily_brief()


@router.get("/regulation")
async def ai_regulation() -> dict:
    return await generate_ai_regulation()


@router.get("/panel/{panel_id}")
async def panel_data(panel_id: str) -> dict:
    return await generate_panel_data(panel_id)
