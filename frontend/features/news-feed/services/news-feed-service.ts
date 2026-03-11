import { apiClient } from "@/shared/api";

import type { FeedNewsItem } from "../types";

type FeedResponse = {
  news: FeedNewsItem[];
};

export async function getNewsFeed(): Promise<FeedNewsItem[]> {
  const response = await apiClient.get<FeedResponse>("/feeds");
  return response.news ?? [];
}
