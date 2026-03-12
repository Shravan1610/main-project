"use client";

import { useApi } from "@/shared/hooks";

import { getCryptoFeed } from "../services";

export function useCryptoFeed(enabled = true) {
  return useApi(getCryptoFeed, {
    enabled,
    initialData: [],
    refreshIntervalMs: 30000,
    pauseWhenHidden: true,
  });
}
