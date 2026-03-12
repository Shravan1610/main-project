// frontend/features/layer-controls/hooks/use-layers.ts
// Hook for layer toggle state — manages which layers are visible
//
// Owner: Srijan
// Task: SR-2-01
// Phase: 2 — Core UI
//
// Expected hook:
//   useLayers() => {
//     layers: LayerConfig[], toggleLayer(id: LayerType): void,
//     isLayerActive(id: LayerType): boolean
//   }
//   Default: all layers off except a reasonable default set

"use client";

import { useMemo, useState } from "react";

import type { LayerConfig, LayerType } from "../types";

const DEFAULT_LAYERS: LayerConfig[] = [
  { id: "population", label: "Population", icon: "●", enabled: true },
  { id: "climate", label: "Climate", icon: "⚠", enabled: true },
  { id: "heatmap", label: "Heatmap", icon: "▒", enabled: true },
  { id: "risk-overlay", label: "Risk Overlay", icon: "△", enabled: false },
  { id: "market-hours", label: "Market Hours", icon: "◷", enabled: true },
];

export function useLayers(initialLayers: LayerConfig[] = DEFAULT_LAYERS) {
  const [layers, setLayers] = useState<LayerConfig[]>(initialLayers);

  const toggleLayer = (id: LayerType) => {
    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              enabled: !layer.enabled,
            }
          : layer,
      ),
    );
  };

  const isLayerActive = useMemo(() => {
    return (id: LayerType) => layers.some((layer) => layer.id === id && layer.enabled);
  }, [layers]);

  return { layers, setLayers, toggleLayer, isLayerActive };
}
