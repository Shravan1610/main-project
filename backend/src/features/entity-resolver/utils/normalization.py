def normalize_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


def deduplicate_entities(entities: list[dict]) -> list[dict]:
    seen: set[str] = set()
    deduped: list[dict] = []

    for entity in entities:
        entity_id = str(entity.get("id", "")).strip()
        if not entity_id or entity_id in seen:
            continue
        seen.add(entity_id)
        deduped.append(entity)

    return deduped
