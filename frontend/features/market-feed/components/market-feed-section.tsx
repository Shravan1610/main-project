"use client";

import { MarketFeed } from "./market-feed";
import { useMarketFeed } from "../hooks";

export function MarketFeedSection() {
  const { data, loading, error } = useMarketFeed(true);

  if (loading) {
    return <div className="text-sm text-terminal-text-dim">Loading market feed...</div>;
  }

  if (error) {
    return <div className="text-sm text-terminal-red">Failed to load market feed.</div>;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-terminal-text">Market Feed</h3>
      <MarketFeed items={data ?? []} />
    </section>
  );
}
