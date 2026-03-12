"use client";

import { CryptoWatchlist } from "./crypto-watchlist";
import { useCryptoFeed } from "../hooks";
import { MacWindow } from "@/shared/components/mac-window";

export function CryptoFeedSection() {
  const { data, loading, error } = useCryptoFeed(true);

  return (
    <MacWindow title="Crypto Feed" bodyClassName="p-4">
      {loading ? <div className="text-sm text-terminal-text-dim">Loading crypto feed...</div> : null}
      {error ? <div className="text-sm text-terminal-red">Failed to load crypto feed.</div> : null}
      {!loading && !error ? <CryptoWatchlist items={data ?? []} /> : null}
    </MacWindow>
  );
}
