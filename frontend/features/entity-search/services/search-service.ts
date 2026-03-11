import { apiClient } from "@/shared/api";

import type { SearchResponse } from "../types";

export async function searchEntities(query: string): Promise<SearchResponse> {
  return apiClient.get<SearchResponse>("/search", { params: { q: query } });
}
