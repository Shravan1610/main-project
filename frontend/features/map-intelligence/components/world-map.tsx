"use client";

import { WorldMap as BaseWorldMap } from "@/components/ui/world-map";

import type { MapProps } from "../types";

function toMapPercent(lat: number, lng: number) {
  return {
    left: `${((lng + 180) / 360) * 100}%`,
    top: `${((90 - lat) / 180) * 100}%`,
  };
}

function climateIntensity(markerId: string): "low" | "medium" | "high" {
  const score = markerId.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % 3;

  if (score === 0) {
    return "low";
  }
  if (score === 1) {
    return "medium";
  }
  return "high";
}

export function WorldMap({ viewport, markers }: MapProps) {
  const dots = markers
    .map((marker) => ({
      start: {
        lat: viewport.center[0],
        lng: viewport.center[1],
        label: "viewport-center",
      },
      end: {
        lat: marker.coordinates.lat,
        lng: marker.coordinates.lng,
        label: marker.label,
      },
    }));
  const climateHotspots = markers
    .filter((marker) => marker.kind === "climate")
    .map((marker) => ({
      ...marker,
      intensity: climateIntensity(marker.id),
    }));

  return (
    <div className="h-full min-h-[320px] rounded-xl border border-terminal-border/90 bg-terminal-bg/70 p-2">
      <div className="mb-2 flex items-center justify-between border-b border-terminal-border px-2 pb-2 text-[11px] text-terminal-text-dim">
        <span className="font-semibold tracking-[0.12em] text-terminal-text">GLOBAL SITUATION</span>
        <div className="flex items-center gap-2">
          <span>WED, 11 MAR 2026</span>
          <span className="rounded border border-terminal-green/25 bg-terminal-green/10 px-1.5 py-0.5 text-terminal-green">2D</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-terminal-border bg-[#0b0f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <BaseWorldMap dots={dots} />
        {climateHotspots.map((marker) => {
          const position = toMapPercent(marker.coordinates.lat, marker.coordinates.lng);
          const ringClass =
            marker.intensity === "high"
              ? "bg-terminal-red/60"
              : marker.intensity === "medium"
                ? "bg-terminal-amber/60"
                : "bg-terminal-green/60";
          const glowClass =
            marker.intensity === "high"
              ? "shadow-[0_0_14px_rgb(var(--terminal-red)/0.32)]"
              : marker.intensity === "medium"
                ? "shadow-[0_0_14px_rgb(var(--terminal-amber)/0.28)]"
                : "shadow-[0_0_14px_rgb(var(--terminal-green)/0.28)]";
          const pulseClass =
            marker.intensity === "high"
              ? "h-9 w-9"
              : marker.intensity === "medium"
                ? "h-7 w-7"
                : "h-6 w-6";

          return (
            <div
              key={marker.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={position}
              title={`${marker.label} (${marker.intensity})`}
            >
              <div className={`absolute -z-10 animate-ping rounded-full ${pulseClass} ${ringClass}`} />
              <div className={`h-3 w-3 rounded-full ${ringClass} ${glowClass}`} />
            </div>
          );
        })}

        <div className="pointer-events-none absolute left-3 top-3 rounded border border-terminal-border bg-black/55 px-2 py-1 text-[10px] tracking-wide text-terminal-text-dim">
          CLIMATE SIM
          <span className="ml-2 inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-green/80" />
              LOW
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-amber/80" />
              MED
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-red/90" />
              HIGH
            </span>
          </span>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-terminal-border bg-black/50 px-2 py-1 text-[10px] tracking-wide text-terminal-text-dim">
          MARKERS: {markers.length} | CENTER: {viewport.center[0]}, {viewport.center[1]} | ZOOM: {viewport.zoom}
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-terminal-border bg-black/50 px-2 py-1 text-[10px] tracking-wide text-terminal-text-dim">
          ENTITY {markers.filter((item) => item.kind === "entity").length} | EXCH{" "}
          {markers.filter((item) => item.kind === "exchange").length} | CLIMATE{" "}
          {markers.filter((item) => item.kind === "climate").length} | NEWS{" "}
          {markers.filter((item) => item.kind === "news").length}
        </div>
        <div className="pointer-events-none absolute right-3 top-3 flex gap-1.5">
          <span className="rounded border border-terminal-border bg-black/40 px-2 py-0.5 text-[10px] text-terminal-text-dim">
            HIGH ALERT
          </span>
          <span className="rounded border border-terminal-border bg-black/40 px-2 py-0.5 text-[10px] text-terminal-text-dim">
            MONITORING
          </span>
        </div>
      </div>
    </div>
  );
}
