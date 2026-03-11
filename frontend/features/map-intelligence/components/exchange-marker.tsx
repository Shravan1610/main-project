// frontend/features/map-intelligence/components/exchange-marker.tsx
// Stock exchange marker — renders exchange location on map
//
// Owner: Srijan
// Task: SR-3-01
// Phase: 3 — Layers
//
// Props: { exchange: ExchangeMarkerData }
// Renders: custom Leaflet marker with exchange icon and popup

import type { MapMarker } from "../types";

type ExchangeMarkerProps = {
  marker: MapMarker;
};

export function ExchangeMarker({ marker }: ExchangeMarkerProps) {
  return (
    <div className="rounded border border-terminal-text-dim/50 bg-terminal-surface px-2 py-1 text-xs text-terminal-text">
      {marker.label}
    </div>
  );
}
