"use client";

import { useApi } from "@/shared/hooks";

import { getEntityAnalysis } from "../services";

export function useEntityAnalysis(entityId?: string) {
  return useApi(
    () => getEntityAnalysis(entityId as string),
    [entityId],
    {
      enabled: Boolean(entityId),
      initialData: null,
    },
  );
}
