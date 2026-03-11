import { formatCurrency, formatPercent } from "@/shared/utils";

import type { MarketSnapshot } from "../types";

type MarketSummaryProps = {
  market: MarketSnapshot;
};

export function MarketSummary({ market }: MarketSummaryProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-3 text-sm">
      <p className="text-terminal-text">Price: {formatCurrency(market.price)}</p>
      <p className="text-terminal-text-dim">Change: {formatPercent(market.changePercent)}</p>
      {market.exchange ? <p className="text-terminal-text-dim">Exchange: {market.exchange}</p> : null}
    </div>
  );
}
