"use client";

import type { ReactNode } from "react";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useRefresh } from "@/shared/hooks";

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type HeaderProps = {
  searchSlot?: ReactNode;
  compareTraySlot?: ReactNode;
  navSlot?: ReactNode;
  onTogglePanelSelector?: () => void;
};

export function Header({ searchSlot, compareTraySlot, navSlot, onTogglePanelSelector }: HeaderProps) {
  const showTools = Boolean(searchSlot || compareTraySlot);
  const { refresh, refreshing, secondsUntilRefresh } = useRefresh();

  return (
    <header className="mx-auto w-full max-w-280 overflow-hidden rounded-[26px] border border-terminal-border/65 bg-terminal-surface/86 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="border-b border-terminal-border/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-4 py-2.5 md:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h1 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-terminal-text md:text-[13px] md:tracking-[0.3em]">
                    Greentrust Intelligence Terminal
                  </h1>

                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-terminal-text-muted md:text-[10px]">
                    <span>v3.0.0</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-terminal-green/18 bg-terminal-green/8 px-2 py-0.5 text-terminal-green">
                      <span className="h-1.5 w-1.5 rounded-full bg-terminal-green/90" />
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {/* Refresh button with countdown */}
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              aria-label="Refresh all panels"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-terminal-border/65 bg-terminal-bg/45 px-2.5 text-terminal-text-dim transition-colors hover:bg-terminal-border/18 hover:text-terminal-text disabled:opacity-60"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
                />
              </svg>
              <span className="text-[9px] font-mono tabular-nums tracking-wide text-terminal-text-muted">
                {refreshing ? "..." : formatCountdown(secondsUntilRefresh)}
              </span>
            </button>

            {onTogglePanelSelector ? (
              <button
                type="button"
                onClick={onTogglePanelSelector}
                aria-label="Toggle panel selector"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-terminal-border/65 bg-terminal-bg/45 text-terminal-text-dim transition-colors hover:bg-terminal-border/18 hover:text-terminal-text"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
            ) : null}
            <AnimatedThemeToggler
              aria-label="Toggle theme"
              className="h-9 w-9 rounded-xl border-terminal-border/65 bg-terminal-bg/45 hover:bg-terminal-border/18"
            />
          </div>
        </div>
      </div>

      {navSlot ? (
        <div className="px-3 py-2 md:px-4">
          {navSlot}
        </div>
      ) : null}

      {showTools ? (
        <div className="border-t border-terminal-border/55 px-4 py-2.5 md:px-5">
          <div className="flex w-full flex-col gap-2">
            {searchSlot}
            {compareTraySlot}
          </div>
        </div>
      ) : null}
    </header>
  );
}
