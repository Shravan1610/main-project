from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="ignore",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    port: int = 8000
    cors_origins: str = "http://localhost:3000"

    market_api_key: str = ""
    finnhub_api_key: str = ""
    coingecko_demo_api_key: str = ""
    news_api_key: str = ""
    gnews_api_key: str = ""
    the_news_api_key: str = ""
    google_ai_studio_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"
    deepgram_api_key: str = ""
    climate_api_key: str = ""
    geocoding_api_key: str = ""
    youtube_api_key: str = ""

    esg_model_url: str = Field(default="https://greenverify-api.onrender.com")
    log_level: str = "INFO"
    request_timeout_seconds: float = 12.0
    cache_ttl_seconds: int = 300

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
