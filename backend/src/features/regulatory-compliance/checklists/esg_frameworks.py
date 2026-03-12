"""ESG disclosure framework checklists for GRI, TCFD, and CSRD."""

from __future__ import annotations

from typing import TypedDict


class DisclosureField(TypedDict):
    id: str
    framework: str
    section: str
    field_name: str
    description: str
    required: bool


GRI_FIELDS: list[DisclosureField] = [
    {"id": "gri-2-1", "framework": "GRI", "section": "General Disclosures", "field_name": "Organizational details", "description": "Legal name, ownership, headquarters location, countries of operation", "required": True},
    {"id": "gri-2-2", "framework": "GRI", "section": "General Disclosures", "field_name": "Entities included in reporting", "description": "List of entities included in sustainability reporting vs financial reporting", "required": True},
    {"id": "gri-2-3", "framework": "GRI", "section": "General Disclosures", "field_name": "Reporting period and frequency", "description": "Reporting period, frequency, and contact point", "required": True},
    {"id": "gri-2-7", "framework": "GRI", "section": "General Disclosures", "field_name": "Employees", "description": "Total number of employees by gender, region, and contract type", "required": True},
    {"id": "gri-2-22", "framework": "GRI", "section": "General Disclosures", "field_name": "Sustainable development strategy", "description": "Statement on sustainable development strategy and how it relates to impacts", "required": True},
    {"id": "gri-2-27", "framework": "GRI", "section": "General Disclosures", "field_name": "Compliance with laws and regulations", "description": "Instances of non-compliance with laws and regulations, fines, penalties", "required": True},
    {"id": "gri-2-29", "framework": "GRI", "section": "General Disclosures", "field_name": "Stakeholder engagement", "description": "Approach to stakeholder engagement, categories of stakeholders", "required": True},
    {"id": "gri-3-1", "framework": "GRI", "section": "Material Topics", "field_name": "Process to determine material topics", "description": "Description of how material topics were identified and prioritized", "required": True},
    {"id": "gri-3-2", "framework": "GRI", "section": "Material Topics", "field_name": "List of material topics", "description": "Complete list of material topics with changes from previous period", "required": True},
    {"id": "gri-302-1", "framework": "GRI", "section": "Energy", "field_name": "Energy consumption within the organization", "description": "Total fuel, electricity, heating, cooling, steam consumption in joules or multiples", "required": True},
    {"id": "gri-302-3", "framework": "GRI", "section": "Energy", "field_name": "Energy intensity", "description": "Energy intensity ratio, units, types of energy included", "required": True},
    {"id": "gri-303-3", "framework": "GRI", "section": "Water", "field_name": "Water withdrawal", "description": "Total water withdrawal by source, breakdown by freshwater and other water", "required": False},
    {"id": "gri-305-1", "framework": "GRI", "section": "Emissions", "field_name": "Direct GHG emissions (Scope 1)", "description": "Gross direct GHG emissions in metric tons CO2 equivalent", "required": True},
    {"id": "gri-305-2", "framework": "GRI", "section": "Emissions", "field_name": "Energy indirect GHG emissions (Scope 2)", "description": "Gross location-based and market-based energy indirect GHG emissions", "required": True},
    {"id": "gri-305-3", "framework": "GRI", "section": "Emissions", "field_name": "Other indirect GHG emissions (Scope 3)", "description": "Gross other indirect GHG emissions, categories included, biogenic emissions", "required": True},
    {"id": "gri-305-4", "framework": "GRI", "section": "Emissions", "field_name": "GHG emissions intensity", "description": "GHG emissions intensity ratio, organization-specific metric", "required": True},
    {"id": "gri-305-5", "framework": "GRI", "section": "Emissions", "field_name": "Reduction of GHG emissions", "description": "GHG emissions reduced as a direct result of reduction initiatives", "required": True},
    {"id": "gri-305-7", "framework": "GRI", "section": "Emissions", "field_name": "Emissions methodology", "description": "Standards, methodologies, emission factors, and GWP values used", "required": True},
    {"id": "gri-306-3", "framework": "GRI", "section": "Waste", "field_name": "Waste generated", "description": "Total weight of waste generated and composition breakdown", "required": False},
    {"id": "gri-401-1", "framework": "GRI", "section": "Employment", "field_name": "New employee hires and turnover", "description": "Total and rate of new hires and employee turnover by age, gender, region", "required": False},
    {"id": "gri-405-1", "framework": "GRI", "section": "Diversity", "field_name": "Diversity of governance bodies", "description": "Percentage of individuals in governance bodies by gender, age group, minority", "required": False},
]

TCFD_FIELDS: list[DisclosureField] = [
    {"id": "tcfd-gov-a", "framework": "TCFD", "section": "Governance", "field_name": "Board oversight of climate risks", "description": "Board oversight of climate-related risks and opportunities", "required": True},
    {"id": "tcfd-gov-b", "framework": "TCFD", "section": "Governance", "field_name": "Management role in climate risks", "description": "Management's role in assessing and managing climate-related risks", "required": True},
    {"id": "tcfd-strat-a", "framework": "TCFD", "section": "Strategy", "field_name": "Climate risks and opportunities identified", "description": "Climate-related risks and opportunities identified over short, medium, long term", "required": True},
    {"id": "tcfd-strat-b", "framework": "TCFD", "section": "Strategy", "field_name": "Impact on business and strategy", "description": "Impact of climate risks on business, strategy, and financial planning", "required": True},
    {"id": "tcfd-strat-c", "framework": "TCFD", "section": "Strategy", "field_name": "Scenario analysis", "description": "Resilience of strategy under different climate scenarios including 2°C or lower", "required": True},
    {"id": "tcfd-risk-a", "framework": "TCFD", "section": "Risk Management", "field_name": "Risk identification and assessment process", "description": "Processes for identifying and assessing climate-related risks", "required": True},
    {"id": "tcfd-risk-b", "framework": "TCFD", "section": "Risk Management", "field_name": "Risk management process", "description": "Processes for managing climate-related risks", "required": True},
    {"id": "tcfd-risk-c", "framework": "TCFD", "section": "Risk Management", "field_name": "Integration with overall risk management", "description": "How climate risk processes are integrated into overall risk management", "required": True},
    {"id": "tcfd-met-a", "framework": "TCFD", "section": "Metrics & Targets", "field_name": "Climate-related metrics", "description": "Metrics used to assess climate risks and opportunities in line with strategy", "required": True},
    {"id": "tcfd-met-b", "framework": "TCFD", "section": "Metrics & Targets", "field_name": "Scope 1, 2, and 3 GHG emissions", "description": "Scope 1, 2, and if appropriate Scope 3 GHG emissions and related risks", "required": True},
    {"id": "tcfd-met-c", "framework": "TCFD", "section": "Metrics & Targets", "field_name": "Climate targets and performance", "description": "Targets used to manage climate risks/opportunities and performance against targets", "required": True},
    {"id": "tcfd-met-d", "framework": "TCFD", "section": "Metrics & Targets", "field_name": "Transition plan", "description": "Transition plan including target year, baseline, milestones, and verification", "required": True},
]

CSRD_FIELDS: list[DisclosureField] = [
    {"id": "csrd-e1-1", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Transition plan for climate change mitigation", "description": "Transition plan aligned with limiting global warming to 1.5°C", "required": True},
    {"id": "csrd-e1-2", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Policies related to climate change", "description": "Policies adopted to manage material climate change impacts, risks, and opportunities", "required": True},
    {"id": "csrd-e1-3", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Actions and resources for climate", "description": "Actions and resources related to climate change mitigation and adaptation", "required": True},
    {"id": "csrd-e1-4", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "GHG emission reduction targets", "description": "Targets related to climate change mitigation and adaptation", "required": True},
    {"id": "csrd-e1-5", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Energy consumption and mix", "description": "Energy consumption and mix, including renewable vs non-renewable breakdown", "required": True},
    {"id": "csrd-e1-6", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Gross Scope 1, 2, 3 GHG emissions", "description": "Gross Scope 1, 2, and 3 greenhouse gas emissions with methodology", "required": True},
    {"id": "csrd-e1-7", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "GHG removals and carbon credits", "description": "GHG removals and storage and any carbon credits used", "required": True},
    {"id": "csrd-e1-8", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Internal carbon pricing", "description": "Internal carbon pricing schemes and their scope", "required": False},
    {"id": "csrd-e1-9", "framework": "CSRD", "section": "Climate Change (E1)", "field_name": "Financial effects of climate change", "description": "Anticipated financial effects of material physical and transition risks", "required": True},
    {"id": "csrd-e2-1", "framework": "CSRD", "section": "Pollution (E2)", "field_name": "Pollution policies", "description": "Policies related to pollution prevention and control", "required": True},
    {"id": "csrd-e2-4", "framework": "CSRD", "section": "Pollution (E2)", "field_name": "Pollutant emissions", "description": "Emissions of pollutants to air, water, and soil", "required": True},
    {"id": "csrd-e3-1", "framework": "CSRD", "section": "Water & Marine (E3)", "field_name": "Water and marine resources policies", "description": "Policies related to water and marine resources", "required": False},
    {"id": "csrd-e4-1", "framework": "CSRD", "section": "Biodiversity (E4)", "field_name": "Biodiversity and ecosystems policies", "description": "Transition plan and policies relating to biodiversity and ecosystems", "required": False},
    {"id": "csrd-e5-1", "framework": "CSRD", "section": "Circular Economy (E5)", "field_name": "Resource use and circular economy policies", "description": "Policies related to resource use and circular economy", "required": False},
    {"id": "csrd-s1-1", "framework": "CSRD", "section": "Own Workforce (S1)", "field_name": "Workforce policies", "description": "Policies related to own workforce including working conditions", "required": True},
    {"id": "csrd-s1-6", "framework": "CSRD", "section": "Own Workforce (S1)", "field_name": "Workforce characteristics", "description": "Characteristics of employees including gender breakdown, contract types", "required": True},
    {"id": "csrd-g1-1", "framework": "CSRD", "section": "Business Conduct (G1)", "field_name": "Business conduct policies", "description": "Policies related to business conduct including anti-corruption and anti-bribery", "required": True},
    {"id": "csrd-g1-4", "framework": "CSRD", "section": "Business Conduct (G1)", "field_name": "Anti-corruption incidents", "description": "Confirmed incidents of corruption or bribery", "required": True},
    {"id": "csrd-drma-1", "framework": "CSRD", "section": "Double Materiality", "field_name": "Double materiality assessment", "description": "Process and outcome of the double materiality assessment", "required": True},
    {"id": "csrd-drma-2", "framework": "CSRD", "section": "Double Materiality", "field_name": "Stakeholder engagement in materiality", "description": "How stakeholders were engaged in the materiality assessment process", "required": True},
]

FRAMEWORK_MAP: dict[str, list[DisclosureField]] = {
    "GRI": GRI_FIELDS,
    "TCFD": TCFD_FIELDS,
    "CSRD": CSRD_FIELDS,
}

ALL_FRAMEWORKS = list(FRAMEWORK_MAP.keys())

def get_checklist(frameworks: list[str] | None = None) -> list[DisclosureField]:
    """Return combined checklist for the requested frameworks."""
    selected = frameworks or ALL_FRAMEWORKS
    fields: list[DisclosureField] = []
    for fw in selected:
        fields.extend(FRAMEWORK_MAP.get(fw.upper(), []))
    return fields
