"use client";

import { useCallback } from "react";

import { useApi } from "@/shared/hooks";

import { getEntityAnalysis } from "../services";

export function useEntityAnalysis(entityId?: string) {
  const normalizedEntityId = entityId?.trim() ?? "";
  const fetchAnalysis = useCallback(() => getEntityAnalysis(normalizedEntityId), [normalizedEntityId]);

  return useApi(
    fetchAnalysis,
    {
      enabled: normalizedEntityId.length > 0,
      initialData: null,
    },
  );
}
