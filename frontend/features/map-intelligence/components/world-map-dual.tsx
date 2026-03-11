"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";

import type { ActiveLayers, MapEngine, MapMarker, MapProps } from "../types";

const DeckGLMap = dynamic(
  () => import("./deckgl-map").then((m) => m.DeckGLMap),
  { ssr: false },
);

const GlobeMap = dynamic(
  () => import("./globe-map").then((m) => m.GlobeMap),
  { ssr: false },
);

const DEFAULT_ACTIVE: ActiveLayers = {
  entities: true,
  exchanges: false,
  climate: false,
  news: false,
  heatmap: false,
  "risk-overlay": false,
};

export function WorldMap({
  viewport,
  markers,
  activeLayers = DEFAULT_ACTIVE,
  onMarkerSelect,
  engine: externalEngine,
  onEngineChange,
}: MapProps) {
  const [internalEngine, setInternalEngine] = useState<MapEngine>("2d");
  const engine = externalEngine ?? internalEngine;

  const toggle = useCallback(() => {
    const next = engine === "2d" ? "3d" : "2d";
    if (onEngineChange) {
      onEngineChange(next);
    } else {
      setInternalEngine(next);
    }
  }, [engine, onEngineChange]);

  const countByKind = (kind: MapMarker["kind"]) =>
    markers.filter((m) => m.kind === kind).length;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).toUpperCase();

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return (
    <div className="group relative h-full min-h-[320px] rounded-xl border border-terminal-border/90 bg-terminal-bg/70 p-2">
      {/* Top header bar */}
      <div className="mb-2 flex items-center justify-between border-b border-terminal-border px-2 pb-2 text-[11px] text-terminal-text-dim">
        <span className="font-semibold tracking-[0.12em] text-terminal-text">
          GLOBAL SITUATION
        </span>
        <div className="flex items-center gap-3">
          <span>{dateStr} {timeStr} UTC</span>
          {/* Engine toggle */}
          <div className="flex overflow-hidden rounded border border-terminal-border">
            <button
              type="button"
              onClick={() => engine !== "2d" && toggle()}
              className={`px-2 py-0.5 text-[10px] transition-colors ${
                engine === "2d"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "text-terminal-text-dim hover:text-terminal-text"
              }`}
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => engine !== "3d" && toggle()}
              className={`px-2 py-0.5 text-[10px] transition-colors ${
                engine === "3d"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "text-terminal-text-dim hover:text-terminal-text"
              }`}
            >
              3D
            </button>
          </div>
        </div>
      </div>

      {/* Map viewport */}
      <div className="relative overflow-hidden rounded-lg border border-terminal-border bg-[#0b0f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        style={{ height: "calc(100% - 40px)" }}
      >
        {engine === "2d" ? (
          <DeckGLMap viewport={viewport} markers={markers} activeLayers={activeLayers} onMarkerSelect={onMarkerSelect} />
        ) : (
          <GlobeMap viewport={viewport} markers={markers} activeLayers={activeLayers} onMarkerSelect={onMarkerSelect} />
        )}

        {/* HUD: Legend */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2">
          <div className="rounded border border-terminal-border bg-black/70 px-2.5 py-1.5 text-[10px] tracking-wide text-terminal-text-dim backdrop-blur-sm">
            <span className="mr-2 font-semibold text-terminal-text">LEGEND</span>
            <span className="inline-flex items-center gap-1 mr-2">
              <span className="h-2 w-2 rounded-full bg-[#84dba0]" /> Entity
            </span>
            <span className="inline-flex items-center gap-1 mr-2">
              <span className="h-2 w-2 rounded-full bg-[#88c6f5]" /> Exchange
            </span>
            <span className="inline-flex items-center gap-1 mr-2">
              <span className="h-2 w-2 rounded-full bg-[#e9bc74]" /> Climate
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ea7b78]" /> News
            </span>
          </div>
        </div>

        {/* HUD: Stats */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-terminal-border bg-black/70 px-2.5 py-1.5 text-[10px] tracking-wide text-terminal-text-dim backdrop-blur-sm">
          ENTITY {countByKind("entity")} | EXCH {countByKind("exchange")} | CLIMATE{" "}
          {countByKind("climate")} | NEWS {countByKind("news")}
        </div>

        {/* HUD: Status badge */}
        <div className="pointer-events-none absolute right-3 top-3">
          <span className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 backdrop-blur-sm">
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
