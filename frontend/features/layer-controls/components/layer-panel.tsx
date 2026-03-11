// frontend/features/layer-controls/components/layer-panel.tsx
// Layer toggle panel — list of toggleable map layers
//
// Owner: Srijan
// Task: SR-2-02
// Phase: 2 — Core UI
//
// Props: uses useLayers hook
// Renders: floating panel with toggle switches per layer
// Behavior: positioned bottom-left of map, collapsible

"use client";

import { useState } from "react";

import { LayerToggle } from "./layer-toggle";
import type { LayerConfig } from "../types";

type LayerPanelProps = {
  layers: LayerConfig[];
  onToggle: (id: LayerConfig["id"]) => void;
};

export function LayerPanel({ layers, onToggle }: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-56 rounded-md border border-terminal-border bg-terminal-surface/90 p-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-terminal-text">Layers</p>
        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          className="text-xs text-terminal-text-dim"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed ? (
        <div className="space-y-1">
          {layers.map((layer) => (
            <LayerToggle key={layer.id} layer={layer} onToggle={() => onToggle(layer.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
