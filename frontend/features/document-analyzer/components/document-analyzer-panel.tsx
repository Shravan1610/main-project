"use client";

import { useEffect, useMemo, useState } from "react";

import { analyzeDocumentInput, fetchDocumentAnalysisHistory } from "../services";
import type { DocumentAnalyzerHistoryItem, DocumentAnalyzerResponse } from "../types";

type InputMode = "document" | "url" | "webpage";

const INPUT_MODES: Array<{ id: InputMode; label: string }> = [
  { id: "document", label: "Document" },
  { id: "url", label: "Website URL" },
  { id: "webpage", label: "Webpage Content" },
];

const CLAIM_TYPE_STYLES: Record<string, string> = {
  commitment: "border-terminal-cyan/25 bg-terminal-cyan/8 text-terminal-cyan",
  certification: "border-terminal-green/25 bg-terminal-green/8 text-terminal-green",
  assertion: "border-terminal-amber/25 bg-terminal-amber/8 text-terminal-amber",
  metric: "border-terminal-cyan/25 bg-terminal-cyan/8 text-terminal-cyan",
};

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

function getRouteLabel(mode: InputMode | string) {
  if (mode === "document" || mode === "nlp" || mode === "nlp+esg") return "NLP extractor + ESG scoring";
  return "ESG web analysis model";
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

  const entityEntries = useMemo(() => {
    if (!result?.extraction?.entities) return [];
    return Object.entries(result.extraction.entities);
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-terminal-text">ESG + NLP Document Analyzer</h3>
        <p className="text-xs text-terminal-text-muted">{getRouteLabel(mode)}</p>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {INPUT_MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                mode === item.id
                  ? "border-terminal-cyan/35 bg-terminal-cyan/8 text-terminal-cyan"
                  : "border-terminal-border text-terminal-text-dim hover:bg-terminal-border/35"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === "document" ? (
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
          />
        ) : null}

        {mode === "url" ? (
          <div className="space-y-1">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://company.com/sustainability"
              className="w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            />
            <p className="text-[11px] text-terminal-text-muted">Scrapes the live webpage and runs ESG scoring.</p>
          </div>
        ) : null}

        {mode === "webpage" ? (
          <div className="space-y-1">
            <textarea
              value={webpage}
              onChange={(event) => setWebpage(event.target.value)}
              placeholder="Paste company ad text, press-release HTML, or webpage content to scan with the ESG model..."
              rows={7}
              className="w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            />
            <p className="text-[11px] text-terminal-text-muted">Uses the same ESG scoring logic as website URL analysis on pasted web content.</p>
          </div>
        ) : null}

        {mode === "document" ? (
          <p className="mt-2 text-[11px] text-terminal-text-muted">Documents run NLP extraction first, then ESG scoring.</p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="rounded border border-terminal-green/35 bg-terminal-green/8 px-3 py-1.5 text-xs text-terminal-green disabled:opacity-70"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          {error ? <p className="text-xs text-terminal-red">{error}</p> : null}
        </div>
      </div>

      {result ? (
        <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 text-xs text-terminal-text">
          <div className="grid gap-1 sm:grid-cols-2">
            <p>Input: {result.inputType}</p>
            <p>Content Length: {result.contentLength}</p>
            <p>Analysis Route: {getRouteLabel(result.analysisEngine ?? result.inputType)}</p>
            <p>
              ESG Bridge Score:{" "}
              {result.esk?.overall_score?.toFixed
                ? result.esk.overall_score.toFixed(2)
                : result.esg?.overall_score?.toFixed?.(2) ?? "N/A"}
            </p>
            <p>Model Status: {result.modelStatus}</p>
            <p>Storage: {result.storage?.status ?? "not_stored"}</p>
          </div>

          <div className="mt-3">
            <p className="text-terminal-text-muted">Summary</p>
            <p className="mt-1">{result.extraction?.summary || "No summary extracted."}</p>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-terminal-text-muted">Extracted Entities</p>
            {entityEntries.length === 0 ? <p>No entities found.</p> : null}
            {entityEntries.map(([key, values]) => (
              <div key={key}>
                <p className="uppercase tracking-wide text-terminal-text-muted">{key}</p>
                <p>{values.length > 0 ? values.join(", ") : "None"}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-terminal-text-muted">Claims Detected</p>
            {claims.length === 0 ? <p>No ESG claims detected in this content.</p> : null}
            {claims.map((claim) => {
              const style = CLAIM_TYPE_STYLES[claim.type] ?? "border-terminal-border bg-terminal-surface text-terminal-text";
              const confidence = Math.max(0, Math.min(1, claim.confidence ?? 0));

              return (
                <div key={`${claim.category}-${claim.type}-${claim.text}`} className="rounded border border-terminal-border bg-terminal-surface/40 p-2">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded border border-terminal-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-terminal-text-muted">
                      {claim.category}
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${style}`}>{claim.type}</span>
                  </div>
                  <p>{claim.text}</p>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-terminal-text-muted">
                      <span>Confidence</span>
                      <span>{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded bg-terminal-border/60">
                      <div className="h-full bg-terminal-cyan/75" style={{ width: `${Math.round(confidence * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {result?.aiAnalytics ? (
        <>
          <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 text-xs text-terminal-text">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-terminal-text">AI Model Analytics</p>
              <p className="text-[11px] text-terminal-text-muted">
                Active engine: {getRouteLabel(result.aiAnalytics.analysisEngine ?? result.analysisEngine ?? result.inputType)}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">ESG Risk Score</p>
                <p
                  className={`text-lg font-bold ${
                    (result.aiAnalytics.esgRiskScore ?? 50) < 30
                      ? "text-terminal-green"
                      : (result.aiAnalytics.esgRiskScore ?? 50) < 60
                        ? "text-terminal-amber"
                        : "text-terminal-red"
                  }`}
                >
                  {result.aiAnalytics.esgRiskScore ?? "N/A"}
                </p>
              </div>
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">Risk Level</p>
                <p
                  className={`text-lg font-bold ${
                    result.aiAnalytics.esgRiskLevel === "Low Risk"
                      ? "text-terminal-green"
                      : result.aiAnalytics.esgRiskLevel === "Medium Risk"
                        ? "text-terminal-amber"
                        : "text-terminal-red"
                  }`}
                >
                  {result.aiAnalytics.esgRiskLevel}
                </p>
              </div>
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">AI Confidence</p>
                <p className="text-lg font-bold text-terminal-cyan">
                  {(result.aiAnalytics.aiConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">Verification</p>
                <p
                  className={`text-lg font-bold ${
                    result.aiAnalytics.verificationStatus === "verified"
                      ? "text-terminal-green"
                      : result.aiAnalytics.verificationStatus === "flagged"
                        ? "text-terminal-red"
                        : "text-terminal-text-dim"
                  }`}
                >
                  {result.aiAnalytics.verificationStatus.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">Greenwashing Probability</p>
                <p
                  className={`text-lg font-bold ${scoreColorClass(result.aiAnalytics.greenwashingProbability, true)}`}
                >
                  {(result.aiAnalytics.greenwashingProbability * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">Climate Claim Credibility</p>
                <p
                  className={`text-lg font-bold ${scoreColorClass(result.aiAnalytics.climateClaimCredibility)}`}
                >
                  {(result.aiAnalytics.climateClaimCredibility * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded border border-terminal-border p-2">
                <p className="text-terminal-text-muted">Greenwashing Flag</p>
                <p
                  className={`text-lg font-bold ${
                    result.aiAnalytics.greenwashingProbability > 0.5 ? "text-terminal-red" : "text-terminal-green"
                  }`}
                >
                  {result.aiAnalytics.greenwashingProbability > 0.5 ? "FLAGGED" : "CLEAR"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 text-xs text-terminal-text">
            <p className="mb-2 text-sm font-semibold text-terminal-text">ESG Risk Breakdown</p>
            <div className="space-y-2">
              {Object.entries(result.aiAnalytics.riskBreakdown).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                const color =
                  value < 30 ? "bg-terminal-green" : value < 60 ? "bg-terminal-amber" : "bg-terminal-red";
                return (
                  <div key={key}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-terminal-text-muted">{label}</span>
                      <span>{value.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-terminal-border">
                      <div
                        className={`h-1.5 rounded-full ${color}`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {result.aiAnalytics.suspiciousStatements.length > 0 ? (
            <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 text-xs text-terminal-text">
              <p className="mb-2 text-sm font-semibold text-terminal-red">Suspicious ESG Statements</p>
              <ul className="space-y-1">
                {result.aiAnalytics.suspiciousStatements.map((statement, index) => (
                  <li key={index} className="rounded border border-terminal-red/20 bg-terminal-red/5 px-2 py-1 text-terminal-text-muted">
                    &ldquo;{statement}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      {result && !result.aiAnalytics && result.modelStatus !== "empty_input" ? (
        <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 text-xs text-terminal-amber">
          AI analysis unavailable. Please retry.
        </div>
      ) : null}

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3 text-xs text-terminal-text">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-terminal-text">Recent Analyzer Runs</p>
          <p className="text-[11px] text-terminal-text-muted">{historyLoading ? "Loading..." : `${history.length} stored`}</p>
        </div>

        {history.length === 0 ? (
          <p className="text-terminal-text-muted">No stored runs available. Configure Supabase backend credentials to persist analysis history.</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="rounded border border-terminal-border bg-terminal-surface/40 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-terminal-text">{getRouteLabel(item.analysis_engine)}</p>
                  <p className="text-[11px] text-terminal-text-muted">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="mt-1 grid gap-1 sm:grid-cols-2">
                  <p>Input: {item.input_type}</p>
                  <p>Model Status: {item.model_status}</p>
                  <p>Content Length: {item.content_length}</p>
                  <p>ESG Risk Score: {item.ai_analytics?.esgRiskScore ?? "N/A"}</p>
                </div>
                <p className="mt-1 text-terminal-text-muted">
                  {item.source?.url || item.extraction?.summary || "Stored analyzer run"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
