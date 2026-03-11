// frontend/features/layer-controls/components/layer-panel.tsx
// Layer toggle panel — list of toggleable map layers
//
// Owner: Srijan
// Task: SR-2-03
// Phase: 2 — Core UI
//
// Props: uses useLayers hook
// Renders: floating panel with toggle switches per layer
// Behavior: positioned bottom-left of map, collapsible

"use client";

import { useEffect, useState } from "react";

import { LayerToggle } from "./layer-toggle";
import type { LayerConfig } from "../types";

type LayerPanelProps = {
  layers?: LayerConfig[];
  onToggle?: (id: LayerConfig["id"]) => void;
};

export function LayerPanel({ layers = [], onToggle }: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [localLayers, setLocalLayers] = useState<LayerConfig[]>(layers);

  useEffect(() => {
    setLocalLayers(layers);
  }, [layers]);

  const handleToggle = (id: LayerConfig["id"]) => {
    setLocalLayers((previous) =>
      previous.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              enabled: !layer.enabled,
            }
          : layer,
      ),
    );

    onToggle?.(id);
  };

  return (
    <div className="w-56 rounded-xl border border-terminal-border bg-terminal-surface/92 p-2.5 shadow-glow backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-terminal-text">Layers</p>
        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          className="text-xs text-terminal-text-dim hover:text-terminal-text"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed ? (
        <div className="space-y-1">
          {localLayers.length === 0 ? (
            <p className="px-2 py-1 text-xs text-terminal-text-dim">No layers available.</p>
          ) : (
            localLayers.map((layer) => (
              <LayerToggle key={layer.id} layer={layer} onToggle={() => handleToggle(layer.id)} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
