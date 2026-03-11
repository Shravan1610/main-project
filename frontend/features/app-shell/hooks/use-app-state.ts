"use client";

import { useCallback, useState } from "react";

export type LayerKey = "entities" | "exchanges" | "climate" | "news";

export type LayerState = Record<LayerKey, boolean>;

export type AppState = {
  selectedEntityIds: string[];
  compareMode: boolean;
  activeLayers: LayerState;
};

const DEFAULT_LAYER_STATE: LayerState = {
  entities: true,
  exchanges: false,
  climate: false,
  news: false,
};

export function useAppState() {
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [activeLayers, setActiveLayers] = useState<LayerState>(DEFAULT_LAYER_STATE);

  const addEntity = useCallback((entityId: string) => {
    setSelectedEntityIds((previous) => {
      if (previous.includes(entityId)) {
        return previous;
      }

      if (previous.length >= 3) {
        return previous;
      }

      return [...previous, entityId];
    });
  }, []);

  const removeEntity = useCallback((entityId: string) => {
    setSelectedEntityIds((previous) => previous.filter((id) => id !== entityId));
  }, []);

  const clearEntities = useCallback(() => {
    setSelectedEntityIds([]);
    setCompareMode(false);
  }, []);

  const toggleLayer = useCallback((layer: LayerKey) => {
    setActiveLayers((previous) => ({
      ...previous,
      [layer]: !previous[layer],
    }));
  }, []);

  return {
    selectedEntityIds,
    compareMode,
    activeLayers,
    setCompareMode,
    addEntity,
    removeEntity,
    clearEntities,
    toggleLayer,
  };
}
