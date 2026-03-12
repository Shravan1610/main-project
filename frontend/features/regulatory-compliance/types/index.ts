// --- Disclosure Gap Analyzer types ---

export type DisclosureFieldResult = {
  id: string;
  framework: string;
  section: string;
  field_name: string;
  description?: string;
  evidence?: string;
};

export type FrameworkResult = {
  framework: string;
  score: number;
  total_fields: number;
  present_count: number;
  weak_count: number;
  missing_count: number;
};

export type SectionCompleteness = {
  status: "complete" | "partial" | "incomplete";
  percentage: number;
  total: number;
  present: number;
  weak: number;
  missing: number;
};

export type DisclosureGapResponse = {
  compliance_score: number;
  total_fields: number;
  present_count: number;
  weak_count: number;
  missing_count: number;
  framework_results: FrameworkResult[];
  missing_fields: DisclosureFieldResult[];
  weak_fields: DisclosureFieldResult[];
  section_completeness: Record<string, SectionCompleteness>;
};

// --- Compliance Risk Engine types ---

export type RiskFlag = {
  id: string;
  severity: "high" | "medium" | "low";
  section: string;
  description: string;
  original_text?: string;
  recommendation: string;
};

export type ConsistencyIssue = {
  description: string;
  sections_involved?: string[];
  severity: "high" | "medium" | "low";
};

export type ActionItem = {
  priority: number;
  action: string;
  section: string;
  rationale: string;
};

export type ComplianceRiskResponse = {
  severity_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  frameworks_checked: string[];
  risk_flags: RiskFlag[];
  consistency_issues: ConsistencyIssue[];
  action_items: ActionItem[];
  total_risk_flags: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
};

export type InputMode = "document" | "url" | "webpage";
