"""Disclosure Gap Analyzer — checks document completeness against ESG framework checklists."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Any

from src.shared.clients.gemini_client import call_gemini


def _load_checklist_module():
    file_path = Path(__file__).resolve().parent.parent / "checklists" / "esg_frameworks.py"
    spec = importlib.util.spec_from_file_location("esg_frameworks_mod", file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load checklist from {file_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules["esg_frameworks_mod"] = module
    spec.loader.exec_module(module)
    return module


_checklist_mod = _load_checklist_module()


async def _call_gemini_json(prompt: str) -> dict[str, Any] | None:
    result = await call_gemini(prompt, temperature=0.1)
    if isinstance(result, dict):
        return result
    return None


def _build_extraction_prompt(text: str, field_ids: list[str], field_descriptions: dict[str, str]) -> str:
    fields_block = "\n".join(f'  "{fid}": "{field_descriptions[fid]}"' for fid in field_ids)
    return f"""Analyze the following sustainability/ESG report text and determine which of the listed disclosure fields are adequately covered.

For each field ID, respond with one of: "present", "weak", or "missing".
- "present" = the text clearly and adequately addresses this disclosure requirement
- "weak" = the topic is mentioned but lacks detail, specificity, or quantitative data
- "missing" = the text does not address this disclosure requirement at all

Return ONLY valid JSON with this exact shape:
{{"fields": {{"<field_id>": {{"status": "present"|"weak"|"missing", "evidence": "brief quote or reason"}}}} }}

Disclosure fields to check:
{{{fields_block}}}

Document text (first 8000 chars):
{text[:8000]}"""


async def analyze_disclosure_gaps(
    text: str,
    frameworks: list[str] | None = None,
) -> dict[str, Any]:
    get_checklist = _checklist_mod.get_checklist
    FRAMEWORK_MAP = _checklist_mod.FRAMEWORK_MAP

    selected_frameworks = frameworks or list(FRAMEWORK_MAP.keys())
    checklist = get_checklist(selected_frameworks)

    if not checklist:
        return {
            "compliance_score": 0,
            "total_fields": 0,
            "present_count": 0,
            "weak_count": 0,
            "missing_count": 0,
            "framework_results": [],
            "missing_fields": [],
            "weak_fields": [],
            "section_completeness": {},
        }

    field_ids = [f["id"] for f in checklist]
    field_map = {f["id"]: f for f in checklist}
    field_descriptions = {f["id"]: f"{f['field_name']}: {f['description']}" for f in checklist}

    gemini_result = await _call_gemini_json(
        _build_extraction_prompt(text, field_ids, field_descriptions)
    )

    field_statuses: dict[str, dict[str, str]] = {}
    if gemini_result and "fields" in gemini_result:
        field_statuses = gemini_result["fields"]

    present_ids: list[str] = []
    weak_ids: list[str] = []
    missing_ids: list[str] = []
    missing_fields: list[dict[str, str]] = []
    weak_fields: list[dict[str, str]] = []

    for fid in field_ids:
        entry = field_statuses.get(fid, {})
        status = entry.get("status", "missing") if isinstance(entry, dict) else "missing"
        evidence = entry.get("evidence", "") if isinstance(entry, dict) else ""

        if status == "present":
            present_ids.append(fid)
        elif status == "weak":
            weak_ids.append(fid)
            weak_fields.append({
                "id": fid,
                "framework": field_map[fid]["framework"],
                "section": field_map[fid]["section"],
                "field_name": field_map[fid]["field_name"],
                "evidence": evidence,
            })
        else:
            missing_ids.append(fid)
            missing_fields.append({
                "id": fid,
                "framework": field_map[fid]["framework"],
                "section": field_map[fid]["section"],
                "field_name": field_map[fid]["field_name"],
                "description": field_map[fid]["description"],
            })

    total = len(field_ids)
    present_count = len(present_ids)
    weak_count = len(weak_ids)
    compliance_score = round(((present_count + weak_count * 0.5) / max(total, 1)) * 100, 1)

    framework_results = []
    for fw in selected_frameworks:
        fw_fields = [f for f in checklist if f["framework"] == fw.upper()]
        fw_total = len(fw_fields)
        fw_present = sum(1 for f in fw_fields if f["id"] in present_ids)
        fw_weak = sum(1 for f in fw_fields if f["id"] in weak_ids)
        fw_missing = sum(1 for f in fw_fields if f["id"] in missing_ids)
        fw_score = round(((fw_present + fw_weak * 0.5) / max(fw_total, 1)) * 100, 1)
        framework_results.append({
            "framework": fw.upper(),
            "score": fw_score,
            "total_fields": fw_total,
            "present_count": fw_present,
            "weak_count": fw_weak,
            "missing_count": fw_missing,
        })

    sections: dict[str, dict[str, Any]] = {}
    for f in checklist:
        sec = f["section"]
        if sec not in sections:
            sections[sec] = {"total": 0, "present": 0, "weak": 0, "missing": 0}
        sections[sec]["total"] += 1
        if f["id"] in present_ids:
            sections[sec]["present"] += 1
        elif f["id"] in weak_ids:
            sections[sec]["weak"] += 1
        else:
            sections[sec]["missing"] += 1

    section_completeness = {}
    for sec, counts in sections.items():
        pct = round(((counts["present"] + counts["weak"] * 0.5) / max(counts["total"], 1)) * 100, 1)
        if pct >= 80:
            status = "complete"
        elif pct >= 40:
            status = "partial"
        else:
            status = "incomplete"
        section_completeness[sec] = {"status": status, "percentage": pct, **counts}

    return {
        "compliance_score": compliance_score,
        "total_fields": total,
        "present_count": present_count,
        "weak_count": weak_count,
        "missing_count": len(missing_ids),
        "framework_results": framework_results,
        "missing_fields": missing_fields,
        "weak_fields": weak_fields,
        "section_completeness": section_completeness,
    }
