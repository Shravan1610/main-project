"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatCurrency, formatPercent } from "@/shared/utils";

import type { StockTicker } from "../types";

type MarketWatchlistProps = {
  items: StockTicker[];
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

export function MarketWatchlist({ items }: MarketWatchlistProps) {
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
    return <p className="text-xs text-terminal-text-dim">No watchlist data available.</p>;
  }

  const performance = simulatedPerformance(selectedItem?.symbol ?? "MKT", selectedItem?.changePercent ?? 0);

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
            const href = `/markets/${encodeURIComponent(item.symbol)}?asset=${item.assetType ?? "equity"}${item.exchange ? `&exchange=${encodeURIComponent(item.exchange)}` : ""}`;

            return (
              <Link
                key={item.symbol}
                href={href}
                onMouseEnter={() => setSelectedSymbol(item.symbol)}
                onFocus={() => setSelectedSymbol(item.symbol)}
                className={`grid w-full grid-cols-[1.15fr_1fr_0.95fr_0.8fr] gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-terminal-border/28 text-terminal-text"
                    : "text-terminal-text-dim hover:bg-terminal-border/20 hover:text-terminal-text"
                }`}
              >
                <span className="truncate font-medium">{item.symbol}</span>
                <span className="truncate">{formatCurrency(item.price)}</span>
                <span className={isPositive ? "text-terminal-green" : "text-terminal-red"}>{asSigned(changeValue)}</span>
                <span className={isPositive ? "text-terminal-green" : "text-terminal-red"}>
                  {change >= 0 ? "+" : ""}
                  {formatPercent(change)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {selectedItem ? (
        <section className="rounded-xl border border-terminal-border bg-terminal-bg/55 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-muted">Current Stock</p>
          <h4 className="mt-1 text-lg font-semibold tracking-wide text-terminal-text">{selectedItem.symbol}</h4>
          <p className="mt-3 text-3xl font-semibold text-terminal-text">{formatCurrency(selectedItem.price)}</p>
          <p className={`mt-1 text-sm font-medium ${(selectedItem.changePercent ?? 0) >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
            {(selectedItem.changePercent ?? 0) >= 0 ? "+" : ""}
            {formatPercent(selectedItem.changePercent ?? 0)}
          </p>
          <p className="mt-2 text-xs text-terminal-text-muted">Live watchlist pulse based on current market feed.</p>
          <Link
            href={`/markets/${encodeURIComponent(selectedItem.symbol)}?asset=${selectedItem.assetType ?? "equity"}${selectedItem.exchange ? `&exchange=${encodeURIComponent(selectedItem.exchange)}` : ""}`}
            className="mt-3 inline-flex rounded-full border border-terminal-cyan/40 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-terminal-cyan transition-colors hover:bg-terminal-cyan/10"
          >
            Open chart and analysis
          </Link>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {performance.map((item) => (
              <div
                key={item.windowName}
                className={`rounded-md border px-2 py-1.5 text-center ${
                  item.value >= 0
                    ? "border-terminal-green/20 bg-terminal-green/8 text-terminal-green"
                    : "border-terminal-red/20 bg-terminal-red/8 text-terminal-red"
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
