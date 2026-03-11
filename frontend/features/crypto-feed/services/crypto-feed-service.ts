import { apiClient } from "@/shared/api";

import type { CryptoTicker } from "../types";

type FeedResponse = {
  crypto: CryptoTicker[];
};

export async function getCryptoFeed(): Promise<CryptoTicker[]> {
  const response = await apiClient.get<FeedResponse>("/feeds");
  return response.crypto ?? [];
}
