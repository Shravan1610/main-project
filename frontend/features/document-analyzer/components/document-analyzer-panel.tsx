"use client";

import { useMemo, useState } from "react";

import { analyzeDocumentInput } from "../services";
import type { DocumentAnalyzerResponse } from "../types";

type InputMode = "document" | "url" | "webpage";

const INPUT_MODES: Array<{ id: InputMode; label: string }> = [
  { id: "document", label: "Document" },
  { id: "url", label: "URL" },
  { id: "webpage", label: "Webpage" },
];

const CLAIM_TYPE_STYLES: Record<string, string> = {
  commitment: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
  certification: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  assertion: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  metric: "border-sky-400/40 bg-sky-500/10 text-sky-200",
};

export function DocumentAnalyzerPanel() {
  const [mode, setMode] = useState<InputMode>("document");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [webpage, setWebpage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalyzerResponse | null>(null);

  const entityEntries = useMemo(() => {
    if (!result?.extraction?.entities) return [];
    return Object.entries(result.extraction.entities);
  }, [result?.extraction?.entities]);

  const claims = result?.claims ?? [];

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const response = await analyzeDocumentInput(mode, {
        file,
        url: url.trim(),
        webpage: webpage.trim(),
      });
      setResult(response);
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
        <h3 className="text-sm font-semibold text-terminal-text">ESK + NLP Document Analyzer</h3>
        <p className="text-xs text-terminal-text-muted">Model adapter ready</p>
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
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
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
            <p className="text-[11px] text-terminal-text-muted">Scrape URL for ESG Claims</p>
          </div>
        ) : null}

        {mode === "webpage" ? (
          <textarea
            value={webpage}
            onChange={(event) => setWebpage(event.target.value)}
            placeholder="Paste company ad text, press-release HTML or webpage content to scan for claims..."
            rows={7}
            className="w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
          />
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="rounded border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 disabled:opacity-70"
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
            <p>
              ESK/ESG Score:{" "}
              {result.esk?.overall_score?.toFixed
                ? result.esk.overall_score.toFixed(2)
                : result.esg?.overall_score?.toFixed?.(2) ?? "N/A"}
            </p>
            <p>Model Status: {result.modelStatus}</p>
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
            {claims.map((claim, index) => {
              const style = CLAIM_TYPE_STYLES[claim.type] ?? "border-terminal-border bg-terminal-surface text-terminal-text";
              const confidence = Math.max(0, Math.min(1, claim.confidence ?? 0));

              return (
                <div key={`${claim.category}-${index}`} className="rounded border border-terminal-border bg-terminal-surface/40 p-2">
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
                      <div className="h-full bg-cyan-300/80" style={{ width: `${Math.round(confidence * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
