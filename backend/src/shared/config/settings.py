"""
backend/src/shared/config/settings.py
Pydantic Settings model — loads all env vars with defaults.

Owner: Shravan
Task: SH-1-08
Phase: 1 — Scaffolding

Expected class:
  Settings(BaseSettings):
    port: int = 8000
    cors_origins: str = "http://localhost:3000"
    market_api_key: str = ""
    news_api_key: str = ""
    climate_api_key: str = ""
    geocoding_api_key: str = ""
    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st end    esg_model_urig    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st end    esg_model_urig    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st end    esg_model_urig    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st    esg_model_url: st end    esg_model_urig    esg_model_url: st    esg_model_url: st   eme    esg_model_url: st F

# Backend shared clients
cat > backend/src/shared/clients/http_client.py << 'PYEOF'
"""
backend/src/shared/clients/http_client.py
Shared async httpx client — singleton pattern, timeout config.

Owner: Shravan
Task: SH-1-10
Phase: 1 — Scaffolding

Expected:
  get_http_client() -> httpx.AsyncClient
  Configures timeout, default headers, connection pooling.
"""
# Stub — implement in SH-1-10
