"use client";

import { useEffect, useMemo, useState } from "react";

import { AnalysisLoadingOverlay } from "@/shared/components/analysis-loading-overlay";
import { DownloadReportButton } from "@/shared/components/download-report-button";

import { analyzeDocumentInput, fetchDocumentAnalysisHistory } from "../services";
import type { DocumentAnalyzerHistoryItem, DocumentAnalyzerResponse } from "../types";

type InputMode = "document" | "url" | "webpage";

const INPUT_MODES: Array<{ id: InputMode; label: string; icon: string; desc: string }> = [
  { id: "document", label: "Document", icon: "📄", desc: "Upload PDF / TXT file" },
  { id: "url", label: "Website URL", icon: "🌐", desc: "Scrape and analyze live page" },
  { id: "webpage", label: "Paste Content", icon: "📋", desc: "Paste text directly" },
];

const CLAIM_TYPE_STYLES: Record<string, string> = {
  commitment: "border-terminal-cyan/25 bg-terminal-cyan/8 text-terminal-cyan",
  certification: "border-terminal-green/25 bg-terminal-green/8 text-terminal-green",
  assertion: "border-terminal-amber/25 bg-terminal-amber/8 text-terminal-amber",
  metric: "border-terminal-cyan/25 bg-terminal-cyan/8 text-terminal-cyan",
};

const DOC_ANALYZER_PHASES = [
  "Reading document content…",
  "Running NLP entity extraction…",
  "Identifying ESG-related claims…",
  "Scoring environmental risk metrics…",
  "Evaluating greenwashing signals…",
  "Analyzing climate claim credibility…",
  "Building risk breakdown…",
  "Compiling AI analytics…",
];

function scoreColorClass(value: number, inverse = false) {
  if (inverse) {
    if (value < 0.3) return "text-terminal-green";
    if (value < 0.6) return "text-terminal-amber";
    return "text-terminal-red";
  }
  if (value > 0.7) return "text-terminal-green";
  if (value > 0.4) return "text-terminal-amber";
  return "text-terminal-red";
}

function barColor(value: number) {
  if (value < 30) return "bg-terminal-green";
  if (value < 60) return "bg-terminal-amber";
  return "bg-terminal-red";
}

function riskColor(score: number) {
  if (score < 30) return "text-terminal-green";
  if (score < 60) return "text-terminal-amber";
  return "text-terminal-red";
}

function getRouteLabel(mode: InputMode | string) {
  if (mode === "document" || mode === "nlp" || mode === "nlp+esg") return "NLP + ESG Dual Model";
  return "ESG Web Scoring Model";
}

export function DocumentAnalyzerPanel() {
  const [mode, setMode] = useState<InputMode>("document");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [webpage, setWebpage] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalyzerResponse | null>(null);
  const [history, setHistory] = useState<DocumentAnalyzerHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const entityEntries = useMemo(() => {
    if (!result?.extraction?.entities) return [];
    return Object.entries(result.extraction.entities).filter(([, v]) => v.length > 0);
  }, [result?.extraction?.entities]);

  const claims = result?.claims ?? [];

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const response = await fetchDocumentAnalysisHistory(8);
      setHistory(response.items);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function submit() {
    const trimmedUrl = url.trim();
    const trimmedWebpage = webpage.trim();

    if (mode === "document" && !file) {
      setError("Select a document before running the analyzer.");
      setResult(null);
      return;
    }
    if (mode === "url" && !trimmedUrl) {
      setError("Enter a website URL to scrape.");
      setResult(null);
      return;
    }
    if (mode === "webpage" && !trimmedWebpage) {
      setError("Paste webpage content to analyze.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await analyzeDocumentInput(mode, {
        file,
        url: trimmedUrl,
        webpage: trimmedWebpage,
      });
      setResult(response);
      await loadHistory();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Analyzer request failed";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wide text-terminal-text">
            ESG + NLP Document Analyzer
          </h2>
          <p className="mt-1 text-[11px] text-terminal-text-dim">
            Upload documents, scrape websites, or paste content for comprehensive ESG risk scoring, claim extraction, and greenwashing detection.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-terminal-cyan/25 bg-terminal-cyan/8 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-terminal-cyan">
          {getRouteLabel(mode)}
        </span>
      </div>

      {/* Input Card */}
      <div className="rounded-2xl border border-terminal-border bg-linear-to-b from-terminal-surface/80 to-terminal-bg/40 p-5">
        {/* Mode tabs */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {INPUT_MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`group rounded-xl border p-3 text-left transition-all ${
                mode === item.id
                  ? "border-terminal-cyan/35 bg-terminal-cyan/8 ring-1 ring-terminal-cyan/15"
                  : "border-terminal-border/60 hover:border-terminal-border hover:bg-terminal-surface/40"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <p className={`mt-1 text-[11px] font-semibold ${mode === item.id ? "text-terminal-cyan" : "text-terminal-text"}`}>
                {item.label}
              </p>
              <p className="text-[9px] text-terminal-text-muted">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Input field */}
        <div className="space-y-2">
          {mode === "document" && (
            <div className="rounded-xl border-2 border-dashed border-terminal-border/60 bg-terminal-bg/40 p-6 text-center transition-colors hover:border-terminal-cyan/25">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-terminal-text-dim file:mr-3 file:rounded-lg file:border file:border-terminal-border file:bg-terminal-surface file:px-4 file:py-2 file:text-[10px] file:font-medium file:text-terminal-text file:transition-colors file:hover:bg-terminal-cyan/10 file:hover:text-terminal-cyan"
                accept=".pdf,.txt,.html,.htm,.csv"
              />
              {file && (
                <p className="mt-2 text-[10px] text-terminal-cyan">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}
          {mode === "url" && (
            <div className="space-y-1.5">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com/sustainability-report"
                className="w-full rounded-xl border border-terminal-border bg-terminal-bg px-4 py-3 text-xs text-terminal-text placeholder:text-terminal-text-muted focus:border-terminal-cyan/40 focus:outline-none focus:ring-1 focus:ring-terminal-cyan/20"
              />
              <p className="pl-1 text-[10px] text-terminal-text-muted">Scrapes the live webpage and runs ESG scoring model.</p>
            </div>
          )}
          {mode === "webpage" && (
            <div className="space-y-1.5">
              <textarea
                value={webpage}
                onChange={(e) => setWebpage(e.target.value)}
                placeholder="Paste company ad text, press-release HTML, or webpage content to scan with the ESG model..."
                rows={7}
                className="w-full rounded-xl border border-terminal-border bg-terminal-bg px-4 py-3 text-xs text-terminal-text placeholder:text-terminal-text-muted focus:border-terminal-cyan/40 focus:outline-none focus:ring-1 focus:ring-terminal-cyan/20"
              />
              <p className="pl-1 text-[10px] text-terminal-text-muted">Uses the same ESG scoring logic as website URL analysis on pasted web content.</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-terminal-green/35 bg-terminal-green/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-terminal-green transition-all hover:bg-terminal-green/20 disabled:opacity-50"
          >
            {!loading && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            {loading ? "Processing…" : "Run Analysis"}
          </button>
          {error && (
            <div className="flex items-center gap-1.5 rounded-lg border border-terminal-red/20 bg-terminal-red/5 px-3 py-1.5">
              <svg className="h-3 w-3 shrink-0 text-terminal-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              <p className="text-[11px] text-terminal-red">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && <AnalysisLoadingOverlay label="Running Document Analysis" phases={DOC_ANALYZER_PHASES} />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* PDF Download + Overview */}
          <div className="flex items-center justify-between rounded-2xl border border-terminal-border bg-terminal-surface/60 p-4">
            <div className="grid gap-1 text-xs text-terminal-text sm:grid-cols-3">
              <p><span className="text-terminal-text-muted">Input:</span> {result.inputType}</p>
              <p><span className="text-terminal-text-muted">Engine:</span> {getRouteLabel(result.analysisEngine ?? result.inputType)}</p>
              <p><span className="text-terminal-text-muted">Content:</span> {result.contentLength?.toLocaleString()} chars</p>
            </div>
            <DownloadReportButton
              endpoint="document-analyzer"
              data={result as unknown as Record<string, unknown>}
              filename="document-analysis-report.pdf"
              label="Download Report"
            />
          </div>

          {/* Summary */}
          {result.extraction?.summary && (
            <div className="rounded-2xl border border-terminal-border bg-terminal-bg/50 p-4">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">Summary</p>
              <p className="text-xs leading-relaxed text-terminal-text wrap-break-word max-h-32 overflow-y-auto">{result.extraction.summary}</p>
            </div>
          )}

          {/* AI Analytics */}
          {result.aiAnalytics && (
            <>
              <div className="rounded-2xl border border-terminal-border bg-terminal-surface/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-terminal-text">AI Model Analytics</p>
                  <span className="rounded-full border border-terminal-cyan/25 bg-terminal-cyan/8 px-2.5 py-0.5 text-[9px] text-terminal-cyan">
                    {getRouteLabel(result.aiAnalytics.analysisEngine ?? result.analysisEngine ?? result.inputType)}
                  </span>
                </div>

                {/* Top metrics */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "ESG Risk Score", value: String(result.aiAnalytics.esgRiskScore ?? "N/A"), suffix: "/100", color: riskColor(result.aiAnalytics.esgRiskScore ?? 50) },
                    { label: "Risk Level", value: result.aiAnalytics.esgRiskLevel, color: result.aiAnalytics.esgRiskLevel === "Low Risk" ? "text-terminal-green" : result.aiAnalytics.esgRiskLevel === "Medium Risk" ? "text-terminal-amber" : "text-terminal-red" },
                    { label: "AI Confidence", value: `${(result.aiAnalytics.aiConfidence * 100).toFixed(1)}%`, color: "text-terminal-cyan" },
                    { label: "Verification", value: result.aiAnalytics.verificationStatus.toUpperCase(), color: result.aiAnalytics.verificationStatus === "verified" ? "text-terminal-green" : result.aiAnalytics.verificationStatus === "flagged" ? "text-terminal-red" : "text-terminal-text-dim" },
                  ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-terminal-border bg-terminal-bg/60 p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">{card.label}</p>
                      <p className={`mt-1 text-xl font-bold ${card.color}`}>
                        {card.value}
                        {"suffix" in card && card.suffix && <span className="text-xs font-normal text-terminal-text-muted">{card.suffix}</span>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Secondary metrics */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-terminal-border bg-terminal-bg/60 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Greenwashing Probability</p>
                    <p className={`mt-1 text-xl font-bold ${scoreColorClass(result.aiAnalytics.greenwashingProbability, true)}`}>
                      {(result.aiAnalytics.greenwashingProbability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-terminal-border bg-terminal-bg/60 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Climate Claim Credibility</p>
                    <p className={`mt-1 text-xl font-bold ${scoreColorClass(result.aiAnalytics.climateClaimCredibility)}`}>
                      {(result.aiAnalytics.climateClaimCredibility * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-terminal-border bg-terminal-bg/60 p-3 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-terminal-text-muted">Greenwashing Flag</p>
                    <p className={`mt-1 text-xl font-bold ${result.aiAnalytics.greenwashingProbability > 0.5 ? "text-terminal-red" : "text-terminal-green"}`}>
                      {result.aiAnalytics.greenwashingProbability > 0.5 ? "FLAGGED" : "CLEAR"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Breakdown */}
              {Object.keys(result.aiAnalytics.riskBreakdown).length > 0 && (
                <div className="rounded-2xl border border-terminal-border bg-terminal-bg/50 p-4">
                  <p className="mb-3 text-sm font-bold text-terminal-text">ESG Risk Breakdown</p>
                  <div className="space-y-3">
                    {Object.entries(result.aiAnalytics.riskBreakdown).map(([key, value]) => {
                      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                      return (
                        <div key={key}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11px] text-terminal-text-dim">{label}</span>
                            <span className={`text-xs font-semibold ${value < 30 ? "text-terminal-green" : value < 60 ? "text-terminal-amber" : "text-terminal-red"}`}>
                              {value.toFixed(1)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-terminal-border/60">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${barColor(value)}`}
                              style={{ width: `${Math.min(value, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suspicious Statements */}
              {result.aiAnalytics.suspiciousStatements.length > 0 && (
                <div className="rounded-2xl border border-terminal-red/20 bg-terminal-red/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-terminal-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    <p className="text-sm font-bold text-terminal-red">Suspicious ESG Statements</p>
                  </div>
                  <ul className="space-y-2">
                    {result.aiAnalytics.suspiciousStatements.map((statement, i) => (
                      <li key={i} className="rounded-lg border border-terminal-red/15 bg-terminal-bg/40 px-3 py-2 text-xs text-terminal-text-dim italic wrap-break-word" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        &ldquo;{statement}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {result && !result.aiAnalytics && result.modelStatus !== "empty_input" && (
            <div className="rounded-2xl border border-terminal-amber/20 bg-terminal-amber/5 p-4 text-xs text-terminal-amber">
              AI analysis unavailable. The model may be temporarily offline — please retry.
            </div>
          )}

          {/* Entities */}
          {entityEntries.length > 0 && (
            <div className="rounded-2xl border border-terminal-border bg-terminal-bg/50 p-4">
              <p className="mb-3 text-sm font-bold text-terminal-text">Extracted Entities</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {entityEntries.map(([key, values]) => (
                  <div key={key} className="rounded-lg border border-terminal-border/60 bg-terminal-surface/30 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-terminal-text-muted">{key}</p>
                    <p className="mt-1 text-[11px] text-terminal-text">{values.join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claims */}
          {claims.length > 0 && (
            <div className="rounded-2xl border border-terminal-border bg-terminal-bg/50 p-4">
              <p className="mb-3 text-sm font-bold text-terminal-text">
                ESG Claims Detected <span className="ml-1 text-xs font-normal text-terminal-text-muted">({claims.length})</span>
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {claims.map((claim) => {
                  const style = CLAIM_TYPE_STYLES[claim.type] ?? "border-terminal-border bg-terminal-surface text-terminal-text";
                  const confidence = Math.max(0, Math.min(1, claim.confidence ?? 0));
                  return (
                    <div key={`${claim.category}-${claim.type}-${claim.text}`} className="rounded-xl border border-terminal-border/60 bg-terminal-surface/30 p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-terminal-border px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-terminal-text-muted">
                          {claim.category}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-wider ${style}`}>
                          {claim.type}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-terminal-text wrap-break-word" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{claim.text}</p>
                      <div className="mt-2.5">
                        <div className="mb-1 flex items-center justify-between text-[9px] text-terminal-text-muted">
                          <span>Confidence</span>
                          <span className="font-semibold">{Math.round(confidence * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-terminal-border/60">
                          <div className="h-full rounded-full bg-terminal-cyan/75 transition-all duration-500" style={{ width: `${Math.round(confidence * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl border border-terminal-border bg-terminal-bg/50">
        <button
          type="button"
          onClick={() => setShowHistory((p) => !p)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-terminal-text">Recent Runs</p>
            <span className="rounded-full bg-terminal-surface px-2 py-0.5 text-[9px] text-terminal-text-muted">
              {historyLoading ? "…" : history.length}
            </span>
          </div>
          <svg className={`h-4 w-4 text-terminal-text-muted transition-transform ${showHistory ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>

        {showHistory && (
          <div className="border-t border-terminal-border px-4 pb-4 pt-2">
            {history.length === 0 ? (
              <p className="py-4 text-center text-xs text-terminal-text-muted">
                No stored runs. Configure Supabase to persist analysis history.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border border-terminal-border/60 bg-terminal-surface/30 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-terminal-text">{getRouteLabel(item.analysis_engine)}</p>
                      <p className="text-[10px] text-terminal-text-muted">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="mt-1 grid gap-1 text-[10px] text-terminal-text-dim sm:grid-cols-2">
                      <span>Input: {item.input_type}</span>
                      <span>ESG Risk: {item.ai_analytics?.esgRiskScore ?? "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
