"use client";

import { useState, useEffect } from "react";
import { MacWindow } from "@/shared/components/mac-window";

/* ── World Clock ────────────────────────────────────────────────────── */

const CLOCKS = [
  { label: "New York", tz: "America/New_York", flag: "🇺🇸" },
  { label: "London", tz: "Europe/London", flag: "🇬🇧" },
  { label: "Dubai", tz: "Asia/Dubai", flag: "🇦🇪" },
  { label: "Tokyo", tz: "Asia/Tokyo", flag: "🇯🇵" },
  { label: "Sydney", tz: "Australia/Sydney", flag: "🇦🇺" },
  { label: "Hong Kong", tz: "Asia/Hong_Kong", flag: "🇭🇰" },
  { label: "Singapore", tz: "Asia/Singapore", flag: "🇸🇬" },
  { label: "Frankfurt", tz: "Europe/Berlin", flag: "🇩🇪" },
];

function formatTime(tz: string) {
  return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function getMarketStatus(tz: string): "open" | "closed" | "pre" {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { timeZone: tz, hour12: false });
  const [h] = timeStr.split(":").map(Number);
  if (h >= 9 && h < 16) return "open";
  if (h >= 7 && h < 9) return "pre";
  return "closed";
}

const STATUS_COLORS = {
  open: "bg-terminal-green/20 text-terminal-green border-terminal-green/30",
  closed: "bg-terminal-red/10 text-terminal-red/60 border-terminal-red/20",
  pre: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30",
};

export function WorldClockPanel() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const t: Record<string, string> = {};
      for (const c of CLOCKS) t[c.tz] = formatTime(c.tz);
      setTimes(t);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <MacWindow title="World Clock">
      <div className="grid grid-cols-2 gap-2 p-3">
        {CLOCKS.map((c) => {
          const status = getMarketStatus(c.tz);
          return (
            <div key={c.tz} className="rounded-lg border border-terminal-border/40 bg-terminal-bg/50 p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-terminal-text-dim">{c.flag} {c.label}</span>
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-widest ${STATUS_COLORS[status]}`}>{status}</span>
              </div>
              <p className="font-mono text-lg font-bold tabular-nums text-terminal-text">{times[c.tz] ?? "--:--:--"}</p>
            </div>
          );
        })}
      </div>
    </MacWindow>
  );
}

/* ── My Monitors ────────────────────────────────────────────────────── */

export function MyMonitorsPanel() {
  const [watchlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("greentrust:my-monitors");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  return (
    <MacWindow title="My Monitors">
      <div className="p-3">
        {watchlist.length > 0 ? (
          <div className="space-y-1.5">
            {watchlist.map((item, i) => (
              <div key={i} className="rounded border border-terminal-border/30 bg-terminal-bg/30 px-2.5 py-1.5">
                <span className="text-[10px] text-terminal-text">{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-terminal-border bg-terminal-bg/60">
              <span className="text-lg text-terminal-text-muted">⊕</span>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-terminal-text-dim">
                My Monitors
              </p>
              <p className="mt-1 text-[10px] text-terminal-text-muted">
                Your custom watchlist will appear here.
              </p>
              <p className="mt-0.5 text-[10px] text-terminal-text-muted">
                Use the Entity Console to search and add items to track.
              </p>
            </div>
          </div>
        )}
      </div>
    </MacWindow>
  );
}
