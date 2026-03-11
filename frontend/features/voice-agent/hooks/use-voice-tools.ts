"use client";

import { useApi } from "@/shared/hooks";

import { getVoiceTools } from "../services";

export function useVoiceTools(enabled = true) {
  return useApi(getVoiceTools, {
    enabled,
    initialData: { tools: [] },
    refreshIntervalMs: 0,
    pauseWhenHidden: false,
  });
}
