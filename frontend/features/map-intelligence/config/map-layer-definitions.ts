/**
 * Shared map layer catalog consumed by both the 2D (deck.gl) and 3D (globe.gl) engines.
 * Each definition describes how a marker kind should render in each engine.
 */

import type { MarkerKind } from "../types";

export type LayerDefinition = {
  kind: MarkerKind;
  label: string;
  /** deck.gl 2D layer config */
  deck: {
    type: "scatterplot" | "icon" | "geojson";
    getColor: [number, number, number, number];
    getRadius: number;
    radiusScale: number;
    /** Minimum pixels when zoomed out */
    radiusMinPixels: number;
    /** Maximum pixels when zoomed in */
    radiusMaxPixels: number;
  };
  /** globe.gl 3D marker config */
  globe: {
    color: string;
    altitude: number;
    size: number;
  };
};

export const MAP_LAYER_DEFINITIONS: Record<MarkerKind, LayerDefinition> = {
  population: {
    kind: "population",
    label: "Population",
    deck: {
      type: "scatterplot",
      getColor: [132, 219, 160, 220],   // terminal-green
      getRadius: 40000,
      radiusScale: 1,
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
    },
    globe: {
      color: "#84dba0",
      altitude: 0.02,
      size: 1.2,
    },
  },
  climate: {
    kind: "climate",
    label: "Climate Events",
    deck: {
      type: "scatterplot",
      getColor: [233, 188, 116, 180],    // terminal-amber
      getRadius: 60000,
      radiusScale: 1,
      radiusMinPixels: 6,
      radiusMaxPixels: 24,
    },
    globe: {
      color: "#e9bc74",
      altitude: 0.015,
      size: 1.0,
    },
  },
};

export function getLayerDef(kind: MarkerKind): LayerDefinition {
  return MAP_LAYER_DEFINITIONS[kind];
}

export function getAllLayerDefs(): LayerDefinition[] {
  return Object.values(MAP_LAYER_DEFINITIONS);
}
