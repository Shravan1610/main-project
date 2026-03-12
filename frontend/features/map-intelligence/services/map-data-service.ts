// frontend/features/map-intelligence/services/map-data-service.ts
// Service for fetching and transforming map layer data
//
// Owner: Srijan
// Task: SR-1-17
// Phase: 1 — Scaffolding
//
// Expected functions:
//   fetchMapLayers(): Promise<MapLayersResponse>
//   transformToMarkers(layers: MapLayersData): MapMarker[]
//   Uses: @/shared/api/client

import { apiClient } from "@/shared/api";

import type { ClimateHeatmapPoint, LayerResponse, MapMarker } from "../types";

export async function fetchMapLayers(): Promise<LayerResponse> {
  return apiClient.get<LayerResponse>("/layers");
}

export async function fetchClimateHeatmap(): Promise<ClimateHeatmapPoint[]> {
  return apiClient.get<ClimateHeatmapPoint[]>("/layers/climate-heatmap");
}

export function transformToMarkers(layers: LayerResponse): MapMarker[] {
  return [...layers.population, ...layers.climate];
}
