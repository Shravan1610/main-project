import type { NewsItem } from "../types";

type NewsSummaryProps = {
  news: NewsItem[];
};

export function NewsSummary({ news }: NewsSummaryProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-3">
      <p className="mb-2 text-sm text-terminal-text">Recent News</p>
      <ul className="space-y-1 text-xs text-terminal-text-dim">
        {news.slice(0, 3).map((item, index) => (
          <li key={`${item.title}-${index}`}>• {item.title}</li>
        ))}
        {news.length === 0 ? <li>No recent news</li> : null}
      </ul>
    </div>
  );
}
