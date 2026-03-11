import { StockTicker } from "./stock-ticker";
import type { StockTicker as StockTickerType } from "../types";

type MarketFeedProps = {
  items: StockTickerType[];
};

export function MarketFeed({ items }: MarketFeedProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.slice(0, 8).map((item) => (
        <StockTicker key={item.symbol} item={item} />
      ))}
      {items.length === 0 ? <p className="text-xs text-terminal-text-dim">No market data available.</p> : null}
    </div>
  );
}
