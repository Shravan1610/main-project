// frontend/features/map-intelligence/services/layer-data-service.ts
// Service for fetching map layer data — calls GET /layers
//
// Owner: Srijan
// Task: SR-1-02
// Phase: 1 — Scaffolding
//
// Expected functions:
//   fetchLayerData(): Promise<MapLayersResponse>
//   Uses: @/shared/api/client

import { apiClient } from "@/shared/api";

import type { LayerResponse } from "../types";

export async function fetchLayerData(): Promise<LayerResponse> {
  return apiClient.get<LayerResponse>("/layers");
}
