from __future__ import annotations

import asyncio
import importlib.util
import io
from pathlib import Path
import re
import sys
from typing import Any

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


def _strip_html(content: str) -> str:
    cleaned = re.sub(r"<script[\s\S]*?</script>", " ", content, flags=re.IGNORECASE)
    cleaned = re.sub(r"<style[\s\S]*?</style>", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()

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
        client = get_http_client()
        response = await client.get(url)
        response.raise_for_status()
        html = response.text
        return _strip_html(html)

    if normalized == "webpage":
        return _strip_html(webpage or "")

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
            "modelStatus": "empty_input",
            "source": {"url": url},
            "aiAnalytics": None,
        }

    extraction, base_status = _try_model_extract(text)
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
        "modelStatus": model_status,
        "source": {"url": url},
        "aiAnalytics": ai_analytics,
    }
