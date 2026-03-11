"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MapViewport } from "../types";

type UrlMapState = {
  center?: [number, number];
  zoom?: number;
  layers?: string[];
  engine?: "2d" | "3d";
};

export function parseMapUrlState(): UrlMapState {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const result: UrlMapState = {};

  const lat = params.get("lat");
  const lng = params.get("lng");
  if (lat && lng) {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (Number.isFinite(latN) && Number.isFinite(lngN)) {
      result.center = [
        Math.max(-90, Math.min(90, latN)),
        Math.max(-180, Math.min(180, lngN)),
      ];
    }
  }

  const zoom = params.get("z");
  if (zoom) {
    const zN = parseFloat(zoom);
    if (Number.isFinite(zN) && zN >= 0 && zN <= 20) {
      result.zoom = zN;
    }
  }

  const layers = params.get("layers");
  if (layers) {
    result.layers = layers.split(",").filter(Boolean);
  }

  const engine = params.get("engine");
  if (engine === "2d" || engine === "3d") {
    result.engine = engine;
  }

  return result;
}

export function useUrlMapState(
  viewport: MapViewport,
  activeLayers: Record<string, boolean>,
  engine: "2d" | "3d",
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const syncToUrl = useCallback(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    params.set("lat", viewport.center[0].toFixed(2));
    params.set("lng", viewport.center[1].toFixed(2));
    params.set("z", viewport.zoom.toFixed(1));

    const enabledLayers = Object.entries(activeLayers)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
    if (enabledLayers.length > 0) {
      params.set("layers", enabledLayers.join(","));
    }

    if (engine !== "2d") {
      params.set("engine", engine);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [viewport, activeLayers, engine]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(syncToUrl, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [syncToUrl]);
}
