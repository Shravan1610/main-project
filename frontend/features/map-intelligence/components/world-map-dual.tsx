"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import type { ActiveLayers, MapEngine, MapMarker, MapProps } from "../types";
import { StreetViewPanel } from "./street-view-panel";
import {
  getAllExchangeStatuses,
  getUserTimezone,
  getUserTimezoneAbbr,
  type ExchangeStatusInfo,
} from "../utils/market-hours";

const DeckGLMap = dynamic(
  () => import("./deckgl-map").then((m) => m.DeckGLMap),
  { ssr: false },
);

const GlobeMap = dynamic(
  () => import("./globe-map").then((m) => m.GlobeMap),
  { ssr: false },
);

const DEFAULT_ACTIVE: ActiveLayers = {
  population: true,
  climate: true,
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
  climateHeatmap,
}: MapProps) {
  const [internalEngine, setInternalEngine] = useState<MapEngine>("2d");
  const engine = externalEngine ?? internalEngine;

  const [streetViewCoord, setStreetViewCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);

  // Market hours
  const [exchangeStatuses, setExchangeStatuses] = useState<ExchangeStatusInfo[]>(
    () => getAllExchangeStatuses(),
  );
  const [localTz] = useState(() => getUserTimezone());
  const [localTzAbbr] = useState(() => getUserTimezoneAbbr());
  const [localTime, setLocalTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setExchangeStatuses(getAllExchangeStatuses());
      setLocalTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      );
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const openCount = exchangeStatuses.filter((s) => s.status === "open").length;
  const showMarketHUD = activeLayers?.["market-hours"] ?? true;

  const toggle = useCallback(() => {
    const next = engine === "2d" ? "3d" : "2d";
    if (onEngineChange) {
      onEngineChange(next);
    } else {
      setInternalEngine(next);
    }
  }, [engine, onEngineChange]);

  const handleContextMenu = useCallback((lngLat: { lat: number; lng: number }) => {
    // Position the context menu near the center of the map viewport
    setContextMenu({ x: 200, y: 200, lat: lngLat.lat, lng: lngLat.lng });
  }, []);

  const openStreetView = useCallback(() => {
    if (contextMenu) {
      setStreetViewCoord({ lat: contextMenu.lat, lng: contextMenu.lng });
      setContextMenu(null);
    }
  }, [contextMenu]);

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
    <div className="group relative h-full min-h-80 rounded-xl border border-terminal-border/90 bg-terminal-bg/70 p-2">
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
                  ? "border-terminal-green/30 bg-terminal-green/10 text-terminal-green"
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
                  ? "border-terminal-green/30 bg-terminal-green/10 text-terminal-green"
                  : "text-terminal-text-dim hover:text-terminal-text"
              }`}
            >
              3D
            </button>
          </div>
        </div>
      </div>

      {/* Map viewport */}
      <div className="relative overflow-hidden rounded-lg border border-terminal-border bg-terminal-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        style={{ height: "calc(100% - 40px)" }}
        onClick={() => setContextMenu(null)}
      >
        {engine === "2d" ? (
          <DeckGLMap viewport={viewport} markers={markers} activeLayers={activeLayers} onMarkerSelect={onMarkerSelect} onContextMenu={handleContextMenu} climateHeatmap={climateHeatmap} />
        ) : (
          <GlobeMap viewport={viewport} markers={markers} activeLayers={activeLayers} onMarkerSelect={onMarkerSelect} climateHeatmap={climateHeatmap} />
        )}

        {/* Street View overlay */}
        {streetViewCoord && (
          <StreetViewPanel
            lat={streetViewCoord.lat}
            lng={streetViewCoord.lng}
            onClose={() => setStreetViewCoord(null)}
          />
        )}

        {/* Right-click context menu */}
        {contextMenu && !streetViewCoord && (
          <div
            className="absolute z-40 rounded border border-terminal-border bg-terminal-surface/95 py-1 shadow-lg backdrop-blur-sm"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              onClick={openStreetView}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-terminal-text transition-colors hover:bg-terminal-border/40"
            >
              <span className="text-terminal-cyan">&#9673;</span> Open Street View
            </button>
            <div className="mx-2 border-t border-terminal-border/50" />
            <div className="px-3 py-1 text-[10px] text-terminal-text-dim">
              {contextMenu.lat.toFixed(4)}°, {contextMenu.lng.toFixed(4)}°
            </div>
          </div>
        )}

        {/* HUD: Climate color index */}
        <div className="pointer-events-none absolute bottom-3 left-3">
          <div className="rounded border border-terminal-border bg-black/75 px-2.5 py-2 text-[10px] backdrop-blur-sm">
            <span className="mb-1.5 block font-semibold tracking-wider text-terminal-text">CLIMATE INDEX</span>
            <div className="flex items-center gap-1">
              <span className="text-terminal-text-dim">Cold</span>
              <div className="flex h-2.5 w-36 overflow-hidden rounded-sm">
                <div className="flex-1" style={{ background: "rgb(0,120,255)" }} />
                <div className="flex-1" style={{ background: "rgb(0,200,180)" }} />
                <div className="flex-1" style={{ background: "rgb(0,255,136)" }} />
                <div className="flex-1" style={{ background: "rgb(200,230,0)" }} />
                <div className="flex-1" style={{ background: "rgb(255,184,0)" }} />
                <div className="flex-1" style={{ background: "rgb(255,100,60)" }} />
                <div className="flex-1" style={{ background: "rgb(255,59,92)" }} />
              </div>
              <span className="text-terminal-text-dim">Hot</span>
            </div>
            <div className="mt-1 flex justify-between text-[8px] text-terminal-text-dim/60" style={{ paddingLeft: "24px", paddingRight: "20px" }}>
              <span>&lt;10°</span>
              <span>20°</span>
              <span>30°</span>
              <span>&gt;40°</span>
            </div>
          </div>
        </div>

        {/* HUD: Stats */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-terminal-border bg-black/70 px-2.5 py-1.5 text-[10px] tracking-wide text-terminal-text-dim backdrop-blur-sm">
          POP {countByKind("population")} | CLIMATE {countByKind("climate")}
        </div>

        {/* HUD: Market Hours panel — top-right */}
        {showMarketHUD && (
          <div className="pointer-events-auto absolute right-3 top-3 z-30 max-h-[280px] w-52 overflow-y-auto rounded border border-terminal-border bg-black/85 text-[10px] backdrop-blur-sm">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-terminal-border bg-black/95 px-2.5 py-1.5">
              <span className="font-semibold tracking-wider text-terminal-text">
                MARKET HOURS
              </span>
              <span className="text-terminal-green">
                {openCount} OPEN
              </span>
            </div>
            <div className="px-2 py-1 border-b border-terminal-border/50 text-terminal-text-dim">
              <span className="text-terminal-cyan">{localTzAbbr}</span> {localTime}
            </div>
            <div className="divide-y divide-terminal-border/30">
              {exchangeStatuses.map((es) => (
                <div
                  key={es.exchange.id}
                  className="flex items-center justify-between px-2.5 py-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        es.status === "open"
                          ? "bg-terminal-green shadow-[0_0_4px_rgba(0,255,136,0.5)]"
                          : "bg-terminal-text-dim/40"
                      }`}
                    />
                    <span
                      className={
                        es.status === "open"
                          ? "font-medium text-terminal-green"
                          : "text-terminal-text-dim"
                      }
                    >
                      {es.exchange.shortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-text-dim/70">
                      {es.localTimeStr}
                    </span>
                    <span
                      className={`text-[9px] ${
                        es.status === "open"
                          ? "text-terminal-green/80"
                          : "text-terminal-text-dim/50"
                      }`}
                    >
                      {es.timeUntilChange}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HUD: Status badge */}
        <div className="pointer-events-none absolute left-3 top-3">
          <span className="rounded border border-terminal-green/30 bg-terminal-green/10 px-2 py-0.5 text-[10px] text-terminal-green backdrop-blur-sm">
            LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
