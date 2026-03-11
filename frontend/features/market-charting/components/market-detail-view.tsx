"use client";

import Link from "next/link";
import { useState } from "react";

import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/shared/utils";

import { MarketChart } from "./market-chart";
import { useMarketDetail } from "../hooks";
import type {
  MarketAssetType,
  MarketDetailLookup,
  MarketInstrument,
  MarketTimeframe,
} from "../types";

type MarketDetailViewProps = {
  symbol: string;
  assetType?: MarketAssetType;
  exchange?: string | null;
};

const TIMEFRAMES: MarketTimeframe[] = ["1d", "1w", "1M"];

const TECHNICAL_LABELS: Record<string, string> = {
  signal: "Signal",
  trend: "Trend",
  rsi: "RSI",
  macd: "MACD",
  macd_signal: "MACD Signal",
  sma20: "SMA 20",
  sma50: "SMA 50",
  sma200: "SMA 200",
  ema20: "EMA 20",
  ema50: "EMA 50",
  support: "Support",
  resistance: "Resistance",
};

const FUNDAMENTAL_LABELS: Record<string, string> = {
  market_cap: "Market Cap",
  pe_ratio: "P/E Ratio",
  peg_ratio: "PEG Ratio",
  eps: "EPS",
  dividend_yield: "Dividend Yield",
  beta: "Beta",
  revenue_ttm: "Revenue TTM",
  gross_margin: "Gross Margin",
  profit_margin: "Profit Margin",
  operating_margin: "Operating Margin",
  debt_to_equity: "Debt / Equity",
  book_value: "Book Value",
};

function humanizeKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function scalarEntries(
  input: Record<string, unknown>,
  labelMap: Record<string, string>,
) {
  const preferred = Object.entries(labelMap)
    .map(([key, label]) => {
      const value = input[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return { label, value };
      }

      return null;
    })
    .filter((value): value is { label: string; value: string | number | boolean } => Boolean(value));

  if (preferred.length > 0) {
    return preferred;
  }

  return Object.entries(input)
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === "string" ||
        typeof entry[1] === "number" ||
        typeof entry[1] === "boolean",
    )
    .slice(0, 8)
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value,
    }));
}

function renderMetricValue(value: string | number | boolean) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? formatNumber(value) : value.toFixed(2);
  }

  return value;
}

function toNumericValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildTechnicalSummary(
  technicals: Record<string, unknown>,
  instrument: MarketInstrument,
) {
  const rsi = toNumericValue(technicals.rsi);
  const sma50 = toNumericValue(technicals.sma50);
  const sma200 = toNumericValue(technicals.sma200);
  const lastPrice = instrument.lastPrice ?? null;

  if (rsi === null && sma50 === null && sma200 === null) {
    return "Awaiting a synced technical snapshot in Supabase.";
  }

  const momentum =
    rsi !== null
      ? rsi > 70
        ? "overbought"
        : rsi < 30
          ? "oversold"
          : "balanced"
      : "neutral";

  const trend =
    lastPrice !== null && sma50 !== null && sma200 !== null
      ? lastPrice > sma50 && sma50 > sma200
        ? "bullish trend structure"
        : lastPrice < sma50 && sma50 < sma200
          ? "bearish trend structure"
          : "mixed trend structure"
      : "partial trend read";

  return `${instrument.symbol} shows ${trend} with ${momentum} momentum.`;
}

function buildFundamentalSummary(
  fundamentals: Record<string, unknown>,
  instrument: MarketInstrument,
) {
  const marketCap = toNumericValue(fundamentals.market_cap);
  const peRatio = toNumericValue(fundamentals.pe_ratio);
  const profitMargin = toNumericValue(fundamentals.profit_margin);

  if (marketCap === null && peRatio === null && profitMargin === null) {
    return "Awaiting a synced fundamental snapshot in Supabase.";
  }

  const size =
    marketCap !== null && marketCap >= 10_000_000_000
      ? "large-cap"
      : marketCap !== null && marketCap >= 2_000_000_000
        ? "mid-cap"
        : marketCap !== null
          ? "smaller-cap"
          : "unclassified";

  const valuation =
    peRatio !== null
      ? peRatio <= 15
        ? "relatively inexpensive"
        : peRatio >= 30
          ? "richly valued"
          : "moderately valued"
      : "valuation not synced";

  const margin =
    profitMargin !== null
      ? `${profitMargin.toFixed(2)}% profit margin`
      : "profit margin not synced";

  return `${instrument.symbol} currently reads as ${size}, ${valuation}, with ${margin}.`;
}

export function MarketDetailView({
  symbol,
  assetType,
  exchange,
}: MarketDetailViewProps) {
  const [timeframe, setTimeframe] = useState<MarketTimeframe>("1d");
  const lookup: MarketDetailLookup = {
    assetType,
    exchange,
  };
  const { data, loading, error } = useMarketDetail(symbol, timeframe, lookup);

  const instrument = data?.instrument ?? null;
  const technicalEntries = instrument ? scalarEntries(instrument.technicals, TECHNICAL_LABELS) : [];
  const fundamentalEntries = instrument ? scalarEntries(instrument.fundamentals, FUNDAMENTAL_LABELS) : [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-terminal-border bg-terminal-surface px-4 py-3">
        <div>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.18em] text-terminal-cyan transition-opacity hover:opacity-80"
          >
            Back to Monitor
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-wide text-terminal-text">
            {instrument?.name ?? symbol}
          </h1>
          <p className="mt-1 text-sm text-terminal-text-dim">
            {instrument?.symbol ?? symbol}
            {instrument?.exchange ? ` • ${instrument.exchange}` : ""}
            {instrument?.assetType ? ` • ${instrument.assetType}` : ""}
          </p>
        </div>

        {instrument ? (
          <div className="grid gap-2 text-right">
            <p className="text-3xl font-semibold text-terminal-text">
              {formatCurrency(instrument.lastPrice ?? 0)}
            </p>
            <p
              className={`text-sm font-medium ${
                (instrument.changePercent ?? 0) >= 0
                  ? "text-terminal-green"
                  : "text-terminal-red"
              }`}
            >
              {(instrument.changePercent ?? 0) >= 0 ? "+" : ""}
              {formatPercent(instrument.changePercent ?? 0)}
            </p>
            <p className="text-xs text-terminal-text-dim">
              {instrument.lastSyncedAt
                ? `Synced ${formatDate(instrument.lastSyncedAt)}`
                : "Waiting for Supabase sync"}
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-terminal-border bg-terminal-surface p-10 text-center text-sm text-terminal-text-dim">
          Loading chart and analysis from Supabase...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-terminal-red/30 bg-terminal-surface p-6 text-sm text-terminal-red">
          {error.message}
        </div>
      ) : null}

      {data ? (
        <>
          <section className="rounded-2xl border border-terminal-border bg-terminal-surface p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-terminal-text-dim">
                  TradingView Lightweight Charts
                </p>
                <p className="mt-1 text-sm text-terminal-text-dim">
                  Candles loaded from Supabase for {data.instrument.tvSymbol}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeframe(value)}
                    className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
                      timeframe === value
                        ? "border-terminal-cyan bg-terminal-cyan/12 text-terminal-cyan"
                        : "border-terminal-border text-terminal-text-dim hover:text-terminal-text"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <MarketChart candles={data.candles} />
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-terminal-border bg-terminal-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-terminal-text-dim">
                Technical Analysis
              </p>
              <p className="mt-2 text-sm text-terminal-text">{buildTechnicalSummary(data.instrument.technicals, data.instrument)}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {technicalEntries.length > 0 ? (
                  technicalEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-xl border border-terminal-border bg-terminal-bg/45 p-3"
                    >
                      <p className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-dim">
                        {entry.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-terminal-text">
                        {renderMetricValue(entry.value)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-terminal-text-dim">
                    Sync RSI, moving averages, MACD, and support/resistance into the
                    `technicals` JSON column to light this section up.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-terminal-border bg-terminal-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-terminal-text-dim">
                Fundamental Analysis
              </p>
              <p className="mt-2 text-sm text-terminal-text">
                {buildFundamentalSummary(data.instrument.fundamentals, data.instrument)}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {fundamentalEntries.length > 0 ? (
                  fundamentalEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-xl border border-terminal-border bg-terminal-bg/45 p-3"
                    >
                      <p className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-dim">
                        {entry.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-terminal-text">
                        {renderMetricValue(entry.value)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-terminal-text-dim">
                    Sync profile, valuation, margin, and balance-sheet metrics into the
                    `fundamentals` JSON column to populate this section.
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-terminal-border bg-terminal-bg/45 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-dim">
                  Business Context
                </p>
                <p className="mt-2 text-sm text-terminal-text-dim">
                  {data.instrument.description ??
                    (typeof data.instrument.profile.summary === "string"
                      ? data.instrument.profile.summary
                      : "Add a company profile summary in Supabase for richer fundamental context.")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-terminal-text-dim">
                  {data.instrument.sector ? (
                    <span className="rounded-full border border-terminal-border px-2 py-1">
                      Sector: {data.instrument.sector}
                    </span>
                  ) : null}
                  {data.instrument.industry ? (
                    <span className="rounded-full border border-terminal-border px-2 py-1">
                      Industry: {data.instrument.industry}
                    </span>
                  ) : null}
                  {data.instrument.country ? (
                    <span className="rounded-full border border-terminal-border px-2 py-1">
                      Country: {data.instrument.country}
                    </span>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}
