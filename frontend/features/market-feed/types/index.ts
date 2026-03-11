export type StockTicker = {
  symbol: string;
  price: number;
  changePercent?: number;
};

export type MarketFeedState = {
  items: StockTicker[];
  loading: boolean;
  error: string | null;
};
