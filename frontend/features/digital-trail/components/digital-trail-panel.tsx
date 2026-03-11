"use client";

import { useMemo, useState } from "react";

type TrailEvent = {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  risk: "low" | "medium" | "high";
};

const MOCK_EVENTS: TrailEvent[] = [
  {
    id: "1",
    timestamp: "2026-03-11T09:05:00Z",
    event: "Large transfer detected to exchange wallet cluster.",
    source: "On-chain monitor",
    risk: "medium",
  },
  {
    id: "2",
    timestamp: "2026-03-11T09:22:00Z",
    event: "Asset mentioned in coordinated social spike.",
    source: "Social intel",
    risk: "high",
  },
  {
    id: "3",
    timestamp: "2026-03-11T09:43:00Z",
    event: "New contract interaction with unknown protocol.",
    source: "Contract watcher",
    risk: "medium",
  },
  {
    id: "4",
    timestamp: "2026-03-11T10:02:00Z",
    event: "Wallet concentration improved after redistribution.",
    source: "Ownership analysis",
    risk: "low",
  },
];

function riskClassName(risk: TrailEvent["risk"]) {
  if (risk === "high") return "text-rose-300";
  if (risk === "medium") return "text-amber-300";
  return "text-emerald-300";
}

export function DigitalTrailPanel() {
  const [asset, setAsset] = useState("BTC");

  const events = useMemo(
    () => MOCK_EVENTS.map((item) => ({ ...item, event: item.event.replace("Asset", asset.toUpperCase()) })),
    [asset],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-terminal-text">Digital Asset Trail</h3>
        <p className="text-xs text-terminal-text-muted">Trace signals and anomalies</p>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
        <label className="text-xs text-terminal-text-muted" htmlFor="digital-trail-asset">
          Asset Symbol / Address
        </label>
        <input
          id="digital-trail-asset"
          type="text"
          value={asset}
          onChange={(event) => setAsset(event.target.value)}
          placeholder="BTC or wallet address"
          className="mt-1 w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
        />
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-terminal-text-muted">Trail Timeline</p>
        <div className="space-y-2">
          {events.map((event) => (
            <article key={event.id} className="rounded border border-terminal-border bg-terminal-surface p-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-terminal-text">{new Date(event.timestamp).toLocaleString()}</p>
                <p className={`text-xs uppercase ${riskClassName(event.risk)}`}>{event.risk}</p>
              </div>
              <p className="mt-1 text-sm text-terminal-text">{event.event}</p>
              <p className="mt-1 text-xs text-terminal-text-muted">{event.source}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
