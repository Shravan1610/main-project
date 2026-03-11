"use client";

import { useCallback } from "react";

import { useApi } from "@/shared/hooks";

import { getLiveWebcams } from "../services/live-webcams-service";
import type { LiveWebcamResponse, WebcamRegion } from "../types";

const EMPTY_RESPONSE: LiveWebcamResponse = {
  region: "all",
  feeds: [],
  updatedAt: "",
};

export function useLiveWebcams(region: WebcamRegion, limit = 4) {
  const fetcher = useCallback(() => getLiveWebcams(region, limit), [region, limit]);

  return useApi(fetcher, {
    initialData: EMPTY_RESPONSE,
    refreshIntervalMs: 120000,
    pauseWhenHidden: true,
  });
}
