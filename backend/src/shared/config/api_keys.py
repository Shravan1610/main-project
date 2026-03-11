from src.shared.config.settings import get_settings

_SERVICE_TO_FIELD: dict[str, str] = {
    "market": "market_api_key",
    "news": "news_api_key",
    "climate": "climate_api_key",
    "geocoding": "geocoding_api_key",
}


def get_api_key(service: str, required: bool = False) -> str:
    normalized = service.strip().lower()
    field_name = _SERVICE_TO_FIELD.get(normalized)

    if field_name is None:
        raise ValueError(f"Unsupported API key service '{service}'")

    settings = get_settings()
    key = getattr(settings, field_name, "")

    if required and not key:
        raise ValueError(f"Missing API key for service '{service}'")

    return key
