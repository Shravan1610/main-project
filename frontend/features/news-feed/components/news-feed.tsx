import { NewsCard } from "./news-card";
import type { FeedNewsItem } from "../types";

type NewsFeedProps = {
  items: FeedNewsItem[];
};

export function NewsFeed({ items }: NewsFeedProps) {
  return (
    <div className="grid gap-2">
      {items.slice(0, 6).map((item, index) => (
        <NewsCard key={`${item.title}-${index}`} item={item} />
      ))}
      {items.length === 0 ? <p className="text-xs text-terminal-text-dim">No news available.</p> : null}
    </div>
  );
}
