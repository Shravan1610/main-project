from __future__ import annotations

import importlib.util
import ipaddress
import os
from pathlib import Path
import re
import socket
from typing import Any
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from src.shared.clients.http_client import get_http_client


def _load_fetch_esg_scores():
    file_path = Path(__file__).resolve().parents[2] / "esg-bridge" / "services" / "esg_client.py"
    spec = importlib.util.spec_from_file_location("doc_analyzer_esg_client", file_path)
    if spec is None or spec.loader is None:
        raise ImportError("Unable to load ESG client")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    fn = getattr(module, "fetch_esg_scores", None)
    if not callable(fn):
        raise AttributeError("fetch_esg_scores function missing in ESG client")
    return fn


fetch_esg_scores = _load_fetch_esg_scores()


CLAIM_PATTERNS: dict[str, tuple[str, ...]] = {
    "carbon": (
        "carbon neutral",
        "net zero",
        "carbon offset",
        "scope 1",
        "scope 2",
        "scope 3",
        "ghg emissions",
    ),
    "renewable": ("100% renewable", "renewable energy", "solar", "wind", "clean energy"),
    "waste": ("zero waste", "plastic-free", "circular economy", "recycling", "waste reduction"),
    "diversity": ("gender parity", "women in leadership", "inclusive", "equity", "diversity"),
    "water": ("water neutral", "reduce water", "water usage", "water stewardship"),
    "certifications": ("iso 14001", "b corp", "leed", "gri", "cdp", "science based targets"),
}

COMMITMENT_HINTS = (" by ", "will", "plan", "target", "commit", "pledge", "roadmap", "goal")
CERTIFICATION_HINTS = ("certified", "awarded", "accredited", "verified")
ASSERTION_HINTS = ("we are", "our company", "we have", "we deliver", "we maintain")
METRIC_HINTS = ("%", "percent", "tonnes", "tons", "kg", "kwh", "mwh", "co2")


def _parse_html(content: str) -> str:
    try:
        soup = BeautifulSoup(content, "lxml")
    except Exception:
        soup = BeautifulSoup(content, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()

    meta_description = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag and meta_tag.get("content"):
        meta_description = str(meta_tag.get("content")).strip()

    body_text = ""
    if soup.body:
        body_text = soup.body.get_text(" ", strip=True)
    else:
        body_text = soup.get_text(" ", strip=True)

    merged = f"{meta_description} {body_text}".strip()
    return re.sub(r"\s+", " ", merged).strip()


_MIN_CONTENT_LENGTH = 200  # characters; below this threshold Playwright is attempted


def _is_headless_enabled() -> bool:
    return os.getenv("PLAYWRIGHT_HEADLESS", "true").strip().lower() not in {"0", "false", "no", "off"}


def _is_playwright_enabled() -> bool:
    return os.getenv("PLAYWRIGHT_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}


def _validate_url_no_ssrf(url: str) -> None:
    """Raise ValueError if the URL scheme is not http/https or resolves to a private/restricted IP."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Unsupported URL scheme: {parsed.scheme!r}; only http and https are allowed")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL is missing a hostname")

    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise ValueError(f"Could not resolve hostname {hostname!r}: {exc}") from exc

    for _family, _type, _proto, _canonname, addr in addr_infos:
        ip_str = addr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
        ):
            raise ValueError(f"URL resolves to a disallowed IP address: {ip}")


async def _scrape_url(url: str) -> str:
    """Fetch a URL's text content.

    Strategy:
    1. Always validates the URL to prevent SSRF attacks.
    2. Tries a lightweight httpx GET first.
    3. Only uses Playwright (headless Chromium) when PLAYWRIGHT_ENABLED=true
       **and** the httpx response is too short to be meaningful (JS-heavy page).
    """
    _validate_url_no_ssrf(url)

    # Step 1: cheap httpx fetch
    httpx_text = ""
    try:
        client = get_http_client()
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()
        httpx_text = _parse_html(response.text)
    except Exception:
        httpx_text = ""

    if len(httpx_text) >= _MIN_CONTENT_LENGTH:
        return httpx_text

    # Step 2: Playwright fallback for JS-heavy pages (opt-in)
    if not _is_playwright_enabled():
        return httpx_text

    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=_is_headless_enabled())
            context = await browser.new_context()
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                html = await page.content()
                return _parse_html(html)
            finally:
                await context.close()
                await browser.close()
    except Exception:
        return httpx_text


def _classify_claim(sentence: str) -> tuple[str, float]:
    lowered = sentence.lower()
    claim_type = "assertion"
    confidence = 0.7

    if any(hint in lowered for hint in METRIC_HINTS) or re.search(r"\b\d+(?:\.\d+)?\s?(?:%|percent|tonnes|tons|kg|kwh|mwh|co2)\b", lowered):
        claim_type = "metric"
        confidence = 0.9
    elif any(hint in lowered for hint in CERTIFICATION_HINTS):
        claim_type = "certification"
        confidence = 0.85
    elif any(hint in lowered for hint in COMMITMENT_HINTS):
        claim_type = "commitment"
        confidence = 0.8
    elif any(hint in lowered for hint in ASSERTION_HINTS):
        claim_type = "assertion"
        confidence = 0.75

    return claim_type, min(confidence, 0.95)


def _extract_claims(text: str) -> list[dict[str, Any]]:
    if not text:
        return []

    sentences = [segment.strip() for segment in re.split(r"(?<=[.!?])\s+", text) if segment.strip()]
    claims: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    for sentence in sentences:
        lowered = sentence.lower()
        for category, patterns in CLAIM_PATTERNS.items():
            if any(pattern in lowered for pattern in patterns):
                key = (category, lowered)
                if key in seen:
                    continue
                seen.add(key)
                claim_type, confidence = _classify_claim(sentence)
                claims.append(
                    {
                        "text": sentence,
                        "type": claim_type,
                        "category": category,
                        "confidence": confidence,
                    }
                )

    return claims[:40]


def _fallback_extract(text: str) -> dict[str, Any]:
    emails = sorted(set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)))
    urls = sorted(set(re.findall(r"https?://[^\s)]+", text)))
    dates = sorted(set(re.findall(r"\b\d{4}-\d{2}-\d{2}\b", text)))

    org_candidates = re.findall(r"\b[A-Z][A-Za-z0-9&.-]{2,}(?:\s+[A-Z][A-Za-z0-9&.-]{2,})*\b", text)
    organizations = sorted(set(org_candidates[:20]))

    return {
        "entities": {
            "emails": emails[:10],
            "urls": urls[:10],
            "dates": dates[:10],
            "organizations": organizations[:10],
        },
        "summary": text[:450].strip(),
    }


def _try_model_extract(text: str) -> tuple[dict[str, Any], str]:
    try:
        model_path = Path(__file__).resolve().parents[1] / "models" / "nlp_extractor.py"
        if not model_path.exists():
            return _fallback_extract(text), "model_not_integrated"

        spec = importlib.util.spec_from_file_location("document_nlp_extractor", model_path)
        if spec is None or spec.loader is None:
            return _fallback_extract(text), "model_not_integrated"
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        extract_fn = getattr(module, "extract_document_entities", None)
        if not callable(extract_fn):
            return _fallback_extract(text), "model_not_integrated"

        payload = extract_fn(text)
        if isinstance(payload, dict):
            return payload, "model_loaded"
        return _fallback_extract(text), "model_invalid_output"
    except Exception:
        return _fallback_extract(text), "model_not_integrated"


async def _resolve_text(input_type: str, document_bytes: bytes | None, url: str | None, webpage: str | None) -> str:
    normalized = input_type.strip().lower()
    if normalized == "document":
        if not document_bytes:
            return ""
        return document_bytes.decode("utf-8", errors="ignore").strip()

    if normalized == "url":
        if not url:
            return ""
        return await _scrape_url(url)

    if normalized == "webpage":
        return _parse_html(webpage or "")

    return ""


def _derive_subject(text: str) -> str:
    for token in text.split():
        stripped = token.strip(",.()[]{}")
        if len(stripped) > 2 and stripped[0].isalpha():
            return stripped
    return "Document"


async def analyze_document_input(
    input_type: str,
    document_bytes: bytes | None,
    url: str | None,
    webpage: str | None,
) -> dict:
    text = await _resolve_text(input_type, document_bytes, url, webpage)
    if not text:
        return {
            "inputType": input_type,
            "contentLength": 0,
            "esg": None,
            "esk": None,
            "extraction": {"entities": {}, "summary": ""},
            "claims": [],
            "modelStatus": "empty_input",
            "source": {"url": url},
        }

    extraction, model_status = _try_model_extract(text)
    claims = _extract_claims(text)
    subject = _derive_subject(text)

    try:
        esg = await fetch_esg_scores(subject)
    except Exception:
        esg = {
            "overall_score": 50.0,
            "scores": [],
            "confidence": 0.2,
            "source": "fallback",
        }

    return {
        "inputType": input_type,
        "contentLength": len(text),
        "esg": esg,
        "esk": esg,
        "extraction": extraction,
        "claims": claims,
        "modelStatus": model_status,
        "source": {"url": url},
    }
