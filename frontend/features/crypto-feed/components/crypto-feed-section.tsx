"use client";

import { CryptoWatchlist } from "./crypto-watchlist";
import { useCryptoFeed } from "../hooks";

export function CryptoFeedSection() {
  const { data, loading, error } = useCryptoFeed(true);

  if (loading) {
    return <div className="text-sm text-terminal-text-dim">Loading crypto feed...</div>;
  }

  if (error) {
    return <div className="text-sm text-terminal-red">Failed to load crypto feed.</div>;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-terminal-text">Crypto Feed</h3>
      <CryptoWatchlist items={data ?? []} />
    </section>
  );
}
