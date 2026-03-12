"use client";

import { useCallback } from "react";

import { useApi } from "@/shared/hooks";

import { getMarketDetail } from "../services";
import type { MarketDetailLookup, MarketTimeframe } from "../types";

export function useMarketDetail(
  symbol: string,
  timeframe: MarketTimeframe,
  lookup?: MarketDetailLookup,
) {
  const assetType = lookup?.assetType;
  const exchange = lookup?.exchange;
  const market = lookup?.market;
  const name = lookup?.name;

  const fetcher = useCallback(
    () =>
      getMarketDetail(symbol, timeframe, {
        assetType,
        exchange,
        market,
        name,
      }),
    [assetType, exchange, market, name, symbol, timeframe],
  );

  return useApi(fetcher, {
    enabled: Boolean(symbol),
    initialData: null,
    refreshIntervalMs: 120_000,
    pauseWhenHidden: true,
  });
}
