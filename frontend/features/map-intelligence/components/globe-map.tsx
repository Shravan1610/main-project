"use client";

import { useEffect, useRef } from "react";
import GlobeGL from "globe.gl";
import type { GlobeInstance } from "globe.gl";

import type { ActiveLayers, MapMarker, MapViewport } from "../types";
import { getLayerDef } from "../config/map-layer-definitions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GlobeMapProps = {
  viewport: MapViewport;
  markers: MapMarker[];
  activeLayers?: ActiveLayers;
  onMarkerSelect?: (marker: MapMarker) => void;
};

const DEFAULT_ACTIVE: ActiveLayers = {
  entities: true,
  exchanges: false,
  climate: false,
  news: false,
  heatmap: false,
  "risk-overlay": false,
};

/* ------------------------------------------------------------------ */
/*  Heatmap blob color palette (translucent, large radius)            */
/* ------------------------------------------------------------------ */

const HEATMAP_BLOB_COLORS: Record<string, string> = {
  entity: "rgba(132,219,160,0.35)",
  exchange: "rgba(136,198,245,0.35)",
  climate: "rgba(233,188,116,0.40)",
  news: "rgba(234,123,120,0.35)",
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function kindToLayerKey(kind: string): string {
  if (kind === "entity") return "entities";
  if (kind === "exchange") return "exchanges";
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
}: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLayersRef = useRef(activeLayers);
  activeLayersRef.current = activeLayers;

  // ---- Initialize globe ---- //
  useEffect(() => {
    if (!containerRef.current || globeRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const globe = new GlobeGL(containerRef.current)
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-dark.jpg",
      )
      .bumpImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-topology.png",
      )
      .backgroundImageUrl(
        "https://unpkg.com/three-globe/example/img/night-sky.png",
      )
      .showAtmosphere(true)
      .atmosphereColor("#1a237e")
      .atmosphereAltitude(0.15)
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

    const pauseRotation = () => {
      controls.autoRotate = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        controls.autoRotate = true;
      }, 5000);
    };

    const el = containerRef.current;
    el.addEventListener("pointerdown", pauseRotation);
    el.addEventListener("wheel", pauseRotation);

    globeRef.current = globe;

    // ---- ResizeObserver ---- //
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: rw, height: rh } = entry.contentRect;
        if (rw > 0 && rh > 0 && globeRef.current) {
          globeRef.current.width(rw).height(rh);
          globeRef.current.renderer().setSize(rw, rh);
        }
      }
    });
    ro.observe(containerRef.current);

    // ---- Fetch world GeoJSON ---- //
    if (!worldGeoJsonCache) {
      fetch(WORLD_GEOJSON_URL)
        .then((r) => r.json())
        .then((data: GeoJSON.FeatureCollection) => {
          worldGeoJsonCache = data;
        })
        .catch(() => {});
    }

    return () => {
      ro.disconnect();
      el.removeEventListener("pointerdown", pauseRotation);
      el.removeEventListener("wheel", pauseRotation);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Update marker data ---- //
  useEffect(() => {
    if (!globeRef.current) return;

    globeRef.current
      .htmlElementsData(markers)
      .htmlLat((d: unknown) => (d as MapMarker).coordinates.lat)
      .htmlLng((d: unknown) => (d as MapMarker).coordinates.lng)
      .htmlAltitude((d: unknown) => {
        const marker = d as MapMarker;
        return getLayerDef(marker.kind).globe.altitude;
      })
      .htmlElement((d: unknown) => {
        const marker = d as MapMarker;
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
  }, [markers, onMarkerSelect]);

  // ---- Layer visibility toggle — animate opacity ---- //
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    for (const kind of ["entity", "exchange", "climate", "news"] as const) {
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
  }, [activeLayers]);

  // ---- Heatmap: pointsData blobs ---- //
  useEffect(() => {
    if (!globeRef.current) return;

    if (activeLayers["heatmap"]) {
      const visibleMarkers = markers.filter((m) => {
        const key = kindToLayerKey(m.kind);
        return activeLayers[key];
      });
      const data = visibleMarkers.length > 0 ? visibleMarkers : markers;

      globeRef.current
        .pointsData(data)
        .pointLat((d: unknown) => (d as MapMarker).coordinates.lat)
        .pointLng((d: unknown) => (d as MapMarker).coordinates.lng)
        .pointAltitude(0.0)
        .pointRadius(3.5)
        .pointColor(
          (d: unknown) =>
            HEATMAP_BLOB_COLORS[(d as MapMarker).kind] ??
            "rgba(255,255,255,0.2)",
        );
    } else {
      globeRef.current.pointsData([]);
    }
  }, [activeLayers, markers]);

  // ---- Risk overlay: polygonsData choropleth ---- //
  useEffect(() => {
    if (!globeRef.current) return;

    if (activeLayers["risk-overlay"] && worldGeoJsonCache) {
      const riskMarkers = markers.filter(
        (m) => m.kind === "climate" || m.kind === "news",
      );
      const features = worldGeoJsonCache.features.map((f) => {
        const bbox = featureBBox(f);
        const count = bbox ? countMarkersInBBox(bbox, riskMarkers) : 0;
        return { ...f, properties: { ...f.properties, _riskCount: count } };
      });

      globeRef.current
        .polygonsData(features)
        .polygonGeoJsonGeometry(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((d: unknown) => (d as GeoJSON.Feature).geometry) as any,
        )
        .polygonCapColor(
          (d: unknown) =>
            computeRiskColor(
              ((d as GeoJSON.Feature).properties as Record<string, number>)
                ?._riskCount ?? 0,
            ),
        )
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor(() => "rgba(30,41,59,0.25)")
        .polygonAltitude(0.006);
    } else {
      globeRef.current.polygonsData([]);
    }
  }, [activeLayers, markers]);

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
