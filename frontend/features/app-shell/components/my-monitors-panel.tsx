"use client";

import { useCallback, useState } from "react";
import { MacWindow } from "@/shared/components/mac-window";

type Monitor = {
  id: string;
  label: string;
  entity: string;
  type: "price" | "esg" | "news" | "threshold";
  condition: string;
  active: boolean;
  lastTriggered: string | null;
};

const STORAGE_KEY = "greentrust:monitors";

const DEFAULT_MONITORS: Monitor[] = [
  {
    id: "m1",
    label: "Tesla ESG Drop",
    entity: "TSLA",
    type: "esg",
    condition: "ESG score drops below 40",
    active: true,
    lastTriggered: null,
  },
  {
    id: "m2",
    label: "BTC Price Alert",
    entity: "BTC",
    type: "price",
    condition: "Price crosses $100,000",
    active: true,
    lastTriggered: null,
  },
  {
    id: "m3",
    label: "Apple News Watch",
    entity: "AAPL",
    type: "news",
    condition: "Negative ESG news detected",
    active: false,
    lastTriggered: "2h ago",
  },
  {
    id: "m4",
    label: "Oil Price Spike",
    entity: "CL=F",
    type: "threshold",
    condition: "WTI > $85/barrel",
    active: true,
    lastTriggered: null,
  },
  {
    id: "m5",
    label: "EU Carbon Credit",
    entity: "ECX",
    type: "price",
    condition: "EUA price > €80",
    active: true,
    lastTriggered: "5h ago",
  },
];

const TYPE_COLORS: Record<Monitor["type"], string> = {
  price: "text-terminal-green border-terminal-green/30 bg-terminal-green/8",
  esg: "text-terminal-cyan border-terminal-cyan/30 bg-terminal-cyan/8",
  news: "text-terminal-amber border-terminal-amber/30 bg-terminal-amber/8",
  threshold: "text-terminal-red border-terminal-red/30 bg-terminal-red/8",
};

const TYPE_LABELS: Record<Monitor["type"], string> = {
  price: "Price",
  esg: "ESG",
  news: "News",
  threshold: "Threshold",
};

function loadMonitors(): Monitor[] {
  if (typeof window === "undefined") return DEFAULT_MONITORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Monitor[]) : DEFAULT_MONITORS;
  } catch {
    return DEFAULT_MONITORS;
  }
}

export default function MyMonitorsPanel() {
  const [monitors, setMonitors] = useState<Monitor[]>(() => loadMonitors());

  const persist = useCallback((next: Monitor[]) => {
    setMonitors(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota exceeded, ignore
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      persist(monitors.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
    },
    [monitors, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(monitors.filter((m) => m.id !== id));
    },
    [monitors, persist],
  );

  const activeCount = monitors.filter((m) => m.active).length;

  return (
    <MacWindow
      title="My Monitors"
      rightSlot={
        <span className="text-terminal-green/80">
          {activeCount} active
        </span>
      }
    >
      {monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-terminal-text-dim">
            No monitors set
          </p>
          <p className="text-[10px] text-terminal-text-muted">
            Monitors you create will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-terminal-border/40">
          {monitors.map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => toggle(m.id)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  m.active
                    ? "border-terminal-green/50 bg-terminal-green/15"
                    : "border-terminal-border bg-terminal-bg/60"
                }`}
              >
                {m.active ? (
                  <span className="text-[10px] text-terminal-green">✓</span>
                ) : null}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                      m.active ? "text-terminal-text" : "text-terminal-text-muted line-through"
                    }`}
                  >
                    {m.label}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] ${TYPE_COLORS[m.type]}`}
                  >
                    {TYPE_LABELS[m.type]}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-terminal-text-muted">
                  <span className="font-mono text-terminal-text-dim">{m.entity}</span>
                  {" · "}
                  {m.condition}
                </p>
                {m.lastTriggered ? (
                  <p className="mt-0.5 text-[9px] text-terminal-amber">
                    Triggered {m.lastTriggered}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => remove(m.id)}
                className="shrink-0 text-[10px] text-terminal-text-muted/60 transition-colors hover:text-terminal-red"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </MacWindow>
  );
}
