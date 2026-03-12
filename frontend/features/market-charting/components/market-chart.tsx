"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import type { MarketCandle } from "../types";

type MarketChartProps = {
  candles: MarketCandle[];
};

function toTimestamp(value: string): UTCTimestamp {
  return Math.floor(new Date(value).getTime() / 1000) as UTCTimestamp;
}

export function MarketChart({ candles }: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      height: 460,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a97ab",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(138, 151, 171, 0.08)" },
        horzLines: { color: "rgba(138, 151, 171, 0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(138, 151, 171, 0.18)",
      },
      timeScale: {
        borderColor: "rgba(138, 151, 171, 0.18)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
      priceLineColor: "#22d3ee",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) {
      return;
    }

    seriesRef.current.setData(
      candles.map((candle) => ({
        time: toTimestamp(candle.time),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );

    chartRef.current.timeScale().fitContent();
  }, [candles]);

  if (candles.length === 0) {
    return (
      <div className="flex h-[460px] items-center justify-center rounded-[1.4rem] border border-dashed border-terminal-border bg-terminal-bg/45 px-6 text-center text-sm text-terminal-text-dim">
        No candle data in Supabase yet for this instrument and timeframe.
      </div>
    );
  }

  return (
    <div className="rounded-[1.4rem] border border-terminal-border/80 bg-terminal-bg/30 p-3">
      <div ref={containerRef} className="h-[460px] w-full" />
    </div>
  );
}
