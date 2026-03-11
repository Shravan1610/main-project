export type StockTicker = {
  symbol: string;
  price: number;
  changePercent?: number;
  name?: string;
  exchange?: string;
  assetType?: "equity" | "etf" | "index";
};

export type MarketFeedState = {
  items: StockTicker[];
  loading: boolean;
  error: string | null;
};
