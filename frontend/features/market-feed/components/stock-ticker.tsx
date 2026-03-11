import { formatCurrency, formatPercent } from "@/shared/utils";

import type { StockTicker } from "../types";

type StockTickerProps = {
  item: StockTicker;
};

export function StockTicker({ item }: StockTickerProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface px-3 py-2 text-xs">
      <p className="font-medium text-terminal-text">{item.symbol}</p>
      <p className="text-terminal-text-dim">{formatCurrency(item.price)}</p>
      <p className="text-terminal-text-dim">{formatPercent(item.changePercent ?? 0)}</p>
    </div>
  );
}
