"use client";

import { useMemo, useState } from "react";

import { formatCurrency, formatPercent } from "@/shared/utils";

import type { CryptoTicker } from "../types";

type CryptoWatchlistProps = {
  items: CryptoTicker[];
};

type PerformanceWindow = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y";

const PERFORMANCE_WINDOWS: PerformanceWindow[] = ["1W", "1M", "3M", "6M", "YTD", "1Y"];

function asSigned(value: number): string {
  const absolute = formatCurrency(Math.abs(value));
  return value >= 0 ? `+${absolute}` : `-${absolute}`;
}

function seedFromSymbol(symbol: string): number {
  return symbol
    .split("")
    .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
}

function simulatedPerformance(symbol: string, baseChange: number) {
  const seed = seedFromSymbol(symbol);
  return PERFORMANCE_WINDOWS.map((windowName, index) => {
    const drift = ((seed * (index + 3)) % 13) - 6;
    const value = Number((baseChange + drift * 0.46).toFixed(2));
    return {
      windowName,
      value,
    };
  });
}

export function CryptoWatchlist({ items }: CryptoWatchlistProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const watchlist = useMemo(() => items.slice(0, 10), [items]);

  const selectedItem = useMemo(() => {
    if (watchlist.length === 0) {
      return null;
    }

    if (selectedSymbol) {
      return watchlist.find((item) => item.symbol === selectedSymbol) ?? watchlist[0];
    }

    return watchlist[0];
  }, [selectedSymbol, watchlist]);

  if (watchlist.length === 0) {
    return <p className="text-xs text-terminal-text-dim">No crypto data available.</p>;
  }

  const performance = simulatedPerformance(selectedItem?.symbol ?? "CRYPTO", selectedItem?.changePercent ?? 0);

  return (
    <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-2">
        <div className="grid grid-cols-[1.15fr_1fr_0.95fr_0.8fr] gap-2 border-b border-terminal-border px-2 pb-2 text-[11px] uppercase tracking-wide text-terminal-text-muted">
          <span>Sym</span>
          <span>Last</span>
          <span>Chg</span>
          <span>Chg%</span>
        </div>
        <div className="mt-1 space-y-1">
          {watchlist.map((item) => {
            const change = item.changePercent ?? 0;
            const changeValue = (item.price * change) / 100;
            const isSelected = item.symbol === selectedItem?.symbol;
            const isPositive = change >= 0;

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`grid w-full grid-cols-[1.15fr_1fr_0.95fr_0.8fr] gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-terminal-border/45 text-terminal-text"
                    : "hover:bg-terminal-border/30 text-terminal-text-dim"
                }`}
              >
                <span className="truncate font-medium">{item.symbol}</span>
                <span className="truncate">{formatCurrency(item.price)}</span>
                <span className={isPositive ? "text-emerald-300" : "text-rose-300"}>{asSigned(changeValue)}</span>
                <span className={isPositive ? "text-emerald-300" : "text-rose-300"}>
                  {change >= 0 ? "+" : ""}
                  {formatPercent(change)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedItem ? (
        <section className="rounded-xl border border-terminal-border bg-terminal-bg/55 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-muted">Current Coin</p>
          <h4 className="mt-1 text-lg font-semibold tracking-wide text-terminal-text">{selectedItem.symbol}</h4>
          <p className="mt-3 text-3xl font-semibold text-terminal-text">{formatCurrency(selectedItem.price)}</p>
          <p
            className={`mt-1 text-sm font-medium ${(selectedItem.changePercent ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}
          >
            {(selectedItem.changePercent ?? 0) >= 0 ? "+" : ""}
            {formatPercent(selectedItem.changePercent ?? 0)}
          </p>
          <p className="mt-2 text-xs text-terminal-text-muted">Live crypto pulse from CoinGecko market feed.</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {performance.map((item) => (
              <div
                key={item.windowName}
                className={`rounded-md border px-2 py-1.5 text-center ${
                  item.value >= 0
                    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-400/25 bg-rose-500/10 text-rose-200"
                }`}
              >
                <p className="text-[10px] font-semibold tracking-wide">{item.windowName}</p>
                <p className="text-xs">
                  {item.value >= 0 ? "+" : ""}
                  {formatPercent(item.value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
