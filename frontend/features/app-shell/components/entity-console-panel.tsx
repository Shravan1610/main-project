"use client";

import { useCallback, useState } from "react";

import { CompareView } from "@/features/comparison/components";
import { compareEntities } from "@/features/comparison/services";
import { SearchBar } from "@/features/entity-search/components";
import type { SearchResult } from "@/features/entity-search/types";
import { InsightPanel } from "@/features/insight-panel/components";
import type { EntityAnalysis } from "@/features/insight-panel/types";
import { MacWindow } from "@/shared/components/mac-window";

import { useAppState } from "../hooks";

export default function EntityConsolePanel() {
  const { selectedEntityIds, addEntity, removeEntity } = useAppState();

  const [entityLookup, setEntityLookup] = useState<Record<string, SearchResult>>({});
  const [compareData, setCompareData] = useState<EntityAnalysis[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [showCompareView, setShowCompareView] = useState(false);

  const activeEntityId = selectedEntityIds[selectedEntityIds.length - 1];

  const handleSelect = (result: SearchResult) => {
    addEntity(result.id);
    setShowCompareView(false);
    setEntityLookup((prev) => ({ ...prev, [result.id]: result }));
  };

  const handleCompare = useCallback(async () => {
    if (selectedEntityIds.length < 2) return;
    setShowCompareView(true);
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
    <MacWindow title="Entity Console">
      <div className="flex h-full flex-col gap-3 p-3">
        <SearchBar onSelect={handleSelect} />

        <div className="rounded border border-terminal-border bg-terminal-surface p-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-terminal-text-dim">
              Compare{" "}
              {selectedEntityIds.length > 0 ? `(${selectedEntityIds.length})` : ""}
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
              <p className="text-xs text-terminal-text-dim">No entities selected.</p>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded border border-terminal-border bg-terminal-surface p-3">
          {showCompareView ? (
            compareError ? (
              <p className="text-xs text-terminal-red">{compareError}</p>
            ) : compareLoading ? (
              <p className="text-sm text-terminal-text-dim">Preparing comparison...</p>
            ) : (
              <CompareView entities={compareData} />
            )
          ) : (
            <InsightPanel entityId={activeEntityId} />
          )}
        </div>
      </div>
    </MacWindow>
  );
}
