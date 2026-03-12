"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/shared/api/client";

/* ── Shared fetch hook ──────────────────────────────────────────────── */

export function useFetchPanel<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doFetch = useCallback(async () => {
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
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}

/* ── Loading skeleton ───────────────────────────────────────────────── */

export function PanelLoader() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="h-3 w-3/4 animate-pulse rounded bg-terminal-border/30" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-terminal-border/30" />
      <div className="h-16 animate-pulse rounded-lg bg-terminal-border/20" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-terminal-border/30" />
      <div className="h-12 animate-pulse rounded-lg bg-terminal-border/20" />
    </div>
  );
}

/* ── Error state ────────────────────────────────────────────────────── */

export function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

/* ── Badge components ───────────────────────────────────────────────── */

const COLOR_MAP: Record<string, string> = {
  // sentiments
  bullish: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  bearish: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  neutral: "border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan",
  // signals
  buy: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  "strong-buy": "border-terminal-green/40 bg-terminal-green/15 text-terminal-green",
  sell: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  hold: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  // severity / impact
  low: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  medium: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  high: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  critical: "border-terminal-red/50 bg-terminal-red/20 text-terminal-red",
  // trend
  up: "text-terminal-green",
  down: "text-terminal-red",
  flat: "text-terminal-text-muted",
  improving: "text-terminal-green",
  worsening: "text-terminal-red",
  stable: "text-terminal-text-dim",
  deteriorating: "text-terminal-red",
  // outlook
  positive: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  negative: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  // bias
  hawkish: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  dovish: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  mixed: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  // status
  hot: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  warm: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  cool: "border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan",
  cold: "border-terminal-cyan/40 bg-terminal-cyan/15 text-terminal-cyan",
  // flow
  inflow: "text-terminal-green",
  outflow: "text-terminal-red",
  // stablecoin
  "minor-depeg": "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  "major-depeg": "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  // other
  tightening: "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
  easing: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  loosening: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  elevated: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  moderate: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  active: "border-terminal-green/30 bg-terminal-green/10 text-terminal-green",
  paused: "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
  review: "border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan",
};

const FALLBACK_COLOR = "border-terminal-border bg-terminal-bg/40 text-terminal-text-muted";

export function Badge({ value, className }: { value: string; className?: string }) {
  const style = COLOR_MAP[value] ?? FALLBACK_COLOR;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${style} ${className ?? ""}`}>
      {value}
    </span>
  );
}

export function TrendArrow({ trend }: { trend: string }) {
  const arrow = trend === "up" || trend === "improving" ? "▲" : trend === "down" || trend === "worsening" || trend === "deteriorating" ? "▼" : "–";
  const color = COLOR_MAP[trend] ?? "text-terminal-text-muted";
  return <span className={`text-[10px] font-bold ${color}`}>{arrow}</span>;
}

export function ChangePct({ value }: { value: number }) {
  const color = value > 0 ? "text-terminal-green" : value < 0 ? "text-terminal-red" : "text-terminal-text-muted";
  return <span className={`text-[10px] font-mono ${color}`}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

/* ── Section header ──────────────────────────────────────────────────── */

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-terminal-text-muted">{children}</p>;
}

export function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5 ${className ?? ""}`}>{children}</div>;
}
