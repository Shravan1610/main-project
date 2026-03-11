import type { CryptoTicker } from "../types";

const COINGECKO_MARKETS_ENDPOINT = "https://api.coingecko.com/api/v3/coins/markets";
const COIN_IDS = ["bitcoin", "ethereum", "solana", "ripple", "binancecoin", "dogecoin", "cardano", "tron"];

export async function getCryptoFeed(): Promise<CryptoTicker[]> {
  const query = new URLSearchParams({
    vs_currency: "usd",
    ids: COIN_IDS.join(","),
    order: "market_cap_desc",
    per_page: String(COIN_IDS.length),
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  const response = await fetch(`${COINGECKO_MARKETS_ENDPOINT}?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    symbol: string;
    current_price: number;
    price_change_percentage_24h_in_currency: number | null;
  }>;

  return payload.map((coin) => ({
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price,
    changePercent: coin.price_change_percentage_24h_in_currency ?? 0,
  }));
}
