import httpx

from src.shared.config import get_settings

_http_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    global _http_client

    if _http_client is None:
        settings = get_settings()
        timeout = httpx.Timeout(settings.request_timeout_seconds)
        transport = httpx.AsyncHTTPTransport(retries=2)
        _http_client = httpx.AsyncClient(
            timeout=timeout,
            transport=transport,
            headers={"User-Agent": "WorldMonitor/0.1"},
        )

    return _http_client


async def close_http_client() -> None:
    global _http_client

    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None
