"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
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

type MetricEntry = {
  key: string;
  label: string;
  value: string | number | boolean;
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

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function humanizeKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function scalarEntries(
  input: Record<string, unknown>,
  labelMap: Record<string, string>,
): MetricEntry[] {
  const preferred = Object.entries(labelMap)
    .map(([key, label]) => {
      const value = input[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return { key, label, value };
      }

      return null;
    })
    .filter((value): value is MetricEntry => Boolean(value));

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
      key,
      label: humanizeKey(key),
      value,
    }));
}

function renderMetricValue(entry: MetricEntry) {
  if (typeof entry.value === "boolean") {
    return entry.value ? "Yes" : "No";
  }

  if (typeof entry.value === "number") {
    if (
      entry.key.includes("yield") ||
      entry.key.includes("margin") ||
      entry.key === "rsi"
    ) {
      return entry.key === "rsi"
        ? entry.value.toFixed(2)
        : formatPercent(entry.value);
    }

    if (entry.key === "market_cap" || entry.key === "revenue_ttm") {
      return `$${compactNumberFormatter.format(entry.value)}`;
    }

    if (
      entry.key.includes("sma") ||
      entry.key.includes("ema") ||
      entry.key === "support" ||
      entry.key === "resistance" ||
      entry.key === "book_value" ||
      entry.key === "eps"
    ) {
      return formatCurrency(entry.value);
    }

    return Number.isInteger(entry.value)
      ? formatNumber(entry.value)
      : entry.value.toFixed(2);
  }

  return entry.value;
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

function toStringValue(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return null;
}

function sentimentClass(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return "text-terminal-text";
  }

  return value > 0 ? "text-terminal-green" : "text-terminal-red";
}

function badgeClass(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return "border-terminal-border bg-terminal-bg/60 text-terminal-text-dim";
  }

  return value > 0
    ? "border-terminal-green/25 bg-terminal-green/10 text-terminal-green"
    : "border-terminal-red/25 bg-terminal-red/10 text-terminal-red";
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

function summaryMetric(
  label: string,
  value: string | null,
  tone?: "default" | "positive" | "negative",
) {
  const toneClass =
    tone === "positive"
      ? "text-terminal-green"
      : tone === "negative"
        ? "text-terminal-red"
        : "text-terminal-text";

  return (
    <div
      key={label}
      className="rounded-2xl border border-terminal-border/80 bg-terminal-bg/45 px-4 py-3"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
        {label}
      </p>
      <p className={`mt-2 text-sm font-medium ${toneClass}`}>
        {value ?? "Waiting for sync"}
      </p>
    </div>
  );
}

function metricCard(entry: MetricEntry) {
  return (
    <div
      key={entry.label}
      className="rounded-2xl border border-terminal-border/80 bg-terminal-bg/45 px-4 py-3"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
        {entry.label}
      </p>
      <p className="mt-2 text-lg font-semibold text-terminal-text">
        {renderMetricValue(entry)}
      </p>
    </div>
  );
}

function sectionHeader(
  eyebrow: string,
  title: string,
  description: string,
) {
  return (
    <div className="border-b border-terminal-border/80 px-4 py-4 md:px-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-terminal-text-muted">
        {eyebrow}
      </p>
      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h2 className="text-lg font-semibold tracking-[0.06em] text-terminal-text">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-terminal-text-dim">
          {description}
        </p>
      </div>
    </div>
  );
}

export function MarketDetailView({
  symbol,
  assetType,
  exchange,
}: MarketDetailViewProps) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<MarketTimeframe>("1d");
  const lookup: MarketDetailLookup = {
    assetType,
    exchange,
  };
  const { data, loading, error } = useMarketDetail(symbol, timeframe, lookup);

  const instrument = data?.instrument ?? null;
  const technicalEntries = instrument ? scalarEntries(instrument.technicals, TECHNICAL_LABELS) : [];
  const fundamentalEntries = instrument ? scalarEntries(instrument.fundamentals, FUNDAMENTAL_LABELS) : [];

  const priceChange = instrument?.changePercent ?? null;
  const technicalSignal = toStringValue(instrument?.technicals.signal);
  const technicalTrend = toStringValue(instrument?.technicals.trend);
  const rsi = toNumericValue(instrument?.technicals.rsi);
  const marketCap = toNumericValue(instrument?.fundamentals.market_cap);
  const summary = instrument?.description
    ?? toStringValue(instrument?.profile.summary)
    ?? "A synced company summary will appear here once the market profile is enriched in Supabase.";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-5 p-4 md:p-6">
      <section className="terminal-surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border/80 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                  return;
                }

                router.push("/");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-terminal-border bg-terminal-bg/60 px-2.5 py-1 text-terminal-text-dim transition-colors hover:border-terminal-cyan/35 hover:text-terminal-text"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span className="truncate text-terminal-text-dim">
              Markets / {instrument?.symbol ?? symbol}
            </span>
          </div>
          <span className="truncate">
            {instrument?.exchange ?? exchange ?? "Direct feed"}
            {" · "}
            {instrument?.assetType ?? assetType ?? "market"}
          </span>
        </div>

        <div className="grid gap-6 p-4 md:p-5 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-terminal-text-muted">
              Market Snapshot
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[0.08em] text-terminal-text md:text-[2.5rem]">
              {instrument?.name ?? symbol}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-terminal-text-dim">
              {summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-terminal-text-dim">
              {instrument?.sector ? (
                <span className="rounded-full border border-terminal-border bg-terminal-bg/45 px-3 py-1.5">
                  {instrument.sector}
                </span>
              ) : null}
              {instrument?.industry ? (
                <span className="rounded-full border border-terminal-border bg-terminal-bg/45 px-3 py-1.5">
                  {instrument.industry}
                </span>
              ) : null}
              {instrument?.country ? (
                <span className="rounded-full border border-terminal-border bg-terminal-bg/45 px-3 py-1.5">
                  {instrument.country}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {summaryMetric("Signal", technicalSignal)}
              {summaryMetric("Trend", technicalTrend)}
              {summaryMetric(
                "RSI",
                rsi !== null ? rsi.toFixed(2) : null,
                rsi !== null && rsi >= 70 ? "negative" : rsi !== null && rsi <= 30 ? "positive" : "default",
              )}
              {summaryMetric(
                "Market Cap",
                marketCap !== null ? `$${compactNumberFormatter.format(marketCap)}` : null,
              )}
            </div>
          </div>

          <aside className="rounded-[1.35rem] border border-terminal-border/80 bg-terminal-bg/55 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
                  Last Price
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-[0.06em] text-terminal-text">
                  {instrument?.lastPrice !== null && instrument?.lastPrice !== undefined
                    ? formatCurrency(instrument.lastPrice)
                    : "Waiting"}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${badgeClass(priceChange)}`}
              >
                {priceChange !== null && priceChange !== undefined
                  ? `${priceChange >= 0 ? "+" : ""}${formatPercent(priceChange)}`
                  : "No change"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-terminal-border/80 bg-terminal-surface/65 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
                  Sync Status
                </p>
                <p className="mt-2 text-sm text-terminal-text">
                  {instrument?.lastSyncedAt
                    ? `Synced ${formatDate(instrument.lastSyncedAt)}`
                    : "Waiting for Supabase sync"}
                </p>
              </div>
              <div className="rounded-2xl border border-terminal-border/80 bg-terminal-surface/65 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
                  Session Move
                </p>
                <p className={`mt-2 text-sm font-medium ${sentimentClass(priceChange)}`}>
                  {priceChange !== null && priceChange !== undefined
                    ? `${priceChange >= 0 ? "+" : ""}${formatPercent(priceChange)} from prior close`
                    : "Move pending live snapshot"}
                </p>
              </div>
              <div className="rounded-2xl border border-terminal-border/80 bg-terminal-surface/65 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">
                  Trading Symbol
                </p>
                <p className="mt-2 text-sm text-terminal-text">
                  {instrument?.tvSymbol ?? instrument?.symbol ?? symbol}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {loading ? (
        <div className="terminal-surface px-4 py-10 text-center text-sm text-terminal-text-dim">
          Loading chart and analysis from Supabase...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-terminal-red/30 bg-terminal-surface px-4 py-6 text-sm text-terminal-red">
          {error.message}
        </div>
      ) : null}

      {data ? (
        <>
          <section className="terminal-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border/80 px-4 py-4 md:px-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-terminal-text-muted">
                  Price Action
                </p>
                <p className="mt-2 text-sm text-terminal-text-dim">
                  Candles loaded from Supabase for {data.instrument.tvSymbol}
                </p>
              </div>

              <div className="inline-flex rounded-full border border-terminal-border bg-terminal-bg/50 p-1">
                {TIMEFRAMES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeframe(value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                      timeframe === value
                        ? "bg-terminal-surface text-terminal-text shadow-sm"
                        : "text-terminal-text-dim hover:text-terminal-text"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-5">
              <MarketChart candles={data.candles} />
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="terminal-surface overflow-hidden">
              {sectionHeader(
                "Technical Analysis",
                "Trend, momentum, and key price levels",
                buildTechnicalSummary(data.instrument.technicals, data.instrument),
              )}

              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 md:p-5">
                {technicalEntries.length > 0 ? (
                  technicalEntries.map(metricCard)
                ) : (
                  <p className="rounded-2xl border border-terminal-border/80 bg-terminal-bg/45 px-4 py-4 text-sm text-terminal-text-dim">
                    Sync RSI, moving averages, MACD, and support or resistance into the
                    `technicals` column to populate this terminal.
                  </p>
                )}
              </div>
            </section>

            <section className="terminal-surface overflow-hidden">
              {sectionHeader(
                "Fundamental Analysis",
                "Valuation, profitability, and balance-sheet context",
                buildFundamentalSummary(data.instrument.fundamentals, data.instrument),
              )}

              <div className="grid gap-3 p-4 sm:grid-cols-2 md:p-5">
                {fundamentalEntries.length > 0 ? (
                  fundamentalEntries.map(metricCard)
                ) : (
                  <p className="rounded-2xl border border-terminal-border/80 bg-terminal-bg/45 px-4 py-4 text-sm text-terminal-text-dim">
                    Sync profile, valuation, margin, and balance-sheet metrics into the
                    `fundamentals` column to populate this terminal.
                  </p>
                )}
              </div>

              <div className="border-t border-terminal-border/80 px-4 py-4 md:px-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-terminal-text-muted">
                  Business Context
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-terminal-text-dim">
                  {summary}
                </p>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}
