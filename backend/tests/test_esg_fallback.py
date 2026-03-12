from types import SimpleNamespace

import pytest

from src.api.controllers._service_loader import load_module


esg_client = load_module("features/esg-bridge/services/esg_client.py")


class FakeResponse:
    def __init__(self, payload: dict, *, should_raise: bool = False) -> None:
        self._payload = payload
        self._should_raise = should_raise
        self.content = b"payload"

    def raise_for_status(self) -> None:
        if self._should_raise:
            raise RuntimeError("upstream model request failed")

    def json(self) -> dict:
        return self._payload


class SequenceClient:
    def __init__(self, responses: list[object]) -> None:
        self._responses = list(responses)
        self.calls: list[dict] = []

    async def post(self, url: str, **kwargs):
        self.calls.append({"url": url, **kwargs})
        next_item = self._responses.pop(0)
        if isinstance(next_item, Exception):
            raise next_item
        return next_item


@pytest.mark.asyncio
async def test_fetch_esg_scores_returns_primary_model_response(monkeypatch: pytest.MonkeyPatch) -> None:
    client = SequenceClient(
        [
            FakeResponse(
                {
                    "overall_score": 81,
                    "scores": {"environmental": 79, "social": 83, "governance": 80},
                    "source": "render_primary",
                }
            )
        ]
    )
    monkeypatch.setattr(
        esg_client,
        "get_settings",
        lambda: SimpleNamespace(
            esg_model_url="https://greenverify-api.onrender.com",
            google_ai_studio_api_key="",
            gemini_model="gemini-test",
        ),
    )
    monkeypatch.setattr(esg_client, "get_http_client", lambda: client)

    result = await esg_client.fetch_esg_scores("Tesla")

    assert result["entity_id"] == "TESLA"
    assert result["overall_score"] == 81.0
    assert result["scores"] == {"environmental": 79.0, "social": 83.0, "governance": 80.0}
    assert result["raw_response"]["source"] == "render_primary"
    assert len(client.calls) == 1
    assert client.calls[0]["url"] == "https://greenverify-api.onrender.com/predict"


@pytest.mark.asyncio
async def test_fetch_esg_scores_uses_gemini_when_primary_model_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    client = SequenceClient(
        [
            RuntimeError("render unavailable"),
            FakeResponse(
                {
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {
                                        "text": (
                                            '{"overall_score": 67, "scores": {"environmental": 70, '
                                            '"social": 64, "governance": 68}, "confidence": 0.62, '
                                            '"reasoning": "fallback estimate"}'
                                        )
                                    }
                                ]
                            }
                        }
                    ]
                }
            ),
        ]
    )
    monkeypatch.setattr(
        esg_client,
        "get_settings",
        lambda: SimpleNamespace(
            esg_model_url="https://greenverify-api.onrender.com",
            google_ai_studio_api_key="test-key",
            gemini_model="gemini-3.1-flash-lite-preview",
        ),
    )
    monkeypatch.setattr(esg_client, "get_http_client", lambda: client)

    result = await esg_client.fetch_esg_scores("Acme Corp")

    assert result["entity_id"] == "ACME CORP"
    assert result["overall_score"] == 67.0
    assert result["scores"] == {"environmental": 70.0, "social": 64.0, "governance": 68.0}
    assert result["raw_response"]["source"] == "gemini_fallback"
    assert result["raw_response"]["model"] == "gemini-3.1-flash-lite-preview"
    assert len(client.calls) == 2
    assert "generativelanguage.googleapis.com" in client.calls[1]["url"]
    assert client.calls[1]["params"] == {"key": "test-key"}


@pytest.mark.asyncio
async def test_fetch_esg_scores_returns_static_fallback_when_all_models_fail(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = SequenceClient(
        [
            RuntimeError("render unavailable"),
            RuntimeError("gemini unavailable"),
        ]
    )
    monkeypatch.setattr(
        esg_client,
        "get_settings",
        lambda: SimpleNamespace(
            esg_model_url="https://greenverify-api.onrender.com",
            google_ai_studio_api_key="test-key",
            gemini_model="gemini-3.1-flash-lite-preview",
        ),
    )
    monkeypatch.setattr(esg_client, "get_http_client", lambda: client)

    result = await esg_client.fetch_esg_scores("Unknown Co")

    assert result["entity_id"] == "UNKNOWN CO"
    assert result["overall_score"] == 55.0
    assert result["scores"] == {"environmental": 55.0, "social": 55.0, "governance": 55.0}
    assert result["raw_response"] == {"source": "fallback"}
    assert len(client.calls) == 2
