from src.api.controllers.analyze_controller import analyze_entity


async def get_entity_brief(entity_id: str) -> dict:
    analysis = await analyze_entity(entity_id)
    brief = analysis.get("researchBrief") or {}

    return {
        "entityId": brief.get("entityId") or analysis.get("id"),
        "summary": brief.get("summary") or "No summary available.",
        "keyPoints": brief.get("keyPoints") or [],
        "risks": brief.get("risks") or [],
        "opportunities": brief.get("opportunities") or [],
        "confidence": brief.get("confidence") or 0.35,
        "sourceRefs": brief.get("sourceRefs") or [],
        "generatedAt": brief.get("generatedAt"),
    }
