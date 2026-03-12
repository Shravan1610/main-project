"""Compliance Risk & Recommendation Engine — evaluates disclosure quality and identifies risks."""

from __future__ import annotations

from typing import Any

from src.shared.clients.gemini_client import call_gemini


async def _call_gemini_json(prompt: str) -> dict[str, Any] | None:
    result = await call_gemini(prompt, temperature=0.15)
    if isinstance(result, dict):
        return result
    return None


def _build_risk_analysis_prompt(text: str, frameworks: list[str]) -> str:
    fw_str = ", ".join(frameworks)
    return f"""You are an expert ESG compliance auditor. Analyze the following sustainability report for compliance risks against these frameworks: {fw_str}.

Evaluate the text for:
1. Vague, unsupported, or non-standard language
2. Inconsistencies between sections (e.g., claiming net-zero but no transition plan)
3. Claims without evidence, baselines, targets, or verification
4. Non-compliance with standard disclosure requirements
5. Potential greenwashing red flags

Return ONLY valid JSON with this exact shape:
{{
  "severity_score": <number 0-100, higher = more risky>,
  "risk_level": "<low|medium|high|critical>",
  "risk_flags": [
    {{
      "id": "<short_id>",
      "severity": "<high|medium|low>",
      "section": "<which report section>",
      "description": "<what the risk is>",
      "original_text": "<brief quote from the document>",
      "recommendation": "<specific fix>"
    }}
  ],
  "consistency_issues": [
    {{
      "description": "<inconsistency found>",
      "sections_involved": ["<section1>", "<section2>"],
      "severity": "<high|medium|low>"
    }}
  ],
  "action_items": [
    {{
      "priority": <1-5, 1=highest>,
      "action": "<what to do>",
      "section": "<which section>",
      "rationale": "<why this matters>"
    }}
  ]
}}

Limit risk_flags to 15 max, consistency_issues to 8 max, action_items to 10 max.
Sort action_items by priority (1=highest).

Document text (first 8000 chars):
{text[:8000]}"""


async def analyze_compliance_risk(
    text: str,
    frameworks: list[str] | None = None,
) -> dict[str, Any]:
    selected_frameworks = [fw.upper() for fw in (frameworks or ["GRI", "TCFD"])]

    gemini_result = await _call_gemini_json(
        _build_risk_analysis_prompt(text, selected_frameworks)
    )

    if not gemini_result:
        return _fallback_risk_analysis(text)

    severity_score = gemini_result.get("severity_score", 50)
    if isinstance(severity_score, str):
        try:
            severity_score = float(severity_score)
        except ValueError:
            severity_score = 50

    risk_level = gemini_result.get("risk_level", "medium")
    if risk_level not in ("low", "medium", "high", "critical"):
        if severity_score < 25:
            risk_level = "low"
        elif severity_score < 50:
            risk_level = "medium"
        elif severity_score < 75:
            risk_level = "high"
        else:
            risk_level = "critical"

    risk_flags = gemini_result.get("risk_flags", [])
    if not isinstance(risk_flags, list):
        risk_flags = []

    consistency_issues = gemini_result.get("consistency_issues", [])
    if not isinstance(consistency_issues, list):
        consistency_issues = []

    action_items = gemini_result.get("action_items", [])
    if not isinstance(action_items, list):
        action_items = []
    action_items.sort(key=lambda x: x.get("priority", 99))

    return {
        "severity_score": round(float(severity_score), 1),
        "risk_level": risk_level,
        "frameworks_checked": selected_frameworks,
        "risk_flags": risk_flags[:15],
        "consistency_issues": consistency_issues[:8],
        "action_items": action_items[:10],
        "total_risk_flags": len(risk_flags),
        "high_severity_count": sum(1 for f in risk_flags if f.get("severity") == "high"),
        "medium_severity_count": sum(1 for f in risk_flags if f.get("severity") == "medium"),
        "low_severity_count": sum(1 for f in risk_flags if f.get("severity") == "low"),
    }


def _fallback_risk_analysis(text: str) -> dict[str, Any]:
    """Basic rule-based fallback when Gemini is unavailable."""
    import re

    risk_flags: list[dict[str, Any]] = []
    text_lower = text.lower()

    vague_patterns = [
        (r"committed\s+to\s+(?:a\s+)?sustainable", "Vague sustainability commitment without specifics"),
        (r"net[- ]zero", "Net-zero claim requires target year, baseline, and transition plan"),
        (r"carbon\s+neutral", "Carbon neutral claim requires verification methodology"),
        (r"100%\s+(?:renewable|clean|green)", "Absolute renewable claim needs verification evidence"),
        (r"industry[- ]leading", "Unsubstantiated superlative claim"),
        (r"best[- ]in[- ]class", "Unsubstantiated comparative claim"),
        (r"significantly\s+reduc", "Vague reduction claim without quantification"),
        (r"working\s+towards?", "Open-ended commitment with no target or timeline"),
    ]

    for pattern, desc in vague_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            risk_flags.append({
                "id": f"rule-{len(risk_flags)+1}",
                "severity": "medium",
                "section": "General",
                "description": desc,
                "original_text": matches[0][:100] if matches else "",
                "recommendation": f"Provide specific data, baselines, targets, and verification for this claim.",
            })

    has_scope3 = "scope 3" in text_lower
    has_methodology = "methodology" in text_lower or "ghg protocol" in text_lower
    if not has_methodology and ("scope 1" in text_lower or "scope 2" in text_lower):
        risk_flags.append({
            "id": f"rule-{len(risk_flags)+1}",
            "severity": "high",
            "section": "Emissions",
            "description": "Emissions data disclosed without methodology reference",
            "original_text": "",
            "recommendation": "Reference the GHG Protocol or other recognized methodology, include emission factors and GWP values.",
        })

    if not has_scope3 and "emission" in text_lower:
        risk_flags.append({
            "id": f"rule-{len(risk_flags)+1}",
            "severity": "medium",
            "section": "Emissions",
            "description": "No Scope 3 emissions disclosure found",
            "original_text": "",
            "recommendation": "Disclose Scope 3 emissions categories or explain why they are not applicable.",
        })

    severity_score = min(100, len(risk_flags) * 12 + 10)
    if severity_score < 25:
        risk_level = "low"
    elif severity_score < 50:
        risk_level = "medium"
    elif severity_score < 75:
        risk_level = "high"
    else:
        risk_level = "critical"

    return {
        "severity_score": round(severity_score, 1),
        "risk_level": risk_level,
        "frameworks_checked": ["RULE_BASED_FALLBACK"],
        "risk_flags": risk_flags[:15],
        "consistency_issues": [],
        "action_items": [
            {"priority": i + 1, "action": f["recommendation"], "section": f["section"], "rationale": f["description"]}
            for i, f in enumerate(risk_flags[:10])
        ],
        "total_risk_flags": len(risk_flags),
        "high_severity_count": sum(1 for f in risk_flags if f.get("severity") == "high"),
        "medium_severity_count": sum(1 for f in risk_flags if f.get("severity") == "medium"),
        "low_severity_count": sum(1 for f in risk_flags if f.get("severity") == "low"),
    }
