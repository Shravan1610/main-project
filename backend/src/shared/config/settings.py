from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    port: int = 8000
    cors_origins: str = "http://localhost:3000"

    market_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("MARKET_API_KEY", "ALPHA_VANTAGE_API_KEY"),
    )
    finnhub_api_key: str = ""
    coingecko_demo_api_key: str = ""
    news_api_key: str = ""
    gnews_api_key: str = ""
    the_news_api_key: str = ""
    google_ai_studio_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite-preview"
    climate_api_key: str = ""
    geocoding_api_key: str = ""
    youtube_api_key: str = ""
    vapi_api_key: str = ""
    vapi_assistant_id: str = ""
    vapi_phone_number_id: str = ""

    esg_model_url: str = Field(default="https://greenverify-api.onrender.com")
    nlp_model_url: str = Field(default="https://greenverifynlp-api.onrender.com")
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    document_analyzer_edge_function_name: str = "document-analyzer-v2"
    log_level: str = "INFO"
    request_timeout_seconds: float = 12.0
    cache_ttl_seconds: int = 300

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
