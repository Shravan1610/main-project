import { CryptoTicker } from "./crypto-ticker";
import type { CryptoTicker as CryptoTickerType } from "../types";

type CryptoFeedProps = {
  items: CryptoTickerType[];
};

export function CryptoFeed({ items }: CryptoFeedProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.slice(0, 8).map((item) => (
        <CryptoTicker key={item.symbol} item={item} />
      ))}
      {items.length === 0 ? <p className="text-xs text-terminal-text-dim">No crypto data available.</p> : null}
    </div>
  );
}
