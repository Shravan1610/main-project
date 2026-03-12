"use client";

import { useEffect, useRef } from "react";

import {
  PANEL_REGISTRY,
  PANEL_CATEGORIES,
  PINNED_PANEL_IDS,
} from "../constants/panel-registry";
import type { PanelCategory } from "../types/panel-config";

type PanelSelectorSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  enabledPanels: Record<string, boolean>;
  onToggle: (panelId: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onReset: () => void;
  enabledCount: number;
  totalCount: number;
};

export function PanelSelectorSidebar({
  isOpen,
  onClose,
  enabledPanels,
  onToggle,
  onEnableAll,
  onDisableAll,
  onReset,
  enabledCount,
  totalCount,
}: PanelSelectorSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid catching the open-click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, onClose]);

  const panelsByCategory = PANEL_CATEGORIES.map((cat) => ({
    ...cat,
    panels: PANEL_REGISTRY.filter(
      (p) => p.category === cat.key && !p.isPinned,
    ),
  })).filter((group) => group.panels.length > 0);

  const pinnedPanels = PANEL_REGISTRY.filter((p) => p.isPinned);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-label="Panel selector"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-130 flex-col border-l border-terminal-border bg-terminal-bg transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-terminal-border px-5 py-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-terminal-text">
              Panel Selector
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-terminal-text-muted">
              {enabledCount} / {totalCount} active
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-terminal-border text-terminal-text-dim transition-colors hover:bg-terminal-surface hover:text-terminal-text"
            aria-label="Close panel selector"
          >
            ✕
          </button>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2 border-b border-terminal-border/50 px-5 py-3">
          <button
            type="button"
            onClick={onEnableAll}
            className="rounded border border-terminal-green/30 bg-terminal-green/8 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-terminal-green transition-colors hover:bg-terminal-green/15"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDisableAll}
            className="rounded border border-terminal-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-terminal-text-dim transition-colors hover:bg-terminal-surface hover:text-terminal-text"
          >
            Deselect All
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-terminal-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-terminal-text-dim transition-colors hover:bg-terminal-surface hover:text-terminal-text"
          >
            Reset
          </button>
        </div>

        {/* Scrollable panel list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Pinned panels (locked) */}
          {pinnedPanels.length > 0 ? (
            <div className="mb-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                Pinned (Always Active)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {pinnedPanels.map((panel) => (
                  <div
                    key={panel.id}
                    className="flex items-center gap-2.5 rounded-lg border border-terminal-green/20 bg-terminal-green/5 px-3 py-2.5 opacity-70"
                  >
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-terminal-green/40 bg-terminal-green/20">
                      <svg
                        className="h-2.5 w-2.5 text-terminal-green"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-terminal-green/80">
                      {panel.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Category groups */}
          {panelsByCategory.map((group) => (
            <div key={group.key} className="mb-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-text-muted">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.panels.map((panel) => {
                  const isEnabled = enabledPanels[panel.id] ?? false;
                  return (
                    <button
                      key={panel.id}
                      type="button"
                      onClick={() => onToggle(panel.id)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
                        isEnabled
                          ? "border-terminal-green/30 bg-terminal-green/8 shadow-[0_0_8px_rgba(132,219,160,0.06)]"
                          : "border-terminal-border/50 bg-terminal-surface/40 hover:border-terminal-border hover:bg-terminal-surface/70"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isEnabled
                            ? "border-terminal-green/40 bg-terminal-green/20"
                            : "border-terminal-border bg-terminal-bg/60"
                        }`}
                      >
                        {isEnabled ? (
                          <svg
                            className="h-2.5 w-2.5 text-terminal-green"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </div>
                      <span
                        className={`truncate text-[10px] font-medium uppercase tracking-[0.12em] ${
                          isEnabled ? "text-terminal-green" : "text-terminal-text-dim"
                        }`}
                      >
                        {panel.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
