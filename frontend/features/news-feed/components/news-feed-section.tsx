"use client";

import { NewsFeed } from "./news-feed";
import { useNewsFeed } from "../hooks";

export function NewsFeedSection() {
  const { data, loading, error } = useNewsFeed(true);

  if (loading) {
    return <div className="text-sm text-terminal-text-dim">Loading news feed...</div>;
  }

  if (error) {
    return <div className="text-sm text-terminal-red">Failed to load news feed.</div>;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-terminal-text">Latest News</h3>
      <NewsFeed items={data ?? []} />
    </section>
  );
}
