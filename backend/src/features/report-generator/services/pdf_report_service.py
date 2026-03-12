"""PDF report generation service for GreenTrust analysis outputs.

Generates professional PDF reports for:
- Document Analyzer (ESG + NLP)
- Disclosure Gap Analyzer
- Compliance Risk Engine
"""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ── Brand colours ───────────────────────────────────────────────
BRAND_GREEN = colors.HexColor("#22c55e")
BRAND_CYAN = colors.HexColor("#06b6d4")
BRAND_AMBER = colors.HexColor("#f59e0b")
BRAND_RED = colors.HexColor("#ef4444")
DARK_BG = colors.HexColor("#0a0f1a")
SURFACE_BG = colors.HexColor("#111827")
TEXT_PRIMARY = colors.HexColor("#e2e8f0")
TEXT_MUTED = colors.HexColor("#94a3b8")
BORDER_COLOR = colors.HexColor("#1e293b")


def _severity_color(severity: str) -> colors.Color:
    mapping = {"high": BRAND_RED, "critical": BRAND_RED, "medium": BRAND_AMBER, "low": BRAND_CYAN}
    return mapping.get(severity.lower(), TEXT_MUTED)


def _score_color(value: float, inverse: bool = False) -> colors.Color:
    if inverse:
        if value < 30:
            return BRAND_GREEN
        if value < 60:
            return BRAND_AMBER
        return BRAND_RED
    if value > 70:
        return BRAND_GREEN
    if value > 40:
        return BRAND_AMBER
    return BRAND_RED


def _build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ReportTitle", parent=base["Title"],
            fontSize=22, leading=28, textColor=BRAND_CYAN,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "ReportSubtitle", parent=base["Normal"],
            fontSize=10, leading=14, textColor=TEXT_MUTED,
            spaceAfter=16,
        ),
        "heading": ParagraphStyle(
            "SectionHeading", parent=base["Heading2"],
            fontSize=14, leading=18, textColor=BRAND_CYAN,
            spaceBefore=16, spaceAfter=8,
        ),
        "subheading": ParagraphStyle(
            "SubHeading", parent=base["Heading3"],
            fontSize=11, leading=14, textColor=TEXT_PRIMARY,
            spaceBefore=10, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "BodyText", parent=base["Normal"],
            fontSize=9, leading=13, textColor=TEXT_PRIMARY,
        ),
        "muted": ParagraphStyle(
            "MutedText", parent=base["Normal"],
            fontSize=8, leading=11, textColor=TEXT_MUTED,
        ),
        "metric_label": ParagraphStyle(
            "MetricLabel", parent=base["Normal"],
            fontSize=8, leading=10, textColor=TEXT_MUTED,
            alignment=TA_CENTER,
        ),
        "metric_value": ParagraphStyle(
            "MetricValue", parent=base["Normal"],
            fontSize=18, leading=22, alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            "Footer", parent=base["Normal"],
            fontSize=7, leading=9, textColor=TEXT_MUTED,
            alignment=TA_CENTER,
        ),
    }


def _header_section(styles: dict, title: str, report_type: str) -> list:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return [
        Paragraph(title, styles["title"]),
        Paragraph(f"{report_type} · Generated {now} · GreenTrust Platform", styles["subtitle"]),
        HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=12),
    ]


def _metric_box(label: str, value: str, color: colors.Color, styles: dict) -> list:
    return [
        Paragraph(f'<font color="#{color.hexval()[2:]}">{value}</font>', styles["metric_value"]),
        Paragraph(label, styles["metric_label"]),
    ]


def _score_table(metrics: list[tuple[str, str, colors.Color]], styles: dict) -> Table:
    """Create a row of metric boxes."""
    row_values = []
    row_labels = []
    for label, value, color in metrics:
        hex_c = color.hexval()[2:]
        row_values.append(Paragraph(f'<font color="#{hex_c}"><b>{value}</b></font>', styles["metric_value"]))
        row_labels.append(Paragraph(label, styles["metric_label"]))

    t = Table([row_values, row_labels], colWidths=[4.5 * cm] * len(metrics))
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def _data_table(headers: list[str], rows: list[list[str]], col_widths: list[float] | None = None) -> Table:
    styled_headers = [[Paragraph(f'<b>{h}</b>', ParagraphStyle("TH", fontSize=8, textColor=TEXT_MUTED)) for h in headers]]
    styled_rows = [
        [Paragraph(str(cell), ParagraphStyle("TD", fontSize=8, textColor=TEXT_PRIMARY, leading=11)) for cell in row]
        for row in rows
    ]
    data = styled_headers + styled_rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), SURFACE_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_MUTED),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.25, BORDER_COLOR),
    ]
    # Alternate row colouring
    for i in range(1, len(data)):
        bg = DARK_BG if i % 2 else SURFACE_BG
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


def _footer(canvas, doc, styles):
    canvas.saveState()
    canvas.setFillColor(TEXT_MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(
        A4[0] / 2, 15 * mm,
        f"GreenTrust — Sustainable Finance Intelligence · Page {doc.page}",
    )
    canvas.restoreState()


# ═══════════════════════════════════════════════════════════════
# PUBLIC GENERATORS
# ═══════════════════════════════════════════════════════════════

def generate_document_analyzer_report(data: dict[str, Any]) -> bytes:
    """Generate a PDF report for Document Analyzer results."""
    buf = io.BytesIO()
    styles = _build_styles()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2.5 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
    )
    elements: list = []

    # Header
    elements.extend(_header_section(styles, "ESG + NLP Document Analysis Report", "Document Analyzer"))

    # Key metrics
    ai = data.get("aiAnalytics") or {}
    esg_risk = ai.get("esgRiskScore", "N/A")
    risk_level = ai.get("esgRiskLevel", "N/A")
    gw_prob = ai.get("greenwashingProbability")
    cc_cred = ai.get("climateClaimCredibility")
    confidence = ai.get("aiConfidence")

    metrics = [
        ("ESG Risk Score", str(esg_risk), _score_color(float(esg_risk) if isinstance(esg_risk, (int, float)) else 50, inverse=True)),
        ("Risk Level", str(risk_level), _severity_color(risk_level.split()[0].lower() if isinstance(risk_level, str) and " " in risk_level else "medium")),
    ]
    if gw_prob is not None:
        metrics.append(("Greenwashing", f"{gw_prob * 100:.1f}%", _score_color(gw_prob * 100, inverse=True)))
    if cc_cred is not None:
        metrics.append(("Climate Credibility", f"{cc_cred * 100:.1f}%", _score_color(cc_cred * 100)))
    if confidence is not None:
        metrics.append(("AI Confidence", f"{confidence * 100:.1f}%", BRAND_CYAN))

    elements.append(_score_table(metrics[:4], styles))
    elements.append(Spacer(1, 12))

    # Summary & metadata
    elements.append(Paragraph("Analysis Overview", styles["heading"]))
    input_type = data.get("inputType", "unknown")
    engine = data.get("analysisEngine", input_type)
    content_len = data.get("contentLength", 0)
    model_status = data.get("modelStatus", "unknown")
    elements.append(Paragraph(
        f"Input: <b>{input_type}</b> · Engine: <b>{engine}</b> · Content: <b>{content_len:,}</b> chars · Model: <b>{model_status}</b>",
        styles["body"],
    ))
    elements.append(Spacer(1, 6))

    summary = (data.get("extraction") or {}).get("summary")
    if summary:
        elements.append(Paragraph("Summary", styles["subheading"]))
        elements.append(Paragraph(summary, styles["body"]))
        elements.append(Spacer(1, 8))

    # Risk breakdown
    breakdown = ai.get("riskBreakdown", {})
    if breakdown:
        elements.append(Paragraph("ESG Risk Breakdown", styles["heading"]))
        rows = []
        for key, value in breakdown.items():
            label = key.replace("_", " ").replace("camelCase", "").title()
            # Convert camelCase
            import re
            label = re.sub(r"([A-Z])", r" \1", key).strip().title()
            rows.append([label, f"{value:.1f}/100"])
        elements.append(_data_table(["Category", "Score"], rows, col_widths=[10 * cm, 4 * cm]))
        elements.append(Spacer(1, 8))

    # Suspicious statements
    suspicious = ai.get("suspiciousStatements", [])
    if suspicious:
        elements.append(Paragraph("Suspicious ESG Statements", styles["heading"]))
        for stmt in suspicious:
            elements.append(Paragraph(f'• "{stmt}"', styles["body"]))
        elements.append(Spacer(1, 8))

    # Entities
    entities = (data.get("extraction") or {}).get("entities", {})
    if entities:
        elements.append(Paragraph("Extracted Entities", styles["heading"]))
        rows = [[k.title(), ", ".join(v) if v else "None"] for k, v in entities.items() if v]
        if rows:
            elements.append(_data_table(["Type", "Values"], rows, col_widths=[4 * cm, 10 * cm]))
            elements.append(Spacer(1, 8))

    # Claims
    claims = data.get("claims", [])
    if claims:
        elements.append(Paragraph(f"ESG Claims Detected ({len(claims)})", styles["heading"]))
        rows = []
        for c in claims[:20]:
            conf = c.get("confidence", 0)
            rows.append([
                c.get("category", ""),
                c.get("type", ""),
                c.get("text", "")[:80],
                f"{conf * 100:.0f}%",
            ])
        elements.append(_data_table(
            ["Category", "Type", "Claim", "Confidence"],
            rows,
            col_widths=[3 * cm, 2.5 * cm, 7 * cm, 2 * cm],
        ))

    doc.build(elements, onLaterPages=lambda c, d: _footer(c, d, styles), onFirstPage=lambda c, d: _footer(c, d, styles))
    return buf.getvalue()


def generate_disclosure_gap_report(data: dict[str, Any]) -> bytes:
    """Generate a PDF report for Disclosure Gap Analyzer results."""
    buf = io.BytesIO()
    styles = _build_styles()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2.5 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
    )
    elements: list = []

    elements.extend(_header_section(styles, "Disclosure Gap Analysis Report", "ESG Compliance"))

    # Key metrics
    score = data.get("compliance_score", 0)
    present = data.get("present_count", 0)
    weak = data.get("weak_count", 0)
    missing = data.get("missing_count", 0)
    total = data.get("total_fields", 0)

    metrics = [
        ("Compliance Score", f"{score}%", _score_color(score)),
        ("Present", str(present), BRAND_GREEN),
        ("Weak", str(weak), BRAND_AMBER),
        ("Missing", str(missing), BRAND_RED),
    ]
    elements.append(_score_table(metrics, styles))
    elements.append(Spacer(1, 12))

    # Framework breakdown
    fw_results = data.get("framework_results", [])
    if fw_results:
        elements.append(Paragraph("Framework Breakdown", styles["heading"]))
        rows = []
        for fw in fw_results:
            rows.append([
                fw.get("framework", ""),
                f"{fw.get('score', 0)}%",
                str(fw.get("present_count", 0)),
                str(fw.get("weak_count", 0)),
                str(fw.get("missing_count", 0)),
            ])
        elements.append(_data_table(
            ["Framework", "Score", "Present", "Weak", "Missing"],
            rows,
            col_widths=[3.5 * cm, 2.5 * cm, 2.5 * cm, 2.5 * cm, 2.5 * cm],
        ))
        elements.append(Spacer(1, 8))

    # Section completeness
    sections = data.get("section_completeness", {})
    if sections:
        elements.append(Paragraph("Section Completeness", styles["heading"]))
        rows = []
        for section, info in sections.items():
            status = info.get("status", "unknown") if isinstance(info, dict) else "unknown"
            pct = info.get("percentage", 0) if isinstance(info, dict) else 0
            rows.append([section, status.upper(), f"{pct}%"])
        elements.append(_data_table(
            ["Section", "Status", "Completeness"],
            rows,
            col_widths=[7 * cm, 3.5 * cm, 3 * cm],
        ))
        elements.append(Spacer(1, 8))

    # Missing fields
    missing_fields = data.get("missing_fields", [])
    if missing_fields:
        elements.append(Paragraph(f"Missing Disclosures ({len(missing_fields)})", styles["heading"]))
        rows = [[f.get("framework", ""), f.get("section", ""), f.get("field_name", "")] for f in missing_fields]
        elements.append(_data_table(
            ["Framework", "Section", "Field"],
            rows,
            col_widths=[3 * cm, 4.5 * cm, 6 * cm],
        ))
        elements.append(Spacer(1, 8))

    # Weak fields
    weak_fields = data.get("weak_fields", [])
    if weak_fields:
        elements.append(Paragraph(f"Weak Disclosures ({len(weak_fields)})", styles["heading"]))
        rows = []
        for f in weak_fields:
            evidence = f.get("evidence", "")
            rows.append([f.get("framework", ""), f.get("field_name", ""), evidence[:60] if evidence else "—"])
        elements.append(_data_table(
            ["Framework", "Field", "Evidence"],
            rows,
            col_widths=[3 * cm, 5 * cm, 5.5 * cm],
        ))

    doc.build(elements, onLaterPages=lambda c, d: _footer(c, d, styles), onFirstPage=lambda c, d: _footer(c, d, styles))
    return buf.getvalue()


def generate_compliance_risk_report(data: dict[str, Any]) -> bytes:
    """Generate a PDF report for Compliance Risk Engine results."""
    buf = io.BytesIO()
    styles = _build_styles()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2.5 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
    )
    elements: list = []

    elements.extend(_header_section(styles, "Compliance Risk Assessment Report", "Risk Engine"))

    # Key metrics
    severity = data.get("severity_score", 0)
    risk_level = data.get("risk_level", "unknown")
    high_count = data.get("high_severity_count", 0)
    med_count = data.get("medium_severity_count", 0)
    low_count = data.get("low_severity_count", 0)

    metrics = [
        ("Severity Score", str(severity), _severity_color(risk_level)),
        ("Risk Level", risk_level.upper(), _severity_color(risk_level)),
        ("High Risk", str(high_count), BRAND_RED),
        ("Medium Risk", str(med_count), BRAND_AMBER),
        ("Low Risk", str(low_count), BRAND_CYAN),
    ]
    elements.append(_score_table(metrics, styles))
    elements.append(Spacer(1, 12))

    # Risk flags
    risk_flags = data.get("risk_flags", [])
    if risk_flags:
        elements.append(Paragraph(f"Risk Flags ({len(risk_flags)})", styles["heading"]))
        for flag in risk_flags:
            sev = flag.get("severity", "low")
            section = flag.get("section", "")
            desc = flag.get("description", "")
            orig = flag.get("original_text", "")
            rec = flag.get("recommendation", "")

            hex_c = _severity_color(sev).hexval()[2:]
            elements.append(Paragraph(
                f'<font color="#{hex_c}"><b>[{sev.upper()}]</b></font> <b>{section}</b>',
                styles["subheading"],
            ))
            elements.append(Paragraph(desc, styles["body"]))
            if orig:
                elements.append(Paragraph(f'<i>"{orig[:120]}"</i>', styles["muted"]))
            if rec:
                green_hex = BRAND_GREEN.hexval()[2:]
                elements.append(Paragraph(
                    f'<font color="#{green_hex}">Recommendation:</font> {rec}',
                    styles["body"],
                ))
            elements.append(Spacer(1, 6))

    # Consistency issues
    issues = data.get("consistency_issues", [])
    if issues:
        elements.append(Paragraph(f"Consistency Issues ({len(issues)})", styles["heading"]))
        rows = []
        for issue in issues:
            sev = issue.get("severity", "low")
            sections = issue.get("sections_involved", [])
            rows.append([sev.upper(), " ↔ ".join(sections) if sections else "—", issue.get("description", "")])
        elements.append(_data_table(
            ["Severity", "Sections", "Description"],
            rows,
            col_widths=[2 * cm, 4 * cm, 7.5 * cm],
        ))
        elements.append(Spacer(1, 8))

    # Action items
    actions = data.get("action_items", [])
    if actions:
        elements.append(Paragraph(f"Prioritized Action Items ({len(actions)})", styles["heading"]))
        rows = []
        for item in actions:
            rows.append([
                str(item.get("priority", "")),
                item.get("section", ""),
                item.get("action", ""),
                item.get("rationale", "")[:50],
            ])
        elements.append(_data_table(
            ["Priority", "Section", "Action", "Rationale"],
            rows,
            col_widths=[1.5 * cm, 3 * cm, 5.5 * cm, 3.5 * cm],
        ))

    doc.build(elements, onLaterPages=lambda c, d: _footer(c, d, styles), onFirstPage=lambda c, d: _footer(c, d, styles))
    return buf.getvalue()
