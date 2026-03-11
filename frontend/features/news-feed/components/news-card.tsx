import type { FeedNewsItem } from "../types";

type NewsCardProps = {
  item: FeedNewsItem;
};

export function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="rounded border border-terminal-border bg-terminal-surface p-3">
      <p className="text-sm text-terminal-text">{item.title}</p>
      <p className="mt-1 text-xs text-terminal-text-dim">{item.source || "Unknown source"}</p>
    </article>
  );
}
