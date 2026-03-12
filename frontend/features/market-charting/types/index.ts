export type MarketAssetType =
  | "equity"
  | "etf"
  | "index"
  | "crypto"
  | "forex"
  | "commodity";

export type MarketTimeframe = "1d" | "1w" | "1M";

export type MarketInstrument = {
  id: string;
  symbol: string;
  slug: string;
  name: string;
  assetType: MarketAssetType;
  tvSymbol: string;
  exchange?: string | null;
  market?: string | null;
  country?: string | null;
  currency: string;
  sector?: string | null;
  industry?: string | null;
  description?: string | null;
  lastPrice?: number | null;
  changePercent?: number | null;
  lastSyncedAt?: string | null;
  fundamentals: Record<string, unknown>;
  technicals: Record<string, unknown>;
  profile: Record<string, unknown>;
};

export type MarketCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
};

export type MarketDetail = {
  instrument: MarketInstrument;
  candles: MarketCandle[];
};

export type MarketDetailLookup = {
  assetType?: MarketAssetType;
  exchange?: string | null;
  market?: string | null;
  name?: string | null;
};
