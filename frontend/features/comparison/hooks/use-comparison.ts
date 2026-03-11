"use client";

import { useState } from "react";

import { compareEntities } from "../services";
import type { CompareState } from "../types";

export function useComparison(limit = 3) {
  const [state, setState] = useState<CompareState>({
    selectedEntityIds: [],
    compareData: [],
    loading: false,
    error: null,
  });

  const addEntity = (entityId: string) => {
    setState((previous) => {
      if (previous.selectedEntityIds.includes(entityId) || previous.selectedEntityIds.length >= limit) {
        return previous;
      }
      return {
        ...previous,
        selectedEntityIds: [...previous.selectedEntityIds, entityId],
      };
    });
  };

  const removeEntity = (entityId: string) => {
    setState((previous) => ({
      ...previous,
      selectedEntityIds: previous.selectedEntityIds.filter((id) => id !== entityId),
    }));
  };

  const runCompare = async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const response = await compareEntities({ entities: state.selectedEntityIds });
      setState((previous) => ({ ...previous, loading: false, compareData: response.entities }));
    } catch (caughtError) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: caughtError instanceof Error ? caughtError.message : "Compare failed",
      }));
    }
  };

  return {
    ...state,
    addEntity,
    removeEntity,
    clear: () => setState((previous) => ({ ...previous, selectedEntityIds: [], compareData: [] })),
    runCompare,
  };
}
