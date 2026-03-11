"use client";

import { useApi } from "@/shared/hooks";

import { getMarketFeed } from "../services";

export function useMarketFeed(enabled = true) {
  return useApi(getMarketFeed, {
    enabled,
    initialData: [],
    refreshIntervalMs: 60000,
    pauseWhenHidden: true,
  });
}
