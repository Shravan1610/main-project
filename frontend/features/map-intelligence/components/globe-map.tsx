"use client";

import { useEffect, useRef, useState } from "react";
import GlobeGL from "globe.gl";
import type { GlobeInstance } from "globe.gl";

import type { ActiveLayers, ClimateHeatmapPoint, MapMarker, MapViewport } from "../types";
import { getLayerDef } from "../config/map-layer-definitions";
import { getAllExchangeStatuses, type ExchangeStatusInfo } from "../utils/market-hours";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GlobeMapProps = {
  viewport: MapViewport;
  markers: MapMarker[];
  activeLayers?: ActiveLayers;
  onMarkerSelect?: (marker: MapMarker) => void;
  climateHeatmap?: ClimateHeatmapPoint[];
};

const DEFAULT_ACTIVE: ActiveLayers = {
  population: true,
  climate: true,
  heatmap: true,
  "risk-overlay": false,
};

/* ------------------------------------------------------------------ */
/*  Heatmap blob color palette (translucent, large radius)            */
/* ------------------------------------------------------------------ */

const HEATMAP_BLOB_COLORS: Record<string, string> = {
  population: "rgba(132,219,160,0.35)",
  climate: "rgba(233,188,116,0.40)",
};

/* ------------------------------------------------------------------ */
/*  Risk overlay color from marker density                             */
/* ------------------------------------------------------------------ */

function computeRiskColor(count: number): string {
  if (count === 0) return "rgba(0,0,0,0)";
  if (count <= 1) return "rgba(0,255,136,0.12)";
  if (count <= 3) return "rgba(255,184,0,0.20)";
  if (count <= 5) return "rgba(255,59,92,0.28)";
  return "rgba(255,59,92,0.45)";
}

function countMarkersInBBox(
  bbox: [number, number, number, number],
  markers: MapMarker[],
): number {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  let count = 0;
  for (const m of markers) {
    if (
      m.coordinates.lng >= minLng &&
      m.coordinates.lng <= maxLng &&
      m.coordinates.lat >= minLat &&
      m.coordinates.lat <= maxLat
    ) count++;
  }
  return count;
}

function featureBBox(
  feature: GeoJSON.Feature,
): [number, number, number, number] | null {
  const coords: number[][] = [];
  extractCoords(feature.geometry, coords);
  if (coords.length === 0) return null;
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const c of coords) {
    if (c[0] < minLng) minLng = c[0];
    if (c[0] > maxLng) maxLng = c[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[1] > maxLat) maxLat = c[1];
  }
  return [minLng, minLat, maxLng, maxLat];
}

function extractCoords(geom: GeoJSON.Geometry, out: number[][]) {
  if (geom.type === "Point") out.push(geom.coordinates as number[]);
  else if (geom.type === "MultiPoint" || geom.type === "LineString")
    for (const c of geom.coordinates) out.push(c as number[]);
  else if (geom.type === "Polygon" || geom.type === "MultiLineString")
    for (const ring of geom.coordinates)
      for (const c of ring) out.push(c as number[]);
  else if (geom.type === "MultiPolygon")
    for (const poly of geom.coordinates)
      for (const ring of poly) for (const c of ring) out.push(c as number[]);
  else if (geom.type === "GeometryCollection")
    for (const g of geom.geometries) extractCoords(g, out);
}

/* ------------------------------------------------------------------ */
/*  Module-level GeoJSON cache                                         */
/* ------------------------------------------------------------------ */

let worldGeoJsonCache: GeoJSON.FeatureCollection | null = null;
const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

const DEFAULT_COUNTRY_FILL = "rgba(200,210,220,0.25)";
const DEFAULT_COUNTRY_STROKE = "rgba(180,190,200,0.20)";

/* ------------------------------------------------------------------ */
/*  Climate choropleth helpers                                         */
/* ------------------------------------------------------------------ */

function temperatureToRgba(weight: number): string {
  if (weight < 0.25) return "rgba(0,120,255,0.40)";     // cold — blue
  if (weight < 0.4)  return "rgba(0,200,180,0.40)";     // cool — teal
  if (weight < 0.55) return "rgba(0,255,136,0.40)";     // mild — green
  if (weight < 0.65) return "rgba(200,230,0,0.40)";     // warm — yellow-green
  if (weight < 0.75) return "rgba(255,184,0,0.40)";     // warm — amber
  if (weight < 0.85) return "rgba(255,100,60,0.45)";    // hot — orange
  return "rgba(255,59,92,0.50)";                          // very hot — red
}

function degDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

function nearestClimateWeight(
  centroidLat: number,
  centroidLng: number,
  climateData: ClimateHeatmapPoint[],
): number {
  let minDist = Infinity;
  let weight = 0.5;
  for (const p of climateData) {
    const d = degDist(centroidLat, centroidLng, p.lat, p.lng);
    if (d < minDist) {
      minDist = d;
      weight = p.weight;
    }
  }
  return weight;
}

function computeCentroid(feature: GeoJSON.Feature): [number, number] | null {
  const coords: number[][] = [];
  extractCoords(feature.geometry, coords);
  if (coords.length === 0) return null;
  let sumLat = 0, sumLng = 0;
  for (const c of coords) {
    sumLng += c[0];
    sumLat += c[1];
  }
  return [sumLat / coords.length, sumLng / coords.length];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function kindToLayerKey(kind: string): string {
  if (kind === "population") return "population";
  return kind;
}

/** Convert our zoom level (1–18) to globe.gl altitude (~4.0 to ~0.05). */
function zoomToAltitude(zoom: number): number {
  return Math.max(0.05, 4 / Math.pow(1.5, zoom - 1));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GlobeMap({
  viewport,
  markers,
  activeLayers = DEFAULT_ACTIVE,
  onMarkerSelect,
  climateHeatmap,
}: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLayersRef = useRef(activeLayers);
  const [worldGeoJson, setWorldGeoJson] =
    useState<GeoJSON.FeatureCollection | null>(worldGeoJsonCache);
  activeLayersRef.current = activeLayers;

  // Market hours status (updated every 30s)
  const [exchangeStatuses, setExchangeStatuses] = useState<ExchangeStatusInfo[]>(
    () => getAllExchangeStatuses(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setExchangeStatuses(getAllExchangeStatuses());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ---- Initialize globe ---- //
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let pauseRotation: (() => void) | null = null;

    const initGlobe = (w: number, h: number) => {
      if (globeRef.current) return;

      const globe = new GlobeGL(container)
        .globeImageUrl(
          "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
        )
        .bumpImageUrl(
          "https://unpkg.com/three-globe/example/img/earth-topology.png",
        )
        .backgroundColor("rgba(11, 15, 22, 1)")
        .showAtmosphere(true)
        .atmosphereColor("rgba(136, 198, 245, 0.3)")
        .atmosphereAltitude(0.12)
        .width(w)
        .height(h)
        .pointOfView({
          lat: viewport.center[0],
          lng: viewport.center[1],
          altitude: zoomToAltitude(viewport.zoom),
        });

      // Optimise renderer for all devices
      const renderer = globe.renderer();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h);

      // ---- Auto-rotation ---- //
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;

      pauseRotation = () => {
        controls.autoRotate = false;
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          controls.autoRotate = true;
        }, 5000);
      };

      container.addEventListener("pointerdown", pauseRotation);
      container.addEventListener("wheel", pauseRotation);

      globeRef.current = globe;
    };

    // ---- ResizeObserver: init on first real dimensions, then resize ---- //
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: rw, height: rh } = entry.contentRect;
        if (rw > 0 && rh > 0) {
          if (!globeRef.current) {
            initGlobe(rw, rh);
          } else {
            globeRef.current.width(rw).height(rh);
            globeRef.current.renderer().setSize(rw, rh);
          }
        }
      }
    });
    ro.observe(container);

    // Try to init immediately if container already has dimensions
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) initGlobe(w, h);

    // ---- Fetch world GeoJSON ---- //
    if (!worldGeoJsonCache) {
      fetch(WORLD_GEOJSON_URL)
        .then((r) => r.json())
        .then((data: GeoJSON.FeatureCollection) => {
          worldGeoJsonCache = data;
          setWorldGeoJson(data);
        })
        .catch(() => {});
    } else {
      setWorldGeoJson(worldGeoJsonCache);
    }

    return () => {
      ro.disconnect();
      if (pauseRotation) {
        container.removeEventListener("pointerdown", pauseRotation);
        container.removeEventListener("wheel", pauseRotation);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Update marker data (including market hour markers) ---- //
  useEffect(() => {
    if (!globeRef.current) return;

    // Build combined data: regular markers + market hours (if enabled)
    const showMarketHours = activeLayersRef.current["market-hours"] ?? false;
    type MarkerOrExchange = { type: "marker"; data: MapMarker } | { type: "exchange"; data: ExchangeStatusInfo };

    const combined: MarkerOrExchange[] = markers.map((m) => ({ type: "marker" as const, data: m }));
    if (showMarketHours) {
      for (const es of exchangeStatuses) {
        combined.push({ type: "exchange" as const, data: es });
      }
    }

    globeRef.current
      .htmlElementsData(combined)
      .htmlLat((d: unknown) => {
        const item = d as MarkerOrExchange;
        return item.type === "marker"
          ? item.data.coordinates.lat
          : item.data.exchange.coordinates.lat;
      })
      .htmlLng((d: unknown) => {
        const item = d as MarkerOrExchange;
        return item.type === "marker"
          ? item.data.coordinates.lng
          : item.data.exchange.coordinates.lng;
      })
      .htmlAltitude((d: unknown) => {
        const item = d as MarkerOrExchange;
        if (item.type === "exchange") return 0.03;
        return getLayerDef(item.data.kind).globe.altitude;
      })
      .htmlElement((d: unknown) => {
        const item = d as MarkerOrExchange;

        if (item.type === "exchange") {
          const es = item.data;
          const isOpen = es.status === "open";
          const el = document.createElement("div");
          el.className = "globe-marker globe-exchange-marker";
          el.dataset.kind = "market-hours";
          el.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            pointer-events: none;
            opacity: 1;
          `;

          // Dot
          const dot = document.createElement("div");
          dot.style.cssText = `
            width: ${isOpen ? 14 : 10}px;
            height: ${isOpen ? 14 : 10}px;
            border-radius: 50%;
            background: ${isOpen ? "#00ff88" : "rgba(120,120,140,0.7)"};
            border: 1.5px solid ${isOpen ? "rgba(0,255,136,0.6)" : "rgba(80,80,100,0.5)"};
            box-shadow: ${isOpen ? "0 0 12px rgba(0,255,136,0.5)" : "none"};
          `;

          // Label
          const label = document.createElement("div");
          label.style.cssText = `
            font-family: monospace;
            font-size: 9px;
            font-weight: bold;
            color: ${isOpen ? "#00ff88" : "rgba(150,150,170,0.8)"};
            text-shadow: 0 0 4px rgba(0,0,0,0.8);
            white-space: nowrap;
            text-align: center;
          `;
          label.textContent = `${es.exchange.shortName}`;

          el.appendChild(dot);
          el.appendChild(label);

          // Pulse ring for open
          if (isOpen) {
            const ring = document.createElement("div");
            ring.style.cssText = `
              position: absolute;
              top: 0; left: 50%;
              transform: translateX(-50%);
              width: 14px;
              height: 14px;
              border-radius: 50%;
              border: 2px solid #00ff88;
              animation: globe-pulse 2s ease-out infinite;
              pointer-events: none;
            `;
            el.appendChild(ring);
          }

          return el;
        }

        // Regular marker
        const marker = item.data;
        const def = getLayerDef(marker.kind);
        const layerKey = kindToLayerKey(marker.kind);
        const isActive = activeLayersRef.current[layerKey] ?? false;

        const el = document.createElement("div");
        el.className = "globe-marker";
        el.dataset.kind = marker.kind;
        el.style.cssText = `
          width: ${def.globe.size * 10}px;
          height: ${def.globe.size * 10}px;
          border-radius: 50%;
          background: ${def.globe.color};
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 8px ${def.globe.color}80;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          opacity: ${isActive ? 1 : 0};
          pointer-events: ${isActive ? "auto" : "none"};
          animation: globe-marker-in 0.3s ease-out forwards;
        `;

        el.title = marker.label;
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.5)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });
        el.addEventListener("click", () => {
          onMarkerSelect?.(marker);
        });

        // Climate pulse ring
        if (marker.kind === "climate") {
          const ring = document.createElement("div");
          ring.className = "globe-marker-ring";
          ring.style.cssText = `
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid ${def.globe.color};
            animation: globe-pulse 2s ease-out infinite;
            pointer-events: none;
          `;
          el.appendChild(ring);
        }

        return el;
      });
  }, [markers, onMarkerSelect, exchangeStatuses]);

  // ---- Layer visibility toggle — animate opacity ---- //
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    for (const kind of ["population", "climate"] as const) {
      const layerKey = kindToLayerKey(kind);
      const isActive = activeLayers[layerKey] ?? false;
      const els = container.querySelectorAll<HTMLElement>(
        `.globe-marker[data-kind="${kind}"]`,
      );
      for (const el of els) {
        el.style.opacity = isActive ? "1" : "0";
        el.style.pointerEvents = isActive ? "auto" : "none";
      }
    }

    // Toggle market-hours markers
    const showMarketHours = activeLayers["market-hours"] ?? false;
    const marketEls = container.querySelectorAll<HTMLElement>(
      `.globe-marker[data-kind="market-hours"]`,
    );
    for (const el of marketEls) {
      el.style.opacity = showMarketHours ? "1" : "0";
    }
  }, [activeLayers]);

  // ---- Heatmap: choropleth via polygon fills (climate-bounded to country borders) ---- //
  // (handled in the country polygons useEffect below — no separate pointsData needed)
  useEffect(() => {
    if (!globeRef.current) return;
    // Clear pointsData since heatmap is now choropleth-based
    globeRef.current.pointsData([]);
  }, [activeLayers, climateHeatmap]);

  // ---- Country polygons: climate choropleth when heatmap active, risk tint when enabled ---- //
  useEffect(() => {
    if (!globeRef.current) return;
    if (!worldGeoJson) return;

    const riskMarkers = markers.filter(
      (m) => m.kind === "climate",
    );
    const riskOverlayEnabled = activeLayers["risk-overlay"];
    const heatmapEnabled = activeLayers["heatmap"];
    const hasClimateData = climateHeatmap && climateHeatmap.length > 0;

    const features = worldGeoJson.features.map((f) => {
      const bbox = featureBBox(f);
      const count = bbox ? countMarkersInBBox(bbox, riskMarkers) : 0;
      const centroid = computeCentroid(f);
      const climateWeight = centroid && hasClimateData
        ? nearestClimateWeight(centroid[0], centroid[1], climateHeatmap)
        : 0.5;
      return {
        ...f,
        properties: { ...f.properties, _riskCount: count, _climateWeight: climateWeight },
      };
    });

    globeRef.current
      .polygonsData(features)
      .polygonGeoJsonGeometry(
        ((d: unknown) => (d as GeoJSON.Feature).geometry) as any,
      )
      .polygonCapColor((d: unknown) => {
        const props = (d as GeoJSON.Feature).properties as Record<string, number>;

        // Climate choropleth takes priority when heatmap is active
        if (heatmapEnabled && hasClimateData) {
          return temperatureToRgba(props?._climateWeight ?? 0.5);
        }

        if (riskOverlayEnabled) {
          const riskColor = computeRiskColor(props?._riskCount ?? 0);
          return riskColor === "rgba(0,0,0,0)" ? DEFAULT_COUNTRY_FILL : riskColor;
        }

        return DEFAULT_COUNTRY_FILL;
      })
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor(() =>
        heatmapEnabled && hasClimateData
          ? "rgba(255,255,255,0.12)"
          : riskOverlayEnabled
            ? "rgba(255,255,255,0.18)"
            : DEFAULT_COUNTRY_STROKE,
      )
      .polygonAltitude(0.004);
  }, [activeLayers, markers, worldGeoJson, climateHeatmap]);

  // ---- Fly to viewport changes ---- //
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView(
      {
        lat: viewport.center[0],
        lng: viewport.center[1],
        altitude: zoomToAltitude(viewport.zoom),
      },
      800,
    );
  }, [viewport.center, viewport.zoom]);

  return <div ref={containerRef} className="h-full w-full" />;
}
