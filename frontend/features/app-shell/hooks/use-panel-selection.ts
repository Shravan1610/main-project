"use client";

import { useCallback, useEffect, useState } from "react";

import { PANEL_REGISTRY, PINNED_PANEL_IDS } from "../constants/panel-registry";

const STORAGE_KEY = "greentrust:panel-selection";

function getDefaults(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const panel of PANEL_REGISTRY) {
    defaults[panel.id] = panel.defaultEnabled;
  }
  return defaults;
}

function loadFromStorage(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return null;
  }
}

function saveToStorage(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function usePanelSelection() {
  // Always start with defaults to avoid SSR/client hydration mismatch
  const [enabledPanels, setEnabledPanels] = useState<Record<string, boolean>>(getDefaults);

  // Sync from localStorage after hydration
  useEffect(() => {
    const stored = loadFromStorage();
    if (!stored) return;

    const defaults = getDefaults();
    const merged: Record<string, boolean> = { ...defaults };
    for (const [id, enabled] of Object.entries(stored)) {
      if (id in defaults) {
        merged[id] = enabled;
      }
    }
    for (const id of PINNED_PANEL_IDS) {
      merged[id] = true;
    }

    // Only update if there's an actual difference
    setEnabledPanels((prev) => {
      const changed = Object.keys(merged).some((k) => merged[k] !== prev[k]);
      return changed ? merged : prev;
    });
  }, []);

  const togglePanel = useCallback((panelId: string) => {
    if (PINNED_PANEL_IDS.has(panelId)) return; // can't toggle pinned panels
    setEnabledPanels((prev) => {
      const next = { ...prev, [panelId]: !prev[panelId] };
      saveToStorage(next);
      return next;
    });
  }, []);

  const enableAll = useCallback(() => {
    setEnabledPanels((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = true;
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const disableAll = useCallback(() => {
    setEnabledPanels((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = PINNED_PANEL_IDS.has(key); // keep pinned enabled
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = getDefaults();
    saveToStorage(defaults);
    setEnabledPanels(defaults);
  }, []);

  const isPanelEnabled = useCallback(
    (panelId: string) => enabledPanels[panelId] ?? false,
    [enabledPanels],
  );

  const enabledCount = Object.values(enabledPanels).filter(Boolean).length;
  const totalCount = PANEL_REGISTRY.length;

  return {
    enabledPanels,
    togglePanel,
    enableAll,
    disableAll,
    resetToDefaults,
    isPanelEnabled,
    enabledCount,
    totalCount,
  };
}
