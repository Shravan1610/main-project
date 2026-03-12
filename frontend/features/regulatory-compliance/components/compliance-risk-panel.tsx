"use client";

import { useState } from "react";

import { AnalysisLoadingOverlay } from "@/shared/components/analysis-loading-overlay";
import { DownloadReportButton } from "@/shared/components/download-report-button";

import { analyzeComplianceRisk } from "../services";
import type {
  ActionItem,
  ComplianceRiskResponse,
  ConsistencyIssue,
  InputMode,
  RiskFlag,
} from "../types";

const INPUT_MODES: Array<{ id: InputMode; label: string; icon: string }> = [
  { id: "document", label: "Document", icon: "📄" },
  { id: "url", label: "Website URL", icon: "🌐" },
  { id: "webpage", label: "Paste Content", icon: "📋" },
];

const FRAMEWORKS = ["GRI", "TCFD", "CSRD"] as const;

const RISK_PHASES = [
  "Extracting content from input…",
  "Parsing disclosure structure…",
  "Scanning for vague or risky language…",
  "Detecting cross-section inconsistencies…",
  "Evaluating greenwashing red flags…",
  "Checking evidence and baselines…",
  "Scoring severity levels…",
  "Generating prioritized recommendations…",
];

function severityBadge(severity: string) {
  switch (severity) {
    case "high":
      return "border-terminal-red/30 bg-terminal-red/8 text-terminal-red";
    case "medium":
      return "border-terminal-amber/30 bg-terminal-amber/8 text-terminal-amber";
    default:
      return "border-terminal-cyan/30 bg-terminal-cyan/8 text-terminal-cyan";
  }
}

function severityIcon(severity: string) {
  switch (severity) {
    case "high":
      return "▲";
    case "medium":
      return "●";
    default:
      return "○";
  }
}

function riskLevelColor(level: string) {
  switch (level) {
    case "critical":
    case "high":
      return "text-terminal-red";
    case "medium":
      return "text-terminal-amber";
    default:
      return "text-terminal-green";
  }
}

function riskLevelBg(level: string) {
  switch (level) {
    case "critical":
    case "high":
      return "border-terminal-red/30 bg-terminal-red/8";
    case "medium":
      return "border-terminal-amber/30 bg-terminal-amber/8";
    default:
      return "border-terminal-green/30 bg-terminal-green/8";
  }
}

function priorityBadge(p: number) {
  if (p <= 1) return "border-terminal-red/30 bg-terminal-red/8 text-terminal-red";
  if (p <= 2) return "border-terminal-amber/30 bg-terminal-amber/8 text-terminal-amber";
  return "border-terminal-cyan/30 bg-terminal-cyan/8 text-terminal-cyan";
}

export function ComplianceRiskPanel() {
  const [mode, setMode] = useState<InputMode>("webpage");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [webpage, setWebpage] = useState("");
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["GRI", "TCFD"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComplianceRiskResponse | null>(null);

  function toggleFramework(fw: string) {
    setSelectedFrameworks((prev) =>
      prev.includes(fw) ? prev.filter((f) => f !== fw) : [...prev, fw],
    );
  }

  async function submit() {
    if (mode === "document" && !file) {
      setError("Select a document before analyzing.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Enter a URL to analyze.");
      return;
    }
    if (mode === "webpage" && !webpage.trim()) {
      setError("Paste report content to analyze.");
      return;
    }
    if (selectedFrameworks.length === 0) {
      setError("Select at least one framework.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await analyzeComplianceRisk(
        mode,
        { file, url: url.trim(), webpage: webpage.trim() },
        selectedFrameworks,
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wide text-terminal-text">
            Compliance Risk &amp; Recommendation Engine
          </h2>
          <p className="mt-1 text-[11px] text-terminal-text-dim">
            Evaluate disclosure quality, detect vague or risky language, check consistency, and get prioritized recommendations.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-terminal-red/25 bg-terminal-red/8 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-terminal-red">
          Risk Engine
        </span>
      </div>

      {/* Input section */}
      <div className="rounded-2xl border border-terminal-border bg-linear-to-b from-terminal-surface/80 to-terminal-bg/40 p-5 space-y-4">
        {/* Mode selector */}
        <div className="flex items-center gap-2">
          {INPUT_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[10px] font-medium uppercase tracking-wider transition-all ${
                mode === m.id
                  ? "border-terminal-cyan/35 bg-terminal-cyan/10 text-terminal-cyan ring-1 ring-terminal-cyan/15"
                  : "border-terminal-border bg-terminal-bg/40 text-terminal-text-dim hover:text-terminal-text hover:border-terminal-border"
              }`}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Input field */}
        {mode === "document" && (
          <div className="rounded-xl border-2 border-dashed border-terminal-border/60 bg-terminal-bg/40 p-5 text-center transition-colors hover:border-terminal-cyan/25">
            <input
              type="file"
              accept=".pdf,.txt,.html,.htm,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-terminal-text-dim file:mr-3 file:rounded-lg file:border file:border-terminal-border file:bg-terminal-surface file:px-4 file:py-2 file:text-[10px] file:font-medium file:text-terminal-text"
            />
            {file && <p className="mt-2 text-[10px] text-terminal-cyan">Selected: {file.name}</p>}
          </div>
        )}
        {mode === "url" && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://company.com/sustainability-report"
            className="w-full rounded-xl border border-terminal-border bg-terminal-bg px-4 py-3 text-xs text-terminal-text placeholder:text-terminal-text-muted focus:border-terminal-cyan/40 focus:outline-none focus:ring-1 focus:ring-terminal-cyan/20"
          />
        )}
        {mode === "webpage" && (
          <textarea
            value={webpage}
            onChange={(e) => setWebpage(e.target.value)}
            rows={6}
            placeholder="Paste sustainability report, ESG disclosure, or annual report text…"
            className="w-full rounded-xl border border-terminal-border bg-terminal-bg px-4 py-3 text-xs text-terminal-text placeholder:text-terminal-text-muted focus:border-terminal-cyan/40 focus:outline-none focus:ring-1 focus:ring-terminal-cyan/20"
          />
        )}

        {/* Framework selector */}
        <div>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
            Frameworks to check
          </p>
          <div className="flex items-center gap-3">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw}
                type="button"
                onClick={() => toggleFramework(fw)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[11px] transition-all ${
                  selectedFrameworks.includes(fw)
                    ? "border-terminal-cyan/35 bg-terminal-cyan/8 text-terminal-cyan"
                    : "border-terminal-border text-terminal-text-dim hover:border-terminal-border"
                }`}
              >
                <div className={`flex h-3.5 w-3.5 items-center justify-center rounded border text-[8px] ${
                  selectedFrameworks.includes(fw)
                    ? "border-terminal-cyan bg-terminal-cyan text-terminal-bg font-bold"
                    : "border-terminal-border"
                }`}>
                  {selectedFrameworks.includes(fw) && "✓"}
                </div>
                {fw}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-terminal-green/35 bg-terminal-green/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-terminal-green transition-all hover:bg-terminal-green/20 disabled:opacity-50"
          >
            {!loading && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            {loading ? "Analyzing…" : "Analyze Compliance Risk"}
          </button>
          {error && (
            <div className="flex items-center gap-1.5 rounded-lg border border-terminal-red/20 bg-terminal-red/5 px-3 py-1.5">
              <svg className="h-3 w-3 shrink-0 text-terminal-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              <p className="text-[11px] text-terminal-red">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && <AnalysisLoadingOverlay label="Scanning Compliance Risk" phases={RISK_PHASES} />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Score header + PDF */}
          <div className="rounded-2xl border border-terminal-border bg-terminal-surface/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Severity gauge */}
                <div className="text-center">
                  <div className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl border-2 ${riskLevelBg(result.risk_level)}`}>
                    <div>
                      <p className={`text-2xl font-bold ${riskLevelColor(result.risk_level)}`}>{result.severity_score}</p>
                      <p className={`text-[8px] font-semibold uppercase ${riskLevelColor(result.risk_level)}`}>{result.risk_level}</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[8px] uppercase tracking-wider text-terminal-text-muted">Severity</p>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-3 gap-5 text-center">
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-terminal-red/20 bg-terminal-red/8">
                      <p className="text-lg font-bold text-terminal-red">{result.high_severity_count}</p>
                    </div>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-terminal-text-muted">High</p>
                  </div>
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-terminal-amber/20 bg-terminal-amber/8">
                      <p className="text-lg font-bold text-terminal-amber">{result.medium_severity_count}</p>
                    </div>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-terminal-text-muted">Medium</p>
                  </div>
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-terminal-cyan/20 bg-terminal-cyan/8">
                      <p className="text-lg font-bold text-terminal-cyan">{result.low_severity_count}</p>
                    </div>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-terminal-text-muted">Low</p>
                  </div>
                </div>
              </div>

              <DownloadReportButton
                endpoint="compliance-risk"
                data={result as unknown as Record<string, unknown>}
                filename="compliance-risk-report.pdf"
                label="Download Report"
              />
            </div>
          </div>

          {/* Risk flags */}
          {result.risk_flags.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Risk Flags ({result.total_risk_flags})
              </p>
              <div className="space-y-3">
                {result.risk_flags.map((flag: RiskFlag) => (
                  <div
                    key={flag.id}
                    className="rounded-2xl border border-terminal-border bg-terminal-surface/60 p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase ${severityBadge(flag.severity)}`}>
                            {severityIcon(flag.severity)} {flag.severity}
                          </span>
                          <span className="rounded-full bg-terminal-surface px-2 py-0.5 text-[10px] text-terminal-text-muted">{flag.section}</span>
                        </div>
                        <p className="text-[11px] text-terminal-text leading-relaxed">{flag.description}</p>
                      </div>
                    </div>
                    {flag.original_text && (
                      <div className="rounded-lg border border-terminal-border/50 bg-terminal-bg/60 px-3 py-2">
                        <p className="text-[9px] uppercase text-terminal-text-muted mb-0.5">Original Text</p>
                        <p className="text-[10px] italic text-terminal-text-dim leading-relaxed">&ldquo;{flag.original_text}&rdquo;</p>
                      </div>
                    )}
                    <div className="rounded-lg border border-terminal-green/20 bg-terminal-green/5 px-3 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-terminal-green mb-0.5">Recommendation</p>
                      <p className="text-[11px] text-terminal-text-dim leading-relaxed">{flag.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consistency issues */}
          {result.consistency_issues.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Consistency Issues ({result.consistency_issues.length})
              </p>
              <div className="space-y-2">
                {result.consistency_issues.map((issue: ConsistencyIssue, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl border border-terminal-amber/20 bg-terminal-amber/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase ${severityBadge(issue.severity)}`}>
                        {severityIcon(issue.severity)} {issue.severity}
                      </span>
                      {issue.sections_involved && (
                        <span className="rounded-full bg-terminal-surface/60 px-2 py-0.5 text-[10px] text-terminal-text-muted">
                          {issue.sections_involved.join(" ↔ ")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-terminal-text leading-relaxed">{issue.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action items */}
          {result.action_items.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Prioritized Action Items ({result.action_items.length})
              </p>
              <div className="space-y-2">
                {result.action_items.map((item: ActionItem, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-terminal-border bg-terminal-bg/50 px-4 py-3"
                  >
                    <span
                      className={`mt-0.5 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-bold ${priorityBadge(item.priority)}`}
                    >
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-terminal-text">{item.action}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-terminal-text-dim">
                        <span className="rounded-full bg-terminal-surface/60 px-2 py-0.5">{item.section}</span>
                        <span className="italic text-terminal-text-muted">{item.rationale}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
