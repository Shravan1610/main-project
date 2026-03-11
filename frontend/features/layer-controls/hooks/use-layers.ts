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
  { id: "entities", label: "Entities", icon: "●", enabled: true },
  { id: "exchanges", label: "Exchanges", icon: "▣", enabled: false },
  { id: "climate", label: "Climate", icon: "⚠", enabled: false },
  { id: "news", label: "News", icon: "◉", enabled: false },
  { id: "heatmap", label: "Heatmap", icon: "▒", enabled: false },
  { id: "risk-overlay", label: "Risk Overlay", icon: "△", enabled: false },
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
