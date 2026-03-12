"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { CompareView } from "@/features/comparison/components";
import { compareEntities } from "@/features/comparison/services";
import { CryptoFeedSection } from "@/features/crypto-feed/components";
import { DigitalTrailPanel } from "@/features/digital-trail/components";
import { DocumentAnalyzerPanel } from "@/features/document-analyzer/components";
import { EvidenceCollectionPanel } from "@/features/evidence-collection/components";
import { SearchBar } from "@/features/entity-search/components";
import type { SearchResult } from "@/features/entity-search/types";
import { VerificationPortal } from "@/features/integrity-ledger";
import { InsightPanel } from "@/features/insight-panel/components";
import type { EntityAnalysis } from "@/features/insight-panel/types";
import { LayerPanel } from "@/features/layer-controls/components";
import { useLayers } from "@/features/layer-controls/hooks";
import { LiveNewsPanel } from "@/features/live-news/components";
import { LiveWebcamsDashboard } from "@/features/live-webcams/components";
import { useMap } from "@/features/map-intelligence/hooks";
import { useUrlMapState } from "@/features/map-intelligence/hooks";
import { fetchMapLayers } from "@/features/map-intelligence/services";
import type { MapProps } from "@/features/map-intelligence/types";
import { MarketFeedSection } from "@/features/market-feed/components";
import { NewsFeedSection } from "@/features/news-feed/components";
import { VapiVoiceAgent } from "@/features/voice-agent/components";
import { useApi } from "@/shared/hooks";

import { AppShell } from "./app-shell";
import { useAppState } from "../hooks";

export type DashboardTab =
  | "monitor"
  | "document-analyzer"
  | "digital-trail"
  | "verification"
  | "evidence-collection";

const NAV_ITEMS: Array<{ id: DashboardTab; href: string; label: string }> = [
  { id: "monitor", href: "/", label: "Monitor" },
  { id: "document-analyzer", href: "/document-analyzer", label: "Document Analyzer" },
  { id: "digital-trail", href: "/digital-trail", label: "Digital Trail" },
  { id: "verification", href: "/verification", label: "Verification" },
  { id: "evidence-collection", href: "/evidence-collection", label: "Evidence Collection" },
];

const WorldMap = dynamic<MapProps>(
  () =>
    import("@/features/map-intelligence/components/world-map-dual").then(
      (module) => module.WorldMap,
    ),
  { ssr: false },
);

type WorldMonitorDashboardProps = {
  activeTab: DashboardTab;
};

export function WorldMonitorDashboard({
  activeTab,
}: WorldMonitorDashboardProps) {
  const { selectedEntityIds, addEntity, removeEntity } = useAppState();
  const { viewport, flyTo } = useMap();
  const { layers, toggleLayer } = useLayers();

  const [entityLookup, setEntityLookup] = useState<Record<string, SearchResult>>(
    {},
  );
  const [compareData, setCompareData] = useState<EntityAnalysis[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [showCompareView, setShowCompareView] = useState(false);

  const activeEntityId = selectedEntityIds[selectedEntityIds.length - 1];

  const loadLayers = useCallback(() => fetchMapLayers(), []);

  const { data: layerData } = useApi(loadLayers, {
    initialData: { exchanges: [], climate: [], news: [] },
    refreshIntervalMs: 45_000,
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
    () =>
      selectedEntityIds.flatMap((entityId) => {
        const entity = entityLookup[entityId];

        if (!entity?.coordinates) return [];

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

  const allLayerMarkers = useMemo(() => {
    if (!layerData) return [];

    return [...layerData.exchanges, ...layerData.climate, ...layerData.news];
  }, [layerData]);

  const markers = useMemo(
    () => [...entityMarkers, ...allLayerMarkers],
    [entityMarkers, allLayerMarkers],
  );

  const activeLayers = useMemo(
    () => ({
      entities: layerEnabled.entities,
      exchanges: layerEnabled.exchanges,
      climate: layerEnabled.climate,
      news: layerEnabled.news,
      heatmap: layers.some((layer) => layer.id === "heatmap" && layer.enabled),
      "risk-overlay": layers.some(
        (layer) => layer.id === "risk-overlay" && layer.enabled,
      ),
    }),
    [layerEnabled, layers],
  );

  // Sync map viewport + active layers to URL for shareability
  useUrlMapState(viewport, activeLayers, "2d");

  const handleSelect = (result: SearchResult) => {
    addEntity(result.id);
    setShowCompareView(false);

    setEntityLookup((previous) => ({
      ...previous,
      [result.id]: result,
    }));

    if (result.coordinates) {
      flyTo([result.coordinates.lat, result.coordinates.lng], 4);
    }
  };

  const handleCompare = useCallback(async () => {
    if (selectedEntityIds.length < 2) return;

    setShowCompareView(true);
    setCompareLoading(true);
    setCompareError(null);

    try {
      const response = await compareEntities({
        entities: selectedEntityIds,
      });

      setCompareData(response.entities);
    } catch (error) {
      setCompareError(
        error instanceof Error ? error.message : "Compare failed",
      );
      setCompareData([]);
    } finally {
      setCompareLoading(false);
    }
  }, [selectedEntityIds]);

  const isMonitor = activeTab === "monitor";

  return (
    <AppShell
      showMap={isMonitor}
      navSlot={
        <div className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`rounded border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                activeTab === item.id
                  ? "border-terminal-cyan/35 bg-terminal-cyan/8 text-terminal-cyan"
                  : "border-terminal-border text-terminal-text-dim hover:bg-terminal-border/35"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      }
      mapSlot={
        isMonitor ? (
          <WorldMap
            viewport={viewport}
            markers={markers}
            activeLayers={activeLayers}
          />
        ) : undefined
      }
      layerControlsSlot={isMonitor ? <LayerPanel layers={layers} onToggle={toggleLayer} /> : undefined}
      sidePanelSlot={
        isMonitor ? (
          <div className="flex h-full flex-col gap-3">
          <SearchBar onSelect={handleSelect} />

          <div className="rounded border border-terminal-border bg-terminal-surface p-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-terminal-text-dim">
                Compare{" "}
                {selectedEntityIds.length > 0
                  ? `(${selectedEntityIds.length})`
                  : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompareView(false);
                    setCompareData([]);
                    setCompareError(null);
                    selectedEntityIds.forEach((id) => removeEntity(id));
                  }}
                  disabled={selectedEntityIds.length === 0 || compareLoading}
                  className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-text disabled:opacity-45"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={selectedEntityIds.length < 2 || compareLoading}
                  className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-text disabled:opacity-45"
                >
                  {compareLoading ? "Comparing..." : "Compare"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedEntityIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeEntity(id)}
                  className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-text"
                >
                  {id} ✕
                </button>
              ))}

              {selectedEntityIds.length === 0 ? (
                <p className="text-xs text-terminal-text-dim">
                  No entities selected.
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded border border-terminal-border bg-terminal-surface p-3">
            {showCompareView ? (
              compareError ? (
                <p className="text-xs text-terminal-red">{compareError}</p>
              ) : compareLoading ? (
                <p className="text-sm text-terminal-text-dim">
                  Preparing comparison...
                </p>
              ) : (
                <CompareView entities={compareData} />
              )
            ) : (
              <InsightPanel entityId={activeEntityId} />
            )}
          </div>
        </div>
        ) : undefined
      }
      feedSlot={renderFeedSlot(activeTab)}
    />
  );
}

function renderFeedSlot(activeTab: DashboardTab) {
  switch (activeTab) {
    case "document-analyzer":
      return <DocumentAnalyzerPanel />;
    case "digital-trail":
      return <DigitalTrailPanel />;
    case "verification":
      return <VerificationPortal />;
    case "evidence-collection":
      return <EvidenceCollectionPanel />;
    case "monitor":
    default:
      return (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <NewsFeedSection />
            <MarketFeedSection />
            <CryptoFeedSection />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <LiveNewsPanel />
            <LiveWebcamsDashboard />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="min-h-[340px]">
              <VapiVoiceAgent />
            </div>
          </div>
        </div>
      );
  }
}
