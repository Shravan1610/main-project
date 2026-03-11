from src.api.controllers.analyze_controller import analyze_entity


async def compare_entities(entity_ids: list[str]) -> dict:
    entities = [entity_id for entity_id in entity_ids[:3] if entity_id.strip()]
    analyzed = [await analyze_entity(entity_id) for entity_id in entities]
    return {"entities": analyzed}
