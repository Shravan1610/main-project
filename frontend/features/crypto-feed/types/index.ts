export type CryptoTicker = {
  symbol: string;
  price: number;
  changePercent?: number;
  name?: string;
  exchange?: string;
  assetType?: "crypto";
};

export type CryptoFeedState = {
  items: CryptoTicker[];
  loading: boolean;
  error: string | null;
};
