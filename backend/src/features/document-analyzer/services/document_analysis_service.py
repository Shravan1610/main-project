from __future__ import annotations

import asyncio
import io
import importlib.util
import ipaddress
import os
from pathlib import Path
import re
import socket
import sys
from typing import Any
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from src.shared.clients.http_client import get_http_client

# ---------------------------------------------------------------------------
# AI Model endpoints
# ---------------------------------------------------------------------------
ESG_MODEL_URL = "https://greenverify-api.onrender.com"
NLP_MODEL_URL = "https://greenverifynlp-api.onrender.com"

# ---------------------------------------------------------------------------
# Greenwashing detection patterns
# ---------------------------------------------------------------------------
_GREENWASH_PHRASES = [
    "committed to being 100% sustainable",
    "eco-friendly",
    "carbon neutral",
    "net zero",
    "green energy leader",
    "industry-leading sustainability",
    "best-in-class esg",
    "world-class environmental",
    "fully sustainable",
    "zero environmental impact",
    "completely green",
    "100% clean energy",
]

_VAGUE_CLAIM_PATTERNS = [
    r"significantly\s+(?:reduc|improv|lower)",
    r"substantially\s+(?:reduc|improv|lower|better)",
    r"committed\s+to\s+(?:a\s+)?sustainable",
    r"striving\s+(?:for|to|towards)",
    r"working\s+towards?\s+(?:a\s+)?(?:greener|sustainable|better)",
    r"dedicated\s+to\s+(?:protect|preserv|sustain)",
    r"passionate\s+about\s+(?:the\s+)?environment",
]

# ---------------------------------------------------------------------------
# ESG bridge loader (existing)
# ---------------------------------------------------------------------------


def _load_fetch_esg_scores():
    file_path = Path(__file__).resolve().parents[2] / "esg-bridge" / "services" / "esg_client.py"
    spec = importlib.util.spec_from_file_location("doc_analyzer_esg_client", file_path)
    if spec is None or spec.loader is None:
        raise ImportError("Unable to load ESG client")
    module = importlib.util.module_from_spec(spec)
    sys.modules["doc_analyzer_esg_client"] = module
    spec.loader.exec_module(module)
    fn = getattr(module, "fetch_esg_scores", None)
    if not callable(fn):
        raise AttributeError("fetch_esg_scores function missing in ESG client")
    return fn


fetch_esg_scores = _load_fetch_esg_scores()

# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)
    except Exception:
        return pdf_bytes.decode("utf-8", errors="ignore").strip()

# ---------------------------------------------------------------------------
# HTML / text helpers
# ---------------------------------------------------------------------------


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

# ---------------------------------------------------------------------------
# ESG metric extraction from text
# ---------------------------------------------------------------------------


def _find_number_near(text_lower: str, keywords: list[str], default: float) -> float:
    for kw in keywords:
        pattern = rf"{re.escape(kw)}[\s:=\-–—]*\$?\s*(\d[\d,]*\.?\d*)"
        match = re.search(pattern, text_lower)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                continue
        pattern2 = rf"(\d[\d,]*\.?\d*)\s*(?:million|billion|mt|mw|gw|twh|kwh|%)?\s*{re.escape(kw)}"
        match2 = re.search(pattern2, text_lower)
        if match2:
            try:
                return float(match2.group(1).replace(",", ""))
            except ValueError:
                continue
    return default


def _extract_esg_metrics(text: str) -> dict[str, float]:
    t = text.lower()
    return {
        "gdp": _find_number_near(t, ["revenue", "gdp", "turnover", "total revenue", "annual revenue"], 1000.0),
        "population": _find_number_near(t, ["employees", "workforce", "headcount", "staff", "personnel"], 50000.0),
        "coal_consumption": _find_number_near(t, ["coal consumption", "coal usage", "coal energy", "coal"], 30.0),
        "gas_consumption": _find_number_near(t, ["gas consumption", "natural gas", "gas usage"], 40.0),
        "oil_consumption": _find_number_near(t, ["oil consumption", "petroleum", "oil usage", "crude oil"], 35.0),
        "renewables_consumption": _find_number_near(t, ["renewable consumption", "renewable energy", "renewables", "clean energy"], 20.0),
        "solar_consumption": _find_number_near(t, ["solar consumption", "solar energy", "solar power", "solar capacity"], 5.0),
        "wind_consumption": _find_number_near(t, ["wind consumption", "wind energy", "wind power", "wind capacity"], 5.0),
        "hydro_consumption": _find_number_near(t, ["hydro consumption", "hydroelectric", "hydro energy", "hydropower"], 8.0),
    }

# ---------------------------------------------------------------------------
# Greenwashing detection
# ---------------------------------------------------------------------------


def _detect_greenwashing(text: str) -> dict[str, Any]:
    text_lower = text.lower()
    suspicious: list[str] = []
    sentences = re.split(r"[.!?]\s+", text)

    for phrase in _GREENWASH_PHRASES:
        if phrase in text_lower:
            for sent in sentences:
                if phrase in sent.lower():
                    cleaned = sent.strip()[:200]
                    if cleaned and cleaned not in suspicious:
                        suspicious.append(cleaned)
                    break

    vague_count = 0
    for pattern in _VAGUE_CLAIM_PATTERNS:
        hits = re.findall(pattern, text_lower)
        vague_count += len(hits)
        for _ in hits[:2]:
            for sent in sentences:
                if re.search(pattern, sent.lower()):
                    cleaned = sent.strip()[:200]
                    if cleaned and cleaned not in suspicious:
                        suspicious.append(cleaned)
                    break

    specific_count = len(re.findall(
        r"\d+\.?\d*\s*(?:%|percent|tonnes?|tons?|mw|gw|kwh|mwh|twh|co2|million|billion)",
        text_lower,
    ))

    total = len(suspicious) + vague_count + specific_count
    if total == 0:
        prob = 0.1
    else:
        vague_ratio = (len(suspicious) + vague_count) / max(total, 1)
        prob = min(0.95, vague_ratio * 0.8 + 0.05)

    return {
        "probability": round(prob, 3),
        "suspicious_statements": suspicious[:10],
        "vague_claim_count": vague_count,
        "specific_claim_count": specific_count,
    }

# ---------------------------------------------------------------------------
# AI model callers
# ---------------------------------------------------------------------------


async def _call_esg_model(metrics: dict[str, float]) -> dict[str, Any]:
    try:
        client = get_http_client()
        resp = await client.post(f"{ESG_MODEL_URL}/predict", json=metrics)
        resp.raise_for_status()
        return resp.json() if resp.content else {}
    except Exception as exc:
        return {"error": str(exc), "status": "unavailable"}


async def _call_nlp_model(metrics: dict[str, float]) -> dict[str, Any]:
    try:
        client = get_http_client()
        resp = await client.post(f"{NLP_MODEL_URL}/predict", json=metrics)
        resp.raise_for_status()
        return resp.json() if resp.content else {}
    except Exception as exc:
        return {"error": str(exc), "status": "unavailable"}

# ---------------------------------------------------------------------------
# Analytics computation
# ---------------------------------------------------------------------------


def _compute_analytics(
    esg_resp: dict[str, Any],
    nlp_resp: dict[str, Any],
    greenwash: dict[str, Any],
    metrics: dict[str, float],
) -> dict[str, Any]:
    # --- ESG risk score ---
    esg_score: float | None = None
    esg_level = "N/A"
    esg_conf: float | None = None

    if "error" not in esg_resp:
        raw = esg_resp.get("risk_score") or esg_resp.get("score") or esg_resp.get("prediction_score")
        if raw is not None:
            esg_score = float(raw)
            if esg_score <= 1.0:
                esg_score *= 100

        pred = esg_resp.get("prediction") or esg_resp.get("risk_level") or esg_resp.get("label")
        if isinstance(pred, str):
            esg_level = pred
        elif isinstance(pred, (int, float)):
            val = float(pred)
            if val <= 1:
                val *= 100
            if esg_score is None:
                esg_score = val

        esg_conf = esg_resp.get("confidence") or esg_resp.get("probability")
        if esg_conf is not None:
            esg_conf = float(esg_conf)
            if esg_conf > 1:
                esg_conf /= 100

    if esg_score is None:
        fossil = metrics["coal_consumption"] + metrics["gas_consumption"] + metrics["oil_consumption"]
        renew = (metrics["renewables_consumption"] + metrics["solar_consumption"]
                 + metrics["wind_consumption"] + metrics["hydro_consumption"])
        total = fossil + renew
        esg_score = round((fossil / total) * 100, 1) if total > 0 else 50.0

    if esg_level == "N/A":
        if esg_score < 30:
            esg_level = "Low Risk"
        elif esg_score < 60:
            esg_level = "Medium Risk"
        else:
            esg_level = "High Risk"

    if esg_conf is None:
        esg_conf = 0.5 if "error" in esg_resp else 0.75

    # --- NLP climate credibility ---
    climate_cred = 0.5
    if "error" not in nlp_resp:
        nlp_score = nlp_resp.get("risk_score") or nlp_resp.get("score") or nlp_resp.get("prediction_score")
        nlp_conf = nlp_resp.get("confidence") or nlp_resp.get("probability")
        if nlp_score is not None:
            v = float(nlp_score)
            if v <= 1:
                v *= 100
            climate_cred = round((100 - v) / 100, 3)
        elif nlp_conf is not None:
            climate_cred = round(float(nlp_conf), 3)
        else:
            climate_cred = 0.65

    # --- Risk breakdown ---
    fossil = metrics["coal_consumption"] + metrics["gas_consumption"] + metrics["oil_consumption"]
    renew = (metrics["renewables_consumption"] + metrics["solar_consumption"]
             + metrics["wind_consumption"] + metrics["hydro_consumption"])
    total_energy = fossil + renew
    carbon_exp = round((fossil / max(total_energy, 1)) * 100, 1) if total_energy > 0 else 50.0
    env_risk = round(esg_score * 0.6 + carbon_exp * 0.4, 1)
    gov_risk = round(greenwash["probability"] * 80 + (1 - esg_conf) * 20, 1)
    gw_prob = greenwash["probability"]

    if "error" in esg_resp and "error" in nlp_resp:
        status = "unavailable"
    elif gw_prob > 0.6:
        status = "flagged"
    else:
        status = "verified"

    return {
        "esgRiskScore": round(esg_score, 1),
        "esgRiskLevel": esg_level,
        "aiConfidence": round(esg_conf, 3),
        "greenwashingProbability": round(gw_prob, 3),
        "climateClaimCredibility": round(climate_cred, 3),
        "suspiciousStatements": greenwash["suspicious_statements"],
        "riskBreakdown": {
            "environmentalRisk": env_risk,
            "governanceRisk": gov_risk,
            "carbonExposure": carbon_exp,
            "greenwashingRisk": round(gw_prob * 100, 1),
        },
        "esgModelResponse": esg_resp,
        "nlpModelResponse": nlp_resp,
        "verificationStatus": status,
        "extractedMetrics": metrics,
    }

# ---------------------------------------------------------------------------
# Entity extraction (existing)
# ---------------------------------------------------------------------------


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
        sys.modules["document_nlp_extractor"] = module
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

# ---------------------------------------------------------------------------
# Text resolution
# ---------------------------------------------------------------------------


async def _resolve_text(input_type: str, document_bytes: bytes | None, url: str | None, webpage: str | None) -> str:
    normalized = input_type.strip().lower()
    if normalized == "document":
        if not document_bytes:
            return ""
        if document_bytes[:5] == b"%PDF-":
            return _extract_pdf_text(document_bytes)
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

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


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
            "aiAnalytics": None,
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

    # --- AI model integration ---
    metrics = _extract_esg_metrics(text)
    greenwash = _detect_greenwashing(text)

    esg_model_resp, nlp_model_resp = await asyncio.gather(
        _call_esg_model(metrics),
        _call_nlp_model(metrics),
    )

    ai_analytics = _compute_analytics(esg_model_resp, nlp_model_resp, greenwash, metrics)

    if "error" in esg_model_resp and "error" in nlp_model_resp:
        model_status = "ai_models_unavailable"
    elif "error" in esg_model_resp or "error" in nlp_model_resp:
        model_status = "partial_ai_analysis"
    else:
        model_status = "ai_models_loaded"

    return {
        "inputType": input_type,
        "contentLength": len(text),
        "esg": esg,
        "esk": esg,
        "extraction": extraction,
        "claims": claims,
        "modelStatus": model_status,
        "source": {"url": url},
        "aiAnalytics": ai_analytics,
    }
