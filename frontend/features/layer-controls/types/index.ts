// frontend/features/layer-controls/types/index.ts
// Types for layer controls — LayerConfig, LayerType, LayerState
//
// Owner: Srijan
// Task: SR-1-01
// Phase: 1 — Scaffolding
//
// Expected types:
//   LayerType = "exchanges" | "climate" | "news" | "heatmap" | "risk-overlay"
//   LayerConfig { id: LayerType, label: string, icon: string, enabled: boolean }
//   LayerState { layers: LayerConfig[] }

export type LayerType =
  | "population"
  | "climate"
  | "heatmap"
  | "risk-overlay"
  | "market-hours";

export type LayerConfig = {
  id: LayerType;
  label: string;
  icon: string;
  enabled: boolean;
};

export type LayerState = {
  layers: LayerConfig[];
};
