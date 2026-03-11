// frontend/features/layer-controls/components/layer-toggle.tsx
// Single layer toggle — icon, label, switch
//
// Owner: Srijan
// Task: SR-2-03
// Phase: 2 — Core UI
//
// Props: { layer: LayerConfig, onToggle: () => void }
// Renders: icon, label text, toggle switch, active glow when on

import { cn } from "@/shared/lib";

import type { LayerConfig } from "../types";

type LayerToggleProps = {
  layer: LayerConfig;
  onToggle: () => void;
};

export function LayerToggle({ layer, onToggle }: LayerToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded border px-2 py-1 text-left text-xs",
        layer.enabled
          ? "border-terminal-green/60 bg-terminal-green/10 text-terminal-green"
          : "border-terminal-border bg-terminal-surface text-terminal-text-dim",
      )}
    >
      <span className="flex items-center gap-2">
        <span>{layer.icon}</span>
        <span>{layer.label}</span>
      </span>
      <span>{layer.enabled ? "ON" : "OFF"}</span>
    </button>
  );
}
