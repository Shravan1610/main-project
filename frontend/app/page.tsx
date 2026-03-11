"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { AppShell } from "@/features/app-shell/components";
import { useAppState } from "@/features/app-shell/hooks";
import { CompareTray, CompareView } from "@/features/comparison/components";
import { compareEntities } from "@/features/comparison/services";
import { SearchBar } from "@/features/entity-search/components";
import type { SearchResult } from "@/features/entity-search/types";
import { InsightPanel } from "@/features/insight-panel/components";
import { useMap } from "@/features/map-intelligence/hooks";
import { fetchMapLayers } from "@/features/map-intelligence/services";
import { CryptoFeedSection } from "@/features/crypto-feed/components";
import { MarketFeedSection } from "@/features/market-feed/components";
import { NewsFeedSection } from "@/features/news-feed/components";
import { LayerPanel } from "@/features/layer-controls/components";
import { useLayers } from "@/features/layer-controls/hooks";
import type { MapProps } from "@/features/map-intelligence/types";
import type { EntityAnalysis } from "@/features/insight-panel/types";
import { useApi } from "@/shared/hooks";

const WorldMap = dynamic<MapProps>(
  () => import("@/features/map-intelligence/components/world-map").then((module) => module.WorldMap),
  { ssr: false },
);

export default function HomePage() {
  const { selectedEntityIds, addEntity, removeEntity } = useAppState();
  const { viewport, flyTo } = useMap();
  const { layers, toggleLayer } = useLayers();
  const [entityLookup, setEntityLookup] = useState<Record<string, SearchResult>>({});
  const [compareData, setCompareData] = useState<EntityAnalysis[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const activeEntityId = selectedEntityIds[selectedEntityIds.length - 1];
  const loadLayers = useCallback(() => fetchMapLayers(), []);
  const { data: layerData } = useApi(loadLayers, {
    initialData: { exchanges: [], climate: [], news: [] },
    refreshIntervalMs: 45000,
    pauseWhenHidden: true,
  });

  const layerEnabled = useMemo(
    () => ({
      entities: layers.some((item) => item.id === "entities" && item.enabled),
      exchanges: layers.some((item) => item.id === "exchanges" && item.enabled),
      climate: layers.some((item) => item.id === "climate" && item.enabled),
      news: layers.some((item) => item.id === "news" && item.enabled),
    }),
    [layers],
  );

  const entityMarkers = useMemo(
    () => selectedEntityIds.flatMap((entityId) => {
        const entity = entityLookup[entityId];
        if (!entity?.coordinates) {
          return [];
        }

        return [
          {
            id: entityId,
            kind: "entity" as const,
            label: entity.name,
            coordinates: entity.coordinates,
          },
        ];
      }),
    [entityLookup, selectedEntityIds],
  );

  const layerMarkers = useMemo(() => {
    if (!layerData) {
      return [];
    }

    return [
      ...(layerEnabled.exchanges ? layerData.exchanges : []),
      ...(layerEnabled.climate ? layerData.climate : []),
      ...(layerEnabled.news ? layerData.news : []),
    ];
  }, [layerData, layerEnabled.climate, layerEnabled.exchanges, layerEnabled.news]);

  const markers = useMemo(
    () => [...(layerEnabled.entities ? entityMarkers : []), ...layerMarkers],
    [entityMarkers, layerEnabled.entities, layerMarkers],
  );

  const handleSelect = (result: SearchResult) => {
    addEntity(result.id);
    setEntityLookup((previous) => ({
      ...previous,
      [result.id]: result,
    }));

    if (result.coordinates) {
      flyTo([result.coordinates.lat, result.coordinates.lng], 4);
    }
  };

  const handleCompare = useCallback(async () => {
    if (selectedEntityIds.length < 2) {
      return;
    }
    setCompareLoading(true);
    setCompareError(null);

    try {
      const response = await compareEntities({ entities: selectedEntityIds });
      setCompareData(response.entities);
    } catch (error) {
      setCompareError(error instanceof Error ? error.message : "Compare failed");
      setCompareData([]);
    } finally {
      setCompareLoading(false);
    }
  }, [selectedEntityIds]);

  return (
    <AppShell
      searchSlot={<SearchBar onSelect={handleSelect} />}
      compareTraySlot={
        <CompareTray
          selectedEntityIds={selectedEntityIds}
          onRemove={removeEntity}
          onCompare={handleCompare}
          loading={compareLoading}
        />
      }
      mapSlot={<WorldMap viewport={viewport} markers={markers} />}
      layerControlsSlot={<LayerPanel layers={layers} onToggle={toggleLayer} />}
      sidePanelSlot={<InsightPanel entityId={activeEntityId} />}
      feedSlot={
        <div className="space-y-4">
          {compareError ? <p className="text-xs text-terminal-red">{compareError}</p> : null}
          {compareData.length > 0 ? <CompareView entities={compareData} /> : null}
          <div className="grid gap-4 lg:grid-cols-3">
            <NewsFeedSection />
            <MarketFeedSection />
            <CryptoFeedSection />
          </div>
        </div>
      }
    />
  );
}
