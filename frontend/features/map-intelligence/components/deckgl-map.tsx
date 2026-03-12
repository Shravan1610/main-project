"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";

import type { ActiveLayers, MapMarker, MapViewport, MarkerKind } from "../types";
import { getLayerDef, MAP_LAYER_DEFINITIONS } from "../config/map-layer-definitions";
import { buildClusterIndex, getClusters } from "../utils/cluster";
import type { ClusterFeature } from "../utils/cluster";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DeckGLMapProps = {
  viewport: MapViewport;
  markers: MapMarker[];
  activeLayers?: ActiveLayers;
  onMarkerSelect?: (marker: MapMarker) => void;
  onContextMenu?: (lngLat: { lat: number; lng: number }) => void;
};

const MARKER_KINDS: MarkerKind[] = ["entity", "exchange", "climate", "news"];

/* ------------------------------------------------------------------ */
/*  Heatmap color ramp:  green → amber → red (terminal palette)       */
/* ------------------------------------------------------------------ */

const HEATMAP_COLOR_RANGE: [number, number, number][] = [
  [0, 40, 20],       // dark green
  [0, 255, 136],     // terminal-green
  [255, 184, 0],     // terminal-amber
  [255, 100, 60],    // amber-red
  [255, 59, 92],     // terminal-red
  [180, 20, 50],     // deep red
];

/* ------------------------------------------------------------------ */
/*  Risk overlay helpers — country fill color from marker density      */
/* ------------------------------------------------------------------ */

const RISK_STOPS: [number, [number, number, number, number]][] = [
  [0, [0, 0, 0, 0]],
  [1, [0, 255, 136, 30]],       // green tint
  [3, [255, 184, 0, 50]],       // amber tint
  [5, [255, 59, 92, 70]],       // red tint
  [10, [255, 59, 92, 110]],     // deep red
];

function riskColor(count: number): [number, number, number, number] {
  for (let i = RISK_STOPS.length - 1; i >= 0; i--) {
    if (count >= RISK_STOPS[i][0]) return RISK_STOPS[i][1];
  }
  return [0, 0, 0, 0];
}

/** Count markers inside a rough bbox from a GeoJSON feature's coordinates */
function countMarkersInFeature(
  feature: GeoJSON.Feature,
  markers: MapMarker[],
): number {
  const bbox = computeBBox(feature);
  if (!bbox) return 0;
  const [minLng, minLat, maxLng, maxLat] = bbox;
  let count = 0;
  for (const m of markers) {
    if (
      m.coordinates.lng >= minLng &&
      m.coordinates.lng <= maxLng &&
      m.coordinates.lat >= minLat &&
      m.coordinates.lat <= maxLat
    ) {
      count++;
    }
  }
  return count;
}

function computeBBox(
  feature: GeoJSON.Feature,
): [number, number, number, number] | null {
  const coords: number[][] = [];
  extractCoords(feature.geometry, coords);
  if (coords.length === 0) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const c of coords) {
    if (c[0] < minLng) minLng = c[0];
    if (c[0] > maxLng) maxLng = c[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[1] > maxLat) maxLat = c[1];
  }
  return [minLng, minLat, maxLng, maxLat];
}

function extractCoords(geom: GeoJSON.Geometry, out: number[][]) {
  if (geom.type === "Point") {
    out.push(geom.coordinates as number[]);
  } else if (geom.type === "MultiPoint" || geom.type === "LineString") {
    for (const c of geom.coordinates) out.push(c as number[]);
  } else if (geom.type === "Polygon" || geom.type === "MultiLineString") {
    for (const ring of geom.coordinates) for (const c of ring) out.push(c as number[]);
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) for (const ring of poly) for (const c of ring) out.push(c as number[]);
  } else if (geom.type === "GeometryCollection") {
    for (const g of geom.geometries) extractCoords(g, out);
  }
}

/* ------------------------------------------------------------------ */
/*  Module-level GeoJSON cache (shared across mounts)                 */
/* ------------------------------------------------------------------ */

let worldGeoJsonCache: GeoJSON.FeatureCollection | null = null;
const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

/* ------------------------------------------------------------------ */
/*  Dark basemap style                                                 */
/* ------------------------------------------------------------------ */

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_ACTIVE: ActiveLayers = {
  entities: true,
  exchanges: true,
  climate: true,
  news: true,
  heatmap: false,
  "risk-overlay": false,
};

export function DeckGLMap({
  viewport,
  markers,
  activeLayers = DEFAULT_ACTIVE,
  onMarkerSelect,
  onContextMenu,
}: DeckGLMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [currentZoom, setCurrentZoom] = useState(viewport.zoom);
  const [currentBounds, setCurrentBounds] = useState<
    [number, number, number, number]
  >([-180, -85, 180, 85]);

  // Climate pulse animation state driven by rAF (throttled to ~20fps)
  const pulseRef = useRef(1.0);
  const rafRef = useRef<number>(0);
  const [pulseScale, setPulseScale] = useState(1.0);

  // World GeoJSON for risk overlay
  const [worldGeo, setWorldGeo] = useState<GeoJSON.FeatureCollection | null>(
    worldGeoJsonCache,
  );

  // Fetch world GeoJSON once
  useEffect(() => {
    if (worldGeoJsonCache) return;
    let cancelled = false;
    fetch(WORLD_GEOJSON_URL)
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (cancelled) return;
        worldGeoJsonCache = data;
        setWorldGeo(data);
      })
      .catch(() => { /* network fail → risk overlay unavailable */ });
    return () => { cancelled = true; };
  }, []);

  // Climate pulse rAF loop — throttled to ~20fps to avoid overwhelming deck.gl
  useEffect(() => {
    let t = 0;
    let lastUpdate = 0;
    const tick = (now: number) => {
      t += 0.03;
      pulseRef.current = 1.0 + 0.8 * Math.abs(Math.sin(t));
      if (now - lastUpdate > 50) {
        lastUpdate = now;
        setPulseScale(pulseRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Build cluster index whenever markers change
  const clusterIndex = useMemo(() => buildClusterIndex(markers), [markers]);

  // Get visible clusters/points for current view
  const features = useMemo(
    () => getClusters(clusterIndex, currentBounds, currentZoom),
    [clusterIndex, currentBounds, currentZoom],
  );

  // Risk overlay: annotate features with marker counts
  const riskFeatures = useMemo(() => {
    if (!worldGeo || !activeLayers["risk-overlay"]) return null;
    const climateAndNews = markers.filter(
      (m) => m.kind === "climate" || m.kind === "news",
    );
    if (climateAndNews.length === 0) return null;
    return {
      ...worldGeo,
      features: worldGeo.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          _riskCount: countMarkersInFeature(f, climateAndNews),
        },
      })),
    } as GeoJSON.FeatureCollection;
  }, [worldGeo, markers, activeLayers]);

  // Build deck.gl layers from clustered features + activeLayers
  const buildLayers = useCallback(() => {
    const clusterFeatures = features.filter((f) => f.properties.cluster);
    const pointFeatures = features.filter((f) => !f.properties.cluster);

    const layers: Layer[] = [];

    // ----- Risk overlay (bottom-most) ----- //
    if (riskFeatures && activeLayers["risk-overlay"]) {
      layers.push(
        new GeoJsonLayer({
          id: "risk-overlay",
          data: riskFeatures,
          filled: true,
          stroked: true,
          getLineColor: [30, 41, 59, 60],
          lineWidthMinPixels: 0.5,
          getFillColor: (f: GeoJSON.Feature) =>
            riskColor((f.properties as Record<string, number>)?._riskCount ?? 0),
          opacity: 0.6,
          pickable: false,
          transitions: { opacity: { duration: 400, type: "interpolation" } },
        }),
      );
    }

    // ----- Heatmap layer ----- //
    if (activeLayers["heatmap"]) {
      const visibleMarkers = markers.filter((m) => {
        const kindKey = m.kind === "entity" ? "entities" : m.kind === "exchange" ? "exchanges" : m.kind;
        return activeLayers[kindKey];
      });
      // Fall back to all markers if none specifically visible
      const heatData = visibleMarkers.length > 0 ? visibleMarkers : markers;
      layers.push(
        new HeatmapLayer<MapMarker>({
          id: "heatmap",
          data: heatData,
          getPosition: (d) => [d.coordinates.lng, d.coordinates.lat] as [number, number],
          getWeight: 1,
          radiusPixels: 60,
          intensity: 1.2,
          threshold: 0.05,
          colorRange: HEATMAP_COLOR_RANGE,
          opacity: 0.7,
        }),
      );
    }

    // ----- Cluster circles ----- //
    if (clusterFeatures.length > 0) {
      layers.push(
        new ScatterplotLayer<ClusterFeature>({
          id: "clusters",
          data: clusterFeatures,
          getPosition: (d) => d.geometry.coordinates as [number, number],
          getRadius: (d) =>
            Math.min(20, 8 + Math.sqrt(d.properties.point_count ?? 1) * 3),
          getFillColor: [132, 219, 160, 160],
          getLineColor: [132, 219, 160, 255],
          lineWidthMinPixels: 1,
          stroked: true,
          radiusUnits: "pixels",
          pickable: true,
          onClick: (info) => {
            if (
              info.object?.properties.cluster_id !== undefined &&
              mapRef.current
            ) {
              try {
                const expansionZoom = clusterIndex.getClusterExpansionZoom(
                  info.object.properties.cluster_id,
                );
                mapRef.current.flyTo({
                  center: info.object.geometry.coordinates as [number, number],
                  zoom: Math.min(expansionZoom, 16),
                  duration: 500,
                });
              } catch {
                // Ignore cluster expansion errors
              }
            }
          },
        }),
      );

      layers.push(
        new TextLayer<ClusterFeature>({
          id: "cluster-labels",
          data: clusterFeatures,
          getPosition: (d) => d.geometry.coordinates as [number, number],
          getText: (d) => String(d.properties.point_count ?? ""),
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getTextAnchor: "middle" as const,
          getAlignmentBaseline: "center" as const,
          fontFamily: "monospace",
          fontWeight: "bold",
        }),
      );
    }

    // ----- Individual marker layers per kind with opacity transitions ----- //
    const byKind = new Map<string, ClusterFeature[]>();
    for (const f of pointFeatures) {
      const kind = f.properties.marker?.kind ?? "entity";
      if (!byKind.has(kind)) byKind.set(kind, []);
      byKind.get(kind)!.push(f);
    }

    for (const kind of MARKER_KINDS) {
      const kindFeatures = byKind.get(kind) ?? [];
      if (kindFeatures.length === 0) continue;

      const def = getLayerDef(kind);
      // Map marker kind → activeLayers key
      const kindToLayerKey: Record<string, string> = {
        entity: "entities",
        exchange: "exchanges",
      };
      const layerKey = kindToLayerKey[kind] ?? kind;
      const isActive = activeLayers[layerKey] ?? false;

      layers.push(
        new ScatterplotLayer<ClusterFeature>({
          id: `markers-${kind}`,
          data: kindFeatures,
          getPosition: (d) => d.geometry.coordinates as [number, number],
          getFillColor: def.deck.getColor,
          getLineColor: [255, 255, 255, 80],
          getRadius: def.deck.getRadius,
          radiusScale: def.deck.radiusScale,
          radiusMinPixels: def.deck.radiusMinPixels,
          radiusMaxPixels: def.deck.radiusMaxPixels,
          lineWidthMinPixels: 1,
          stroked: true,
          pickable: isActive,
          opacity: isActive ? 1.0 : 0.0,
          transitions: { opacity: { duration: 300, type: "interpolation" } },
          onClick: (info) => {
            const marker = info.object?.properties.marker;
            if (marker && onMarkerSelect) onMarkerSelect(marker);
          },
        }),
      );

      // Climate pulse ring effect
      if (kind === "climate" && isActive) {
        const pulseColor: [number, number, number, number] = [
          def.deck.getColor[0],
          def.deck.getColor[1],
          def.deck.getColor[2],
          Math.max(0, Math.round(120 * (1.0 / pulseScale))),
        ];
        layers.push(
          new ScatterplotLayer<ClusterFeature>({
            id: "climate-pulse",
            data: kindFeatures,
            getPosition: (d) => d.geometry.coordinates as [number, number],
            getFillColor: [0, 0, 0, 0],
            getLineColor: pulseColor,
            getRadius: def.deck.getRadius * pulseScale,
            radiusScale: def.deck.radiusScale,
            radiusMinPixels: def.deck.radiusMinPixels * pulseScale,
            radiusMaxPixels: def.deck.radiusMaxPixels * 2.5,
            lineWidthMinPixels: 2,
            stroked: true,
            filled: false,
            pickable: false,
            opacity: 0.8,
          }),
        );
      }
    }

    return layers;
  }, [
    features,
    clusterIndex,
    onMarkerSelect,
    activeLayers,
    markers,
    riskFeatures,
    pulseScale,
  ]);

  const getSafeLayers = useCallback((): Layer[] => {
    return buildLayers().filter((layer): layer is Layer => {
      return Boolean(
        layer &&
        typeof layer === "object" &&
        "id" in layer &&
        typeof layer.id === "string" &&
        layer.id.length > 0,
      );
    });
  }, [buildLayers]);

  // Initialize MapLibre + deck.gl overlay
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [viewport.center[1], viewport.center[0]],
      zoom: viewport.zoom,
      minZoom: 0.5,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: getSafeLayers(),
    });

    map.addControl(overlay as unknown as maplibregl.IControl);

    map.on("moveend", () => {
      const bounds = map.getBounds();
      setCurrentBounds([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);
      setCurrentZoom(map.getZoom());
    });

    map.on("load", () => {
      const bounds = map.getBounds();
      setCurrentBounds([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);
      setCurrentZoom(map.getZoom());
    });

    map.on("contextmenu", (e) => {
      e.preventDefault();
      onContextMenu?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;
    overlayRef.current = overlay;

    return () => {
      overlay.setProps({ layers: [] });
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync deck.gl layers when data changes
  useEffect(() => {
    if (overlayRef.current) {
      try {
        overlayRef.current.setProps({ layers: getSafeLayers() });
      } catch {
        // Ignore transient deck.gl render errors during rapid layer updates
      }
    }
  }, [getSafeLayers]);

  // Fly to new viewport when props change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [viewport.center[1], viewport.center[0]],
        zoom: viewport.zoom,
        duration: 800,
      });
    }
  }, [viewport.center, viewport.zoom]);

  return <div ref={containerRef} className="h-full w-full" />;
}
