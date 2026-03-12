"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo, useState, lazy } from "react";

import { LayerPanel } from "@/features/layer-controls/components";
import { useLayers } from "@/features/layer-controls/hooks";
import { useMap, useUrlMapState } from "@/features/map-intelligence/hooks";
import { fetchMapLayers } from "@/features/map-intelligence/services";
import type { MapProps } from "@/features/map-intelligence/types";
import { useApi } from "@/shared/hooks";

import { AppShell } from "./app-shell";
import { PageLoadingSkeleton } from "./page-loading-skeleton";
import { PanelLoadingSkeleton } from "./panel-loading-skeleton";
import { PanelSelectorSidebar } from "./panel-selector-sidebar";
import { PrimaryNav } from "./primary-nav";

const DataTrailWorkspace = lazy(() =>
  import("@/features/digital-trail/components").then((m) => ({ default: m.DataTrailWorkspace })),
);
const DocumentAnalyzerPanel = lazy(() =>
  import("@/features/document-analyzer/components").then((m) => ({ default: m.DocumentAnalyzerPanel })),
);
const EvidenceCollectionPanel = lazy(() =>
  import("@/features/evidence-collection/components").then((m) => ({ default: m.EvidenceCollectionPanel })),
);
import { usePanelSelection } from "../hooks/use-panel-selection";
import { PANEL_REGISTRY } from "../constants/panel-registry";

import type { DashboardTab } from "./primary-nav";
import type { PanelRegistryEntry } from "../types/panel-config";

const WorldMap = dynamic<MapProps>(
  () =>
    import("@/features/map-intelligence/components/world-map-dual").then(
      (module) => module.WorldMap,
    ),
  { ssr: false },
);

// Cache of lazy components keyed by panel id
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

function getLazyComponent(panel: PanelRegistryEntry) {
  let cached = lazyCache.get(panel.id);
  if (!cached) {
    cached = lazy(panel.load);
    lazyCache.set(panel.id, cached);
  }
  return cached;
}

type WorldMonitorDashboardProps = {
  activeTab: DashboardTab;
};

export function WorldMonitorDashboard({
  activeTab,
}: WorldMonitorDashboardProps) {
  const { viewport } = useMap();
  const { layers, toggleLayer } = useLayers();

  const {
    enabledPanels,
    togglePanel,
    enableAll,
    disableAll,
    resetToDefaults,
    enabledCount,
    totalCount,
  } = usePanelSelection();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadLayers = useCallback(() => fetchMapLayers(), []);

  const { data: layerData } = useApi(loadLayers, {
    initialData: { exchanges: [], climate: [], news: [] },
    refreshIntervalMs: 45_000,
    pauseWhenHidden: true,
  });

  const markers = useMemo(() => {
    if (!layerData) return [];
    return [...layerData.exchanges, ...layerData.climate, ...layerData.news];
  }, [layerData]);

  const activeLayers = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const layer of layers) {
      result[layer.id] = layer.enabled;
    }
    return result;
  }, [layers]);

  useUrlMapState(viewport, activeLayers, "2d");

  const isMonitor = activeTab === "monitor";

  // Separate pinned panels from toggleable ones
  const pinnedPanels = PANEL_REGISTRY.filter((p) => p.isPinned);
  const toggleablePanels = PANEL_REGISTRY.filter(
    (p) => !p.isPinned && enabledPanels[p.id],
  );

  return (
    <>
      <AppShell
        showMap={isMonitor}
        navSlot={<PrimaryNav activeTab={activeTab} />}
        mapSlot={
          isMonitor ? (
            <WorldMap
              viewport={viewport}
              markers={markers}
              activeLayers={activeLayers}
            />
          ) : undefined
        }
        layerControlsSlot={
          isMonitor ? (
            <LayerPanel layers={layers} onToggle={toggleLayer} />
          ) : undefined
        }
        feedSlot={renderFeedSlot(
          activeTab,
          pinnedPanels,
          toggleablePanels,
        )}
        onTogglePanelSelector={
          isMonitor ? () => setSidebarOpen((p) => !p) : undefined
        }
      />

      {isMonitor ? (
        <PanelSelectorSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          enabledPanels={enabledPanels}
          onToggle={togglePanel}
          onEnableAll={enableAll}
          onDisableAll={disableAll}
          onReset={resetToDefaults}
          enabledCount={enabledCount}
          totalCount={totalCount}
        />
      ) : null}
    </>
  );
}

function renderFeedSlot(
  activeTab: DashboardTab,
  pinnedPanels: PanelRegistryEntry[],
  toggleablePanels: PanelRegistryEntry[],
) {
  switch (activeTab) {
    case "document-analyzer":
      return (
        <Suspense fallback={<PageLoadingSkeleton />}>
          <DocumentAnalyzerPanel />
        </Suspense>
      );
    case "data-trail":
      return (
        <Suspense fallback={<PageLoadingSkeleton />}>
          <DataTrailWorkspace />
        </Suspense>
      );
    case "evidence-collection":
      return (
        <Suspense fallback={<PageLoadingSkeleton />}>
          <EvidenceCollectionPanel />
        </Suspense>
      );
    case "monitor":
    default:
      return (
        <div className="space-y-4">
          {/* Pinned row: Live News + Live Webcams — always at top */}
          <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
            {pinnedPanels.map((panel) => {
              const LazyComponent = getLazyComponent(panel);
              return (
                <div key={panel.id} className="h-105 overflow-y-auto rounded-[1.6rem] border border-terminal-border">
                  <Suspense fallback={<PanelLoadingSkeleton />}>
                    <LazyComponent />
                  </Suspense>
                </div>
              );
            })}
          </div>

          {/* Toggleable panel grid — equal-sized cells */}
          {toggleablePanels.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {toggleablePanels.map((panel) => {
                const LazyComponent = getLazyComponent(panel);
                return (
                  <div
                    key={panel.id}
                    className="h-100 overflow-y-auto rounded-[1.6rem] border border-terminal-border bg-terminal-surface"
                  >
                    <Suspense fallback={<PanelLoadingSkeleton />}>
                      <LazyComponent />
                    </Suspense>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-[1.6rem] border border-dashed border-terminal-border/50 py-16">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-terminal-text-dim">
                  No panels selected
                </p>
                <p className="mt-1.5 text-[10px] text-terminal-text-muted">
                  Open the panel selector to choose which modules to display
                </p>
              </div>
            </div>
          )}
        </div>
      );
  }
}
