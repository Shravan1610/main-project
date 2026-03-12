"use client";

import { useEffect, useState } from "react";
import { MacWindow } from "@/shared/components/mac-window";

type ClockZone = {
  id: string;
  label: string;
  city: string;
  tz: string;
  flag: string;
};

const ZONES: ClockZone[] = [
  { id: "nyc", label: "NYSE", city: "New York", tz: "America/New_York", flag: "🇺🇸" },
  { id: "lon", label: "LSE", city: "London", tz: "Europe/London", flag: "🇬🇧" },
  { id: "tok", label: "TSE", city: "Tokyo", tz: "Asia/Tokyo", flag: "🇯🇵" },
  { id: "sha", label: "SSE", city: "Shanghai", tz: "Asia/Shanghai", flag: "🇨🇳" },
  { id: "hkg", label: "HKEX", city: "Hong Kong", tz: "Asia/Hong_Kong", flag: "🇭🇰" },
  { id: "fra", label: "FWB", city: "Frankfurt", tz: "Europe/Berlin", flag: "🇩🇪" },
  { id: "syd", label: "ASX", city: "Sydney", tz: "Australia/Sydney", flag: "🇦🇺" },
  { id: "mum", label: "BSE", city: "Mumbai", tz: "Asia/Kolkata", flag: "🇮🇳" },
  { id: "dub", label: "DFM", city: "Dubai", tz: "Asia/Dubai", flag: "🇦🇪" },
  { id: "sao", label: "B3", city: "São Paulo", tz: "America/Sao_Paulo", flag: "🇧🇷" },
  { id: "sgp", label: "SGX", city: "Singapore", tz: "Asia/Singapore", flag: "🇸🇬" },
  { id: "tor", label: "TSX", city: "Toronto", tz: "America/Toronto", flag: "🇨🇦" },
];

function isMarketOpen(tz: string, now: Date): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const mins = hour * 60 + minute;

  if (["Sat", "Sun"].includes(weekday)) return false;
  return mins >= 540 && mins <= 1020; // rough 9:00–17:00
}

function formatTime(tz: string, now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

function formatDate(tz: string, now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
}

export default function WorldClockPanel() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <MacWindow title="World Clock" rightSlot={<span className="text-terminal-cyan/80">Live</span>}>
      <div className="divide-y divide-terminal-border/40">
        {ZONES.map((zone) => {
          const open = isMarketOpen(zone.tz, now);
          return (
            <div
              key={zone.id}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{zone.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terminal-text">
                      {zone.label}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        open ? "bg-terminal-green animate-pulse" : "bg-terminal-text-muted/40"
                      }`}
                    />
                    <span
                      className={`text-[9px] uppercase tracking-[0.14em] ${
                        open ? "text-terminal-green" : "text-terminal-text-muted/60"
                      }`}
                    >
                      {open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-[10px] text-terminal-text-muted">
                    {zone.city}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm tabular-nums text-terminal-text">
                  {formatTime(zone.tz, now)}
                </p>
                <p className="text-[10px] tabular-nums text-terminal-text-muted">
                  {formatDate(zone.tz, now)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </MacWindow>
  );
}
