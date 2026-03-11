"use client";

import { useApi } from "@/shared/hooks";

import { getNewsFeed } from "../services";

export function useNewsFeed(enabled = true) {
  return useApi(getNewsFeed, [enabled], { enabled, initialData: [] });
}
