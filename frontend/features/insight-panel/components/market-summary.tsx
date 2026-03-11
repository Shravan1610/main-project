import { formatNumber, formatPercent } from "@/shared/utils";

import type { MarketSnapshot } from "../types";

type MarketSummaryProps = {
  market: MarketSnapshot;
};

export function MarketSummary({ market }: MarketSummaryProps) {
  const currency = market.currency || "USD";
  const change = Number.isFinite(market.changePercent) ? market.changePercent : 0;
  const changeClassName = change > 0 ? "text-terminal-green" : change < 0 ? "text-terminal-red" : "text-terminal-text-dim";
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(market.price) ? market.price : 0);

  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-3 text-sm">
      <p className="text-terminal-text">Price: {formattedPrice}</p>
      <p className={changeClassName}>Change: {change > 0 ? "+" : ""}{formatPercent(change)}</p>
      {market.exchange ? <p className="text-terminal-text-dim">Exchange: {market.exchange}</p> : null}
      {typeof market.marketCap === "number" ? <p className="text-terminal-text-dim">Market Cap: {formatNumber(market.marketCap)}</p> : null}
      {typeof market.volume === "number" ? <p className="text-terminal-text-dim">Volume: {formatNumber(market.volume)}</p> : null}
    </div>
  );
}
