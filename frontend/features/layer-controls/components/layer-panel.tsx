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

import { useEffect, useMemo, useState } from "react";

import { LayerToggle } from "./layer-toggle";
import type { LayerConfig } from "../types";

const LAYER_SYNONYMS: Record<string, string[]> = {
  entities: ["entity", "company", "companies"],
  exchanges: ["exchange", "stock", "market"],
  climate: ["weather", "temperature", "environment"],
  news: ["articles", "events", "press"],
  heatmap: ["heat", "density", "concentration"],
  "risk-overlay": ["risk", "danger", "vulnerability", "overlay"],
};

type LayerPanelProps = {
  layers?: LayerConfig[];
  onToggle?: (id: LayerConfig["id"]) => void;
};

export function LayerPanel({ layers = [], onToggle }: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [localLayers, setLocalLayers] = useState<LayerConfig[]>(layers);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLocalLayers(layers);
  }, [layers]);

  const filteredLayers = useMemo(() => {
    if (!search.trim()) return localLayers;
    const q = search.toLowerCase();
    return localLayers.filter((layer) => {
      if (layer.label.toLowerCase().includes(q)) return true;
      if (layer.id.toLowerCase().includes(q)) return true;
      const synonyms = LAYER_SYNONYMS[layer.id] ?? [];
      return synonyms.some((s) => s.includes(q));
    });
  }, [localLayers, search]);

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
        <div className="space-y-1.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layers..."
            className="w-full rounded border border-terminal-border bg-terminal-bg/60 px-2 py-1 text-[11px] text-terminal-text placeholder:text-terminal-text-dim/50 focus:border-terminal-cyan/40 focus:outline-none"
          />
          {filteredLayers.length === 0 ? (
            <p className="px-2 py-1 text-xs text-terminal-text-dim">No layers match.</p>
          ) : (
            filteredLayers.map((layer) => (
              <LayerToggle key={layer.id} layer={layer} onToggle={() => handleToggle(layer.id)} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
