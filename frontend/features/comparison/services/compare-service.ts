import { apiClient } from "@/shared/api";

import type { CompareRequest, CompareResponse } from "../types";

export async function compareEntities(payload: CompareRequest): Promise<CompareResponse> {
  return apiClient.post<CompareResponse, CompareRequest>("/compare", payload);
}
