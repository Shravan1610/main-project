import { formatCurrency, formatPercent } from "@/shared/utils";

import type { CryptoTicker as CryptoTickerType } from "../types";

type CryptoTickerProps = {
  item: CryptoTickerType;
};

export function CryptoTicker({ item }: CryptoTickerProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface px-3 py-2 text-xs">
      <p className="font-medium text-terminal-text">{item.symbol}</p>
      <p className="text-terminal-text-dim">{formatCurrency(item.price)}</p>
      <p className="text-terminal-text-dim">{formatPercent(item.changePercent ?? 0)}</p>
    </div>
  );
}
