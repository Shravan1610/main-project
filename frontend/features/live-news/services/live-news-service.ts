import { apiClient } from "@/shared/api";

import type { LiveNewsResponse } from "../types";

export async function getLiveNews(): Promise<LiveNewsResponse> {
  return apiClient.get<LiveNewsResponse>("/feeds/live-news");
}
