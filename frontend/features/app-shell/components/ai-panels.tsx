"use client";

import { useCallback, useEffect, useState } from "react";
import { MacWindow } from "@/shared/components/mac-window";
import { apiClient } from "@/shared/api/client";
import { useRefresh } from "@/shared/hooks";

// ── Shared loading/error states ──────────────────────────────────────────

function PanelLoader() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3 w-3/4 animate-pulse rounded bg-terminal-border/30" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-terminal-border/30" />
      <div className="h-16 animate-pulse rounded-lg bg-terminal-border/20" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-terminal-border/30" />
    </div>
  );
}

function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-terminal-red">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-terminal-border px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-terminal-text-dim transition-colors hover:bg-terminal-surface"
      >
        Retry
      </button>
    </div>
  );
}

function useFetchPanel<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useRefresh();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<T>(path);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetch();
  }, [fetch, refreshKey]);

  return { data, loading, error, refetch: fetch };
}

// ── Badge helpers ────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    bullish: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
    bearish: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
    neutral: "border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${colors[sentiment] ?? colors.neutral}`}>
      {sentiment}
    </span>
  );
}

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  const style = map[status] ?? "border-terminal-border bg-terminal-bg/40 text-terminal-text-muted";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${style}`}>
      {status}
    </span>
  );
}

const THREAT_COLORS: Record<string, string> = {
  low: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  elevated: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  high: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  critical: "border-terminal-red/50 bg-terminal-red/20 text-terminal-red",
};

const REGION_COLORS: Record<string, string> = {
  stable: "text-terminal-green",
  watch: "text-terminal-amber",
  alert: "text-terminal-red",
  crisis: "text-terminal-red font-bold",
};

const SIGNAL_COLORS: Record<string, string> = {
  buy: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  sell: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  hold: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
};

const IMPACT_COLORS: Record<string, string> = {
  low: "text-terminal-green",
  medium: "text-terminal-amber",
  high: "text-terminal-red",
};

// ── AI Insights Panel ────────────────────────────────────────────────────

type AIInsightsData = {
  insights: Array<{
    title: string;
    body: string;
    category: string;
    sentiment: "bullish" | "bearish" | "neutral";
    confidence: number;
  }>;
  source: string;
};

export function AIInsightsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<AIInsightsData>("/ai/insights");

  return (
    <MacWindow
      title="AI Insights"
      rightSlot={<span className="text-terminal-cyan/80">AI</span>}
    >
      <div className="p-3">
        {loading ? (
          <PanelLoader />
        ) : error ? (
          <PanelError message={error} onRetry={refetch} />
        ) : data?.insights.length ? (
          <div className="space-y-3">
            {data.insights.map((insight, i) => (
              <div key={i} className="rounded-lg border border-terminal-border/50 bg-terminal-bg/40 p-3">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-terminal-text">{insight.title}</p>
                  <SentimentBadge sentiment={insight.sentiment} />
                </div>
                <p className="text-[11px] leading-relaxed text-terminal-text-dim">{insight.body}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">{insight.category}</span>
                  <span className="text-[9px] text-terminal-text-muted">
                    {Math.round(insight.confidence * 100)}% conf
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-[10px] text-terminal-text-muted">No insights available</p>
        )}
      </div>
    </MacWindow>
  );
}

// ── Global Situation Panel ───────────────────────────────────────────────

type GlobalSituationData = {
  threat_level: string;
  summary: string;
  regions: Array<{ name: string; status: string; headline: string }>;
  top_risks: Array<{ risk: string; probability: string; impact: string }>;
  source: string;
};

export function GlobalSituationPanel() {
  const { data, loading, error, refetch } = useFetchPanel<GlobalSituationData>("/ai/global-situation");

  return (
    <MacWindow
      title="Global Situation"
      rightSlot={<span className="text-terminal-cyan/80">AI</span>}
    >
      <div className="p-3">
        {loading ? (
          <PanelLoader />
        ) : error ? (
          <PanelError message={error} onRetry={refetch} />
        ) : data ? (
          <div className="space-y-3">
            {/* Threat level header */}
            <div className="flex items-center justify-between">
              <StatusBadge status={data.threat_level} map={THREAT_COLORS} />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">threat level</span>
            </div>
            <p className="text-[11px] leading-relaxed text-terminal-text-dim">{data.summary}</p>

            {/* Regions */}
            {data.regions.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">Regions</p>
                <div className="space-y-1.5">
                  {data.regions.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5">
                      <span className={`mt-px text-[9px] font-bold uppercase ${REGION_COLORS[r.status] ?? "text-terminal-text-muted"}`}>
                        {r.status}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-medium text-terminal-text">{r.name}</span>
                        <p className="text-[10px] text-terminal-text-dim">{r.headline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Top risks */}
            {data.top_risks.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">Top Risks</p>
                <div className="space-y-1">
                  {data.top_risks.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5">
                      <p className="flex-1 text-[10px] text-terminal-text-dim">{r.risk}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] ${IMPACT_COLORS[r.probability] ?? "text-terminal-text-muted"}`}>P:{r.probability}</span>
                        <span className={`text-[9px] ${IMPACT_COLORS[r.impact] ?? "text-terminal-text-muted"}`}>I:{r.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

// ── Market Analysis Panel ────────────────────────────────────────────────

type MarketAnalysisData = {
  outlook: string;
  summary: string;
  sectors: Array<{ name: string; signal: string; reason: string }>;
  key_levels: Array<{ asset: string; level: string; significance: string }>;
  source: string;
};

export function MarketAnalysisPanel() {
  const { data, loading, error, refetch } = useFetchPanel<MarketAnalysisData>("/ai/market-analysis");

  return (
    <MacWindow
      title="Market Analysis"
      rightSlot={
        <span className="text-terminal-cyan/80">AI</span>
      }
    >
      <div className="p-3">
        {loading ? (
          <PanelLoader />
        ) : error ? (
          <PanelError message={error} onRetry={refetch} />
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge
                status={data.outlook}
                map={{
                  "risk-on": "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
                  "risk-off": "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
                  mixed: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
                }}
              />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">outlook</span>
            </div>
            <p className="text-[11px] leading-relaxed text-terminal-text-dim">{data.summary}</p>

            {/* Sector signals */}
            {data.sectors.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">Sector Signals</p>
                <div className="space-y-1.5">
                  {data.sectors.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5">
                      <StatusBadge status={s.signal} map={SIGNAL_COLORS} />
                      <span className="text-[10px] font-medium text-terminal-text">{s.name}</span>
                      <span className="flex-1 truncate text-right text-[10px] text-terminal-text-muted">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Key levels */}
            {data.key_levels.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">Key Levels</p>
                <div className="space-y-1">
                  {data.key_levels.map((k, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5">
                      <span className="text-[10px] font-medium text-terminal-cyan">{k.asset}</span>
                      <span className="text-[10px] font-mono text-terminal-text">{k.level}</span>
                      <span className="text-[10px] text-terminal-text-muted">{k.significance}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

// ── Predictions Panel ────────────────────────────────────────────────────

type PredictionsData = {
  predictions: Array<{
    event: string;
    probability: number;
    timeframe: string;
    category: string;
  }>;
  source: string;
};

export function PredictionsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<PredictionsData>("/ai/predictions");

  return (
    <MacWindow
      title="Predictions"
      rightSlot={<span className="text-terminal-cyan/80">AI</span>}
    >
      <div className="p-3">
        {loading ? (
          <PanelLoader />
        ) : error ? (
          <PanelError message={error} onRetry={refetch} />
        ) : data?.predictions.length ? (
          <div className="space-y-2">
            {data.predictions.map((p, i) => (
              <div key={i} className="rounded-lg border border-terminal-border/50 bg-terminal-bg/40 p-2.5">
                <p className="mb-1.5 text-[11px] leading-snug text-terminal-text">{p.event}</p>
                <div className="flex items-center gap-3">
                  {/* Probability bar */}
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-terminal-border/30">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.probability >= 70
                            ? "bg-terminal-green"
                            : p.probability >= 40
                              ? "bg-terminal-amber"
                              : "bg-terminal-red"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, p.probability))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-terminal-text">{p.probability}%</span>
                  </div>
                  <span className="text-[9px] text-terminal-text-muted">{p.timeframe}</span>
                  <span className="text-[9px] uppercase text-terminal-text-muted">{p.category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-[10px] text-terminal-text-muted">No predictions available</p>
        )}
      </div>
    </MacWindow>
  );
}

// ── Daily Market Brief Panel ─────────────────────────────────────────────

type DailyBriefData = {
  date: string;
  headline: string;
  summary: string;
  bullets: string[];
  watchlist: Array<{ ticker: string; reason: string }>;
  source: string;
};

export function DailyBriefPanel() {
  const { data, loading, error, refetch } = useFetchPanel<DailyBriefData>("/ai/daily-brief");

  return (
    <MacWindow
      title="Daily Market Brief"
      rightSlot={<span className="text-terminal-cyan/80">AI</span>}
    >
      <div className="p-3">
        {loading ? (
          <PanelLoader />
        ) : error ? (
          <PanelError message={error} onRetry={refetch} />
        ) : data ? (
          <div className="space-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">{data.date}</p>
              <p className="mt-1 text-xs font-semibold text-terminal-text">{data.headline}</p>
            </div>
            <p className="text-[11px] leading-relaxed text-terminal-text-dim">{data.summary}</p>

            {/* Bullet points */}
            {data.bullets.length > 0 ? (
              <ul className="space-y-1.5">
                {data.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[10px] leading-relaxed text-terminal-text-dim">
                    <span className="mt-0.5 text-terminal-cyan">▸</span>
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Watchlist */}
            {data.watchlist.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">Watchlist</p>
                <div className="space-y-1">
                  {data.watchlist.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5">
                      <span className="text-[10px] font-mono font-medium text-terminal-cyan">{w.ticker}</span>
                      <span className="text-[10px] text-terminal-text-muted">{w.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

// ── AI Regulation Dashboard Panel ────────────────────────────────────────

type AIRegulationData = {
  status: string;
  summary: string;
  updates: Array<{ jurisdiction: string; action: string; impact: string; date: string }>;
  watchlist: string[];
  source: string;
};

export function AIRegulationPanel() {
  const { data, loading, error, refetch } = useFetchPanel<AIRegulationData>("/ai/regulation");

  return (
    <MacWindow
      title="AI Regulation Dashboard"
      rightSlot={<span className="text-terminal-cyan/80">AI</span>}
    >
      <div className="p-3">
        {loading ? (
          <PanelLoader />
        ) : error ? (
          <PanelError message={error} onRetry={refetch} />
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge
                status={data.status}
                map={{
                  tightening: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
                  stable: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
                  loosening: "border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan",
                }}
              />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">regulatory stance</span>
            </div>
            <p className="text-[11px] leading-relaxed text-terminal-text-dim">{data.summary}</p>

            {/* Regulation updates */}
            {data.updates.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">Updates</p>
                <div className="space-y-1.5">
                  {data.updates.map((u, i) => (
                    <div key={i} className="rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-terminal-text">{u.jurisdiction}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] ${IMPACT_COLORS[u.impact] ?? "text-terminal-text-muted"}`}>{u.impact}</span>
                          <span className="text-[9px] text-terminal-text-muted">{u.date}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-terminal-text-dim">{u.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Watchlist */}
            {data.watchlist.length > 0 ? (
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">On Watch</p>
                <ul className="space-y-1">
                  {data.watchlist.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[10px] text-terminal-text-dim">
                      <span className="text-terminal-amber">⚠</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}
