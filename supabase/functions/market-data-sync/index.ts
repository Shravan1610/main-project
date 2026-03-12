import { createClient } from "npm:@supabase/supabase-js@2";

type AssetType =
  | "equity"
  | "etf"
  | "index"
  | "crypto"
  | "forex"
  | "commodity";

type MarketSyncRequest = {
  symbol?: string;
  assetType?: AssetType;
  exchange?: string;
  market?: string;
  name?: string;
  timeframe?: "1d" | "1w" | "1M";
};

type AlphaVantageValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY") ?? "";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function normalizedExchange(exchange?: string | null) {
  const value = exchange?.trim().toUpperCase();
  if (!value) return null;
  if (value.includes("NSE")) return "NSE";
  if (value.includes("BSE")) return "BSE";
  if (value.includes("NYSE")) return "NYSE";
  if (value.includes("NASDAQ")) return "NASDAQ";
  return value;
}

function slugFromSymbol(symbol: string, exchange?: string | null) {
  const exchangeCode = normalizedExchange(exchange);
  const raw = exchangeCode === "NSE" || exchangeCode === "BSE"
    ? `${symbol}-${exchangeCode}`
    : symbol;

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function providerSymbol(symbol: string, exchange?: string | null) {
  if (symbol.includes(".")) return symbol;

  const exchangeCode = normalizedExchange(exchange);
  if (exchangeCode === "NSE" || exchangeCode === "BSE") {
    return `${symbol}.${exchangeCode}`;
  }

  return symbol;
}

function defaultTvSymbol(symbol: string, assetType: AssetType, exchange?: string | null) {
  const exchangeCode = normalizedExchange(exchange);

  if (exchangeCode) {
    return `${exchangeCode}:${symbol}`;
  }

  if (assetType === "crypto") {
    return `BITSTAMP:${symbol}USD`;
  }

  return `NASDAQ:${symbol}`;
}

function alphaVantageFunctionForTimeframe(timeframe: "1d" | "1w" | "1M") {
  switch (timeframe) {
    case "1w":
      return "WEEKLY_ADJUSTED";
    case "1M":
      return "MONTHLY_ADJUSTED";
    case "1d":
    default:
      return "TIME_SERIES_DAILY_ADJUSTED";
  }
}

function alphaVantageSeriesKey(timeframe: "1d" | "1w" | "1M") {
  switch (timeframe) {
    case "1w":
      return "Weekly Adjusted Time Series";
    case "1M":
      return "Monthly Adjusted Time Series";
    case "1d":
    default:
      return "Time Series (Daily)";
  }
}

function calculateSma(values: number[], period: number) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((total, value) => total + value, 0) / period;
}

function calculateRsi(values: number[], period = 14) {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;

  for (let index = values.length - period; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    const delta = current - previous;

    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  if (losses === 0) return 100;

  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
}

function calculateEma(values: number[], period: number) {
  if (values.length < period) return null;

  const multiplier = 2 / (period + 1);
  let ema = values[values.length - period];

  for (let index = values.length - period + 1; index < values.length; index += 1) {
    ema = (values[index] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateTechnicals(candles: AlphaVantageValue[]) {
  const closes = candles
    .map((candle) => asNumber(candle.close))
    .filter((value): value is number => value !== null);
  const highs = candles
    .map((candle) => asNumber(candle.high))
    .filter((value): value is number => value !== null);
  const lows = candles
    .map((candle) => asNumber(candle.low))
    .filter((value): value is number => value !== null);

  const lastClose = closes.at(-1) ?? null;
  const sma20 = calculateSma(closes, 20);
  const sma50 = calculateSma(closes, 50);
  const sma200 = calculateSma(closes, 200);
  const ema12 = calculateEma(closes, 12);
  const ema26 = calculateEma(closes, 26);
  const macd = ema12 !== null && ema26 !== null ? ema12 - ema26 : null;
  const rsi = calculateRsi(closes, 14);
  const support =
    lows.length >= 20 ? Math.min(...lows.slice(-20)) : lows.at(-1) ?? null;
  const resistance =
    highs.length >= 20 ? Math.max(...highs.slice(-20)) : highs.at(-1) ?? null;

  let trend = "neutral";
  if (lastClose !== null && sma50 !== null && sma200 !== null) {
    if (lastClose > sma50 && sma50 > sma200) trend = "bullish";
    else if (lastClose < sma50 && sma50 < sma200) trend = "bearish";
    else trend = "mixed";
  }

  let signal = "hold";
  if (rsi !== null) {
    if (rsi < 30) signal = "oversold";
    else if (rsi > 70) signal = "overbought";
  }

  return {
    signal,
    trend,
    rsi,
    sma20,
    sma50,
    sma200,
    macd,
    support,
    resistance,
  };
}

async function fetchAlphaVantageSeries(
  symbol: string,
  exchange: string | undefined,
  timeframe: "1d" | "1w" | "1M",
) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("ALPHA_VANTAGE_API_KEY is not configured.");
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", alphaVantageFunctionForTimeframe(timeframe));
  url.searchParams.set("symbol", providerSymbol(symbol, exchange));
  url.searchParams.set("apikey", ALPHA_VANTAGE_API_KEY);

  if (timeframe === "1d") {
    url.searchParams.set("outputsize", "full");
  }

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok || payload?.Note || payload?.Information || payload?.["Error Message"]) {
    throw new Error(
      payload?.["Error Message"] ??
        payload?.Information ??
        payload?.Note ??
        "Alpha Vantage time series request failed.",
    );
  }

  const series = payload?.[alphaVantageSeriesKey(timeframe)] as
    | Record<string, Record<string, string>>
    | undefined;

  if (!series) {
    throw new Error("Alpha Vantage time series payload was empty.");
  }

  const values: AlphaVantageValue[] = Object.entries(series)
    .map(([datetime, row]) => ({
      datetime,
      open: row["1. open"],
      high: row["2. high"],
      low: row["3. low"],
      close: row["4. close"],
      volume: row["6. volume"] ?? row["5. volume"],
    }))
    .sort((left, right) => left.datetime.localeCompare(right.datetime));

  return {
    values,
  };
}

async function fetchAlphaVantageOverview(symbol: string, exchange?: string) {
  if (!ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "OVERVIEW");
  url.searchParams.set("symbol", providerSymbol(symbol, exchange));
  url.searchParams.set("apikey", ALPHA_VANTAGE_API_KEY);

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok || payload?.Note || payload?.Information) {
    return null;
  }

  if (!payload?.Symbol) {
    return null;
  }

  return payload as Record<string, string>;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "Supabase service credentials are not configured." },
      500,
    );
  }

  try {
    const body = (await request.json()) as MarketSyncRequest;
    const symbol = body.symbol?.trim().toUpperCase();
    const assetType = body.assetType ?? "equity";
    const timeframe = body.timeframe ?? "1d";

    if (!symbol) {
      return jsonResponse({ error: "symbol is required" }, 400);
    }

    if (!["equity", "etf", "index"].includes(assetType)) {
      return jsonResponse(
        { error: "Alpha Vantage sync currently supports equities, ETFs, and indexes only." },
        400,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [seriesPayload, overview] = await Promise.all([
      fetchAlphaVantageSeries(symbol, body.exchange, timeframe),
      fetchAlphaVantageOverview(symbol, body.exchange),
    ]);

    const values = [...seriesPayload.values];
    if (values.length === 0) {
      return jsonResponse({ error: "No candle data returned by provider." }, 404);
    }

    const technicals = calculateTechnicals(values);
    const latestClose = asNumber(values.at(-1)?.close);
    const previousClose = asNumber(values.at(-2)?.close);
    const changePercent =
      latestClose !== null && previousClose !== null && previousClose !== 0
        ? ((latestClose - previousClose) / previousClose) * 100
        : null;

    const fundamentals = overview
      ? {
          market_cap: asNumber(overview.MarketCapitalization),
          pe_ratio: asNumber(overview.PERatio),
          peg_ratio: asNumber(overview.PEGRatio),
          eps: asNumber(overview.EPS),
          dividend_yield: asNumber(overview.DividendYield),
          beta: asNumber(overview.Beta),
          book_value: asNumber(overview.BookValue),
          revenue_ttm: asNumber(overview.RevenueTTM),
          profit_margin: asNumber(overview.ProfitMargin),
          gross_margin: asNumber(overview.GrossProfitTTM),
          operating_margin: asNumber(overview.OperatingMarginTTM),
          debt_to_equity: asNumber(overview.DebtToEquity),
        }
      : {};

    const exchangeCode = normalizedExchange(body.exchange ?? overview?.Exchange ?? null);
    const profile = overview
      ? {
          summary: overview.Description ?? "",
          analyst_target_price: asNumber(overview.AnalystTargetPrice),
          country: overview.Country ?? null,
          sector: overview.Sector ?? null,
          industry: overview.Industry ?? null,
          asset_type: overview.AssetType ?? null,
        }
      : {};

    const instrumentPayload = {
      symbol,
      slug: slugFromSymbol(symbol, exchangeCode),
      name: overview?.Name ?? body.name ?? symbol,
      asset_type: assetType,
      tv_symbol: defaultTvSymbol(symbol, assetType, exchangeCode),
      exchange: exchangeCode,
      market: body.market ?? exchangeCode,
      country: overview?.Country ?? null,
      currency: overview?.Currency ?? "USD",
      sector: overview?.Sector ?? null,
      industry: overview?.Industry ?? null,
      description: overview?.Description ?? null,
      last_price: latestClose,
      change_percent: changePercent,
      source: "alpha-vantage",
      last_synced_at: new Date().toISOString(),
      fundamentals,
      technicals,
      profile,
      updated_at: new Date().toISOString(),
    };

    const { data: instrumentRows, error: instrumentError } = await supabase
      .from("market_instruments")
      .upsert(instrumentPayload, { onConflict: "slug" })
      .select("id,symbol,slug,name,asset_type,tv_symbol,exchange,market,country,currency,sector,industry,description,last_price,change_percent,last_synced_at,fundamentals,technicals,profile")
      .limit(1);

    if (instrumentError || !instrumentRows?.[0]) {
      throw new Error(instrumentError?.message ?? "Failed to upsert instrument.");
    }

    const instrumentId = instrumentRows[0].id as string;
    const candles = values.map((item) => ({
      instrument_id: instrumentId,
      timeframe,
      ts: new Date(item.datetime).toISOString(),
      open: asNumber(item.open),
      high: asNumber(item.high),
      low: asNumber(item.low),
      close: asNumber(item.close),
      volume: asNumber(item.volume),
      source: "alpha-vantage",
    }));

    const { error: candleError } = await supabase
      .from("market_candles")
      .upsert(candles, { onConflict: "instrument_id,timeframe,ts" });

    if (candleError) {
      throw new Error(candleError.message);
    }

    return jsonResponse({
      instrument: instrumentRows[0],
      candleCount: candles.length,
      timeframe,
      provider: "alpha-vantage",
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown market sync error",
      },
      500,
    );
  }
});
