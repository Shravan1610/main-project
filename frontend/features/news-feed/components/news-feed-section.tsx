"use client";

import { NewsFeed } from "./news-feed";
import { useNewsFeed } from "../hooks";
import { MacWindow } from "@/shared/components/mac-window";

export function NewsFeedSection() {
  const { data, loading, error } = useNewsFeed(true);

  return (
    <MacWindow title="Latest News" bodyClassName="p-4">
      {loading ? <div className="text-sm text-terminal-text-dim">Loading news feed...</div> : null}
      {error ? <div className="text-sm text-terminal-red">Failed to load news feed.</div> : null}
      {!loading && !error ? <NewsFeed items={data ?? []} /> : null}
    </MacWindow>
  );
}
