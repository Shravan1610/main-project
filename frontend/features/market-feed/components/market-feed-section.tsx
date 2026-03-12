"use client";

import { MarketWatchlist } from "./market-watchlist";
import { useMarketFeed } from "../hooks";
import { MacWindow } from "@/shared/components/mac-window";

export function MarketFeedSection() {
  const { data, loading, error } = useMarketFeed(true);

  return (
    <MacWindow title="Watchlist" bodyClassName="p-4">
      {loading ? <div className="text-sm text-terminal-text-dim">Loading market feed...</div> : null}
      {error ? <div className="text-sm text-terminal-red">Failed to load market feed.</div> : null}
      {!loading && !error ? <MarketWatchlist items={data ?? []} /> : null}
    </MacWindow>
  );
}
