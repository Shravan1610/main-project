"use client";

import { useState } from "react";

import { AnalysisLoadingOverlay } from "@/shared/components/analysis-loading-overlay";
import { DownloadReportButton } from "@/shared/components/download-report-button";

import { analyzeDisclosureGaps } from "../services";
import type {
  DisclosureGapResponse,
  FrameworkResult,
  InputMode,
} from "../types";

const INPUT_MODES: Array<{ id: InputMode; label: string; icon: string }> = [
  { id: "document", label: "Document", icon: "📄" },
  { id: "url", label: "Website URL", icon: "🌐" },
  { id: "webpage", label: "Paste Content", icon: "📋" },
];

const FRAMEWORKS = ["GRI", "TCFD", "CSRD"] as const;

const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  GRI: "Global Reporting Initiative — org details, energy, emissions, employment, diversity",
  TCFD: "Task Force on Climate-Related Financial Disclosures — governance, strategy, risk, metrics",
  CSRD: "Corporate Sustainability Reporting Directive — climate, pollution, water, biodiversity, workforce",
};

const DISCLOSURE_PHASES = [
  "Extracting content from input…",
  "Mapping disclosure fields to frameworks…",
  "Checking GRI compliance indicators…",
  "Evaluating TCFD alignment…",
  "Scanning CSRD requirements…",
  "Classifying field completeness…",
  "Computing compliance scores…",
  "Generating gap analysis…",
];

function scoreColor(value: number): string {
  if (value >= 70) return "text-terminal-green";
  if (value >= 40) return "text-terminal-amber";
  return "text-terminal-red";
}

function scoreBg(value: number): string {
  if (value >= 70) return "bg-terminal-green";
  if (value >= 40) return "bg-terminal-amber";
  return "bg-terminal-red";
}

function statusBadge(status: string) {
  switch (status) {
    case "complete":
      return "border-terminal-green/30 bg-terminal-green/8 text-terminal-green";
    case "partial":
      return "border-terminal-amber/30 bg-terminal-amber/8 text-terminal-amber";
    default:
      return "border-terminal-red/30 bg-terminal-red/8 text-terminal-red";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "complete":
      return "✓";
    case "partial":
      return "◐";
    default:
      return "✗";
  }
}

export function DisclosureGapPanel() {
  const [mode, setMode] = useState<InputMode>("webpage");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [webpage, setWebpage] = useState("");
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["GRI", "TCFD"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DisclosureGapResponse | null>(null);

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
      const res = await analyzeDisclosureGaps(
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
            Disclosure Gap Analyzer
          </h2>
          <p className="mt-1 text-[11px] text-terminal-text-dim">
            Check whether a sustainability report contains all required disclosure fields against GRI, TCFD, and CSRD frameworks.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-terminal-amber/25 bg-terminal-amber/8 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-terminal-amber">
          Framework Compliance
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
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
            Frameworks to check
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw}
                type="button"
                onClick={() => toggleFramework(fw)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedFrameworks.includes(fw)
                    ? "border-terminal-cyan/35 bg-terminal-cyan/8 ring-1 ring-terminal-cyan/15"
                    : "border-terminal-border/60 hover:border-terminal-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] ${
                    selectedFrameworks.includes(fw)
                      ? "border-terminal-cyan bg-terminal-cyan text-terminal-bg font-bold"
                      : "border-terminal-border"
                  }`}>
                    {selectedFrameworks.includes(fw) && "✓"}
                  </div>
                  <span className={`text-xs font-semibold ${selectedFrameworks.includes(fw) ? "text-terminal-cyan" : "text-terminal-text"}`}>
                    {fw}
                  </span>
                </div>
                <p className="mt-1 text-[9px] text-terminal-text-muted leading-relaxed">
                  {FRAMEWORK_DESCRIPTIONS[fw]}
                </p>
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
            {loading ? "Analyzing…" : "Analyze Disclosures"}
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
      {loading && <AnalysisLoadingOverlay label="Analyzing Disclosure Gaps" phases={DISCLOSURE_PHASES} />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Score header + PDF */}
          <div className="rounded-2xl border border-terminal-border bg-terminal-surface/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Big score circle */}
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-terminal-border/30" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                      strokeDasharray={`${result.compliance_score * 2.64} 264`}
                      strokeLinecap="round"
                      className={`${result.compliance_score >= 70 ? "text-terminal-green" : result.compliance_score >= 40 ? "text-terminal-amber" : "text-terminal-red"} transition-all duration-1000`}
                      stroke="currentColor"
                    />
                  </svg>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${scoreColor(result.compliance_score)}`}>{result.compliance_score}%</p>
                    <p className="text-[8px] uppercase text-terminal-text-muted">Score</p>
                  </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-terminal-green">{result.present_count}</p>
                    <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-terminal-amber">{result.weak_count}</p>
                    <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Weak</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-terminal-red">{result.missing_count}</p>
                    <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Missing</p>
                  </div>
                </div>
              </div>

              <DownloadReportButton
                endpoint="disclosure-gaps"
                data={result as unknown as Record<string, unknown>}
                filename="disclosure-gap-report.pdf"
                label="Download Report"
              />
            </div>
          </div>

          {/* Framework breakdown */}
          {result.framework_results.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Framework Breakdown
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {result.framework_results.map((fw: FrameworkResult) => (
                  <div
                    key={fw.framework}
                    className="rounded-2xl border border-terminal-border bg-terminal-surface/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-terminal-text">{fw.framework}</p>
                      <p className={`text-lg font-bold ${scoreColor(fw.score)}`}>{fw.score}%</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-terminal-bg">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${scoreBg(fw.score)}`}
                        style={{ width: `${Math.min(100, fw.score)}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-terminal-green/8 py-1.5">
                        <p className="text-sm font-semibold text-terminal-green">{fw.present_count}</p>
                        <p className="text-[8px] uppercase text-terminal-text-muted">Present</p>
                      </div>
                      <div className="rounded-lg bg-terminal-amber/8 py-1.5">
                        <p className="text-sm font-semibold text-terminal-amber">{fw.weak_count}</p>
                        <p className="text-[8px] uppercase text-terminal-text-muted">Weak</p>
                      </div>
                      <div className="rounded-lg bg-terminal-red/8 py-1.5">
                        <p className="text-sm font-semibold text-terminal-red">{fw.missing_count}</p>
                        <p className="text-[8px] uppercase text-terminal-text-muted">Missing</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section completeness */}
          {Object.keys(result.section_completeness).length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Section Completeness
              </p>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(result.section_completeness).map(([section, data]) => (
                  <div
                    key={section}
                    className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-terminal-text">{section}</p>
                      <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase ${statusBadge(data.status)}`}>
                        {statusIcon(data.status)} {data.percentage}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-terminal-border/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreBg(data.percentage)}`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing fields */}
          {result.missing_fields.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Missing Disclosures ({result.missing_fields.length})
              </p>
              <div className="rounded-2xl border border-terminal-border overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-terminal-border bg-terminal-surface/80">
                      <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-terminal-text-muted">Framework</th>
                      <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-terminal-text-muted">Section</th>
                      <th className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-terminal-text-muted">Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.missing_fields.map((f) => (
                      <tr key={f.id} className="border-b border-terminal-border/30 last:border-0 hover:bg-terminal-surface/30 transition-colors">
                        <td className="px-4 py-2 text-terminal-cyan font-medium">{f.framework}</td>
                        <td className="px-4 py-2 text-terminal-text-dim">{f.section}</td>
                        <td className="px-4 py-2 text-terminal-text">{f.field_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weak fields */}
          {result.weak_fields.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Weak Disclosures ({result.weak_fields.length})
              </p>
              <div className="space-y-2">
                {result.weak_fields.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-terminal-amber/20 bg-terminal-amber/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-terminal-amber/30 bg-terminal-amber/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-terminal-amber">{f.framework}</span>
                      <span className="text-[9px] text-terminal-text-muted">·</span>
                      <span className="text-[10px] text-terminal-text-dim">{f.section}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium text-terminal-text">{f.field_name}</p>
                    {f.evidence && (
                      <p className="mt-1 text-[10px] italic text-terminal-text-dim leading-relaxed">&ldquo;{f.evidence}&rdquo;</p>
                    )}
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
