import { apiClient } from "@/shared/api";

import type { StockTicker } from "../types";

type FeedResponse = {
  stocks: StockTicker[];
};

export async function getMarketFeed(): Promise<StockTicker[]> {
  const response = await apiClient.get<FeedResponse>("/feeds");
  return response.stocks ?? [];
}
