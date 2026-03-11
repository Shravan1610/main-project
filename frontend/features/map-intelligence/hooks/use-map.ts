// frontend/features/map-intelligence/hooks/use-map.ts
// Hook for map viewport and interaction management
//
// Owner: Srijan
// Task: SR-1-15
// Phase: 1 — Scaffolding
//
// Expected hook:
//   useMap() => {
//     viewport: { center: [lat, lng], zoom: number },
//     setViewport, flyTo, fitBounds,
//     markers: MapMarker[], setMarkers
//   }

"use client";

import { useMemo, useState } from "react";

import type { MapMarker, MapViewport } from "../types";

const DEFAULT_VIEWPORT: MapViewport = {
  center: [20, 0],
  zoom: 2,
};

export function useMap(initialViewport: MapViewport = DEFAULT_VIEWPORT) {
  const [viewport, setViewport] = useState<MapViewport>(initialViewport);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const flyTo = (center: [number, number], zoom: number = viewport.zoom) => {
    setViewport({ center, zoom });
  };

  const fitBounds = (points: Array<[number, number]>) => {
    if (points.length === 0) {
      return;
    }

    const lat = points.reduce((total, point) => total + point[0], 0) / points.length;
    const lng = points.reduce((total, point) => total + point[1], 0) / points.length;
    setViewport({ center: [lat, lng], zoom: points.length > 1 ? 3 : viewport.zoom });
  };

  const markerCount = useMemo(() => markers.length, [markers]);

  return {
    viewport,
    markers,
    markerCount,
    setViewport,
    setMarkers,
    flyTo,
    fitBounds,
  };
}
