export type CryptoTicker = {
  symbol: string;
  price: number;
  changePercent?: number;
};

export type CryptoFeedState = {
  items: CryptoTicker[];
  loading: boolean;
  error: string | null;
};
