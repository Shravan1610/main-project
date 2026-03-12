"use client";

import { useCallback } from "react";

import { useApi } from "@/shared/hooks";

import { getLiveNews } from "../services/live-news-service";
import type { LiveNewsResponse } from "../types";

const EMPTY_RESPONSE: LiveNewsResponse = {
  channels: [],
  updatedAt: "",
  hasApiKey: false,
};

export function useLiveNews() {
  const fetcher = useCallback(() => getLiveNews(), []);

  return useApi(fetcher, {
    initialData: EMPTY_RESPONSE,
    refreshIntervalMs: 300_000, // 5 minutes
    pauseWhenHidden: true,
  });
}
