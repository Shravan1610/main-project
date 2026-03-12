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
  assetTypes?: AssetType[];
  exchange?: string;
  market?: string;
  name?: string;
  timeframe?: "1d" | "1w" | "1M";
  refreshTracked?: boolean;
  limit?: number;
};

type EodhdCandle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
};

type TwelveDataValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type CandleValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type LiveQuote = {
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  volume: number | null;
  currency: string | null;
};

type TrackedInstrumentRow = {
  symbol: string;
  asset_type: AssetType;
  exchange?: string | null;
  market?: string | null;
  name?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EODHD_API_KEY = Deno.env.get("EODHD_API_KEY") ?? Deno.env.get("MARKET_API_KEY") ?? "";
const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";
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

function eodhdExchangeCode(exchange?: string | null) {
  const code = normalizedExchange(exchange);
  if (code === "NSE") return "NSE";
  if (code === "BSE") return "BSE";
  if (code === "NYSE") return "US";
  if (code === "NASDAQ") return "US";
  return "US";
}

function eodhdPeriod(tf: "1d" | "1w" | "1M") {
  if (tf === "1w") return "w";
  if (tf === "1M") return "m";
  return "d";
}

function intervalForTimeframe(timeframe: "1d" | "1w" | "1M") {
  switch (timeframe) {
    case "1w":
      return "1week";
    case "1M":
      return "1month";
    case "1d":
    default:
      return "1day";
  }
}

function outputSizeForTimeframe(timeframe: "1d" | "1w" | "1M") {
  switch (timeframe) {
    case "1w":
      return 260;
    case "1M":
      return 120;
    case "1d":
    default:
      return 365;
  }
}

function providerSymbol(symbol: string, assetType: AssetType) {
  if (assetType === "crypto" && !symbol.includes("/")) {
    return `${symbol}/USD`;
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

function calculateTechnicals(candles: CandleValue[]) {
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

async function fetchEodSeries(
  symbol: string,
  exchange: string | undefined,
  timeframe: "1d" | "1w" | "1M",
): Promise<CandleValue[]> {
  if (!EODHD_API_KEY) {
    throw new Error("EODHD_API_KEY is not configured.");
  }

  const exchangeCode = eodhdExchangeCode(exchange);
  const ticker = `${symbol}.${exchangeCode}`;
  const url = new URL(`https://eodhd.com/api/eod/${ticker}`);
  url.searchParams.set("api_token", EODHD_API_KEY);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("period", eodhdPeriod(timeframe));

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `EODHD EOD request failed with status ${response.status}`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("EODHD returned no candle data.");
  }

  return (payload as EodhdCandle[])
    .map((row) => ({
      datetime: row.date,
      open: String(row.open),
      high: String(row.high),
      low: String(row.low),
      close: String(row.adjusted_close ?? row.close),
      volume: String(row.volume),
    }))
    .sort((left, right) => left.datetime.localeCompare(right.datetime));
}

async function fetchTwelveDataSeries(
  symbol: string,
  assetType: AssetType,
  timeframe: "1d" | "1w" | "1M",
): Promise<CandleValue[]> {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error("No market data API key is configured for series sync.");
  }

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", providerSymbol(symbol, assetType));
  url.searchParams.set("interval", intervalForTimeframe(timeframe));
  url.searchParams.set("outputsize", String(outputSizeForTimeframe(timeframe)));
  url.searchParams.set("apikey", TWELVE_DATA_API_KEY);

  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.status === "error") {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : "Twelve Data request failed.",
    );
  }

  const values = Array.isArray((payload as { values?: TwelveDataValue[] } | null)?.values)
    ? [...((payload as { values: TwelveDataValue[] }).values)].reverse()
    : [];

  if (values.length === 0) {
    throw new Error("Twelve Data returned no candle data.");
  }

  return values;
}

async function fetchEodFundamentals(
  symbol: string,
  exchange?: string,
): Promise<Record<string, unknown> | null> {
  if (!EODHD_API_KEY) return null;

  const exchangeCode = eodhdExchangeCode(exchange);
  const ticker = `${symbol}.${exchangeCode}`;
  const url = new URL(`https://eodhd.com/api/fundamentals/${ticker}`);
  url.searchParams.set("api_token", EODHD_API_KEY);
  url.searchParams.set("fmt", "json");

  const response = await fetch(url);
  if (!response.ok) return null;

  const payload = await response.json();
  if (!payload || typeof payload !== "object") return null;

  return payload as Record<string, unknown>;
}

async function fetchAlphaVantageOverview(symbol: string): Promise<Record<string, string> | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "OVERVIEW");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", ALPHA_VANTAGE_API_KEY);

  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    return null;
  }

  if ("Note" in payload || "Information" in payload || !("Symbol" in payload)) {
    return null;
  }

  return payload as Record<string, string>;
}

async function fetchAlphaVantageQuote(symbol: string): Promise<LiveQuote | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", ALPHA_VANTAGE_API_KEY);

  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    return null;
  }

  const quote = payload["Global Quote"];
  if (!quote || typeof quote !== "object") {
    return null;
  }

  return {
    price: asNumber(quote["05. price"] as string | number | null | undefined),
    changePercent: asNumber(
      String(quote["10. change percent"] ?? "").replace("%", ""),
    ),
    marketCap: null,
    volume: asNumber(quote["06. volume"] as string | number | null | undefined),
    currency: null,
  };
}

async function fetchLiveQuote(
  symbol: string,
  exchange?: string,
): Promise<LiveQuote | null> {
  if (EODHD_API_KEY) {
    const exchangeCode = normalizedExchange(exchange);
    if (exchangeCode === "NASDAQ" || exchangeCode === "NYSE") {
      const url = new URL("https://eodhd.com/api/us-quote-delayed");
      url.searchParams.set("api_token", EODHD_API_KEY);
      url.searchParams.set("fmt", "json");
      url.searchParams.set("s", `${symbol}.US`);

      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json().catch(() => null);
        const data =
          payload && typeof payload === "object" && "data" in payload
            ? payload.data as Record<string, Record<string, unknown>>
            : null;
        const quote = data?.[`${symbol}.US`];

        if (quote) {
          return {
            price: asNumber(quote.lastTradePrice as string | number | null | undefined),
            changePercent: asNumber(quote.changePercent as string | number | null | undefined),
            marketCap: asNumber(quote.marketCap as string | number | null | undefined),
            volume: asNumber(quote.volume as string | number | null | undefined),
            currency:
              typeof quote.currency === "string" && quote.currency.trim().length > 0
                ? quote.currency
                : null,
          };
        }
      }
    }
  }

  return fetchAlphaVantageQuote(symbol);
}

async function fetchSeries(
  symbol: string,
  assetType: AssetType,
  exchange: string | undefined,
  timeframe: "1d" | "1w" | "1M",
): Promise<CandleValue[]> {
  if (EODHD_API_KEY) {
    return fetchEodSeries(symbol, exchange, timeframe);
  }

  return fetchTwelveDataSeries(symbol, assetType, timeframe);
}

async function syncSymbol(
  supabase: ReturnType<typeof createClient>,
  body: Required<Pick<MarketSyncRequest, "symbol" | "assetType" | "timeframe">> &
    Pick<MarketSyncRequest, "exchange" | "market" | "name">,
) {
  const [values, fundamentalsRaw, overview, liveQuote] = await Promise.all([
    fetchSeries(body.symbol, body.assetType, body.exchange, body.timeframe),
    fetchEodFundamentals(body.symbol, body.exchange),
    fetchAlphaVantageOverview(body.symbol),
    fetchLiveQuote(body.symbol, body.exchange),
  ]);

  if (values.length === 0) {
    throw new Error("No candle data returned by provider.");
  }

  const technicals = calculateTechnicals(values);
  const latestClose = asNumber(values.at(-1)?.close);
  const previousClose = asNumber(values.at(-2)?.close);
  const latestPrice = liveQuote?.price ?? latestClose;
  const changePercent =
    liveQuote?.changePercent ??
    (latestPrice !== null && previousClose !== null && previousClose !== 0
      ? ((latestPrice - previousClose) / previousClose) * 100
      : null);

  const highlights = (fundamentalsRaw?.Highlights ?? {}) as Record<string, unknown>;
  const valuation = (fundamentalsRaw?.Valuation ?? {}) as Record<string, unknown>;
  const general = (fundamentalsRaw?.General ?? {}) as Record<string, unknown>;

  const fundamentals: Record<string, unknown> = fundamentalsRaw
    ? {
        market_cap: asNumber(highlights.MarketCapitalization as string),
        pe_ratio: asNumber(highlights.PERatio as string),
        peg_ratio: asNumber(highlights.PEGRatio as string),
        eps: asNumber(highlights.EarningsShare as string),
        dividend_yield: asNumber(highlights.DividendYield as string),
        beta: asNumber(highlights.Beta as string),
        book_value: asNumber(highlights.BookValue as string),
        revenue_ttm: asNumber(highlights.RevenueTTM as string),
        profit_margin: asNumber(highlights.ProfitMargin as string),
        gross_margin: asNumber(highlights.GrossProfitTTM as string),
        operating_margin: asNumber(highlights.OperatingMarginTTM as string),
        debt_to_equity: asNumber(valuation.DebtToEquity as string),
      }
    : overview
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

  const liveMarketCap = liveQuote?.marketCap;
  if (liveMarketCap != null) {
    fundamentals.market_cap = liveMarketCap;
  }

  const exchangeCode = normalizedExchange(
    body.exchange ?? (general.Exchange as string) ?? null,
  );

  const profile = fundamentalsRaw
    ? {
        summary: (general.Description as string) ?? "",
        analyst_target_price: asNumber(highlights.WallStreetTargetPrice as string),
        country: (general.CountryName as string) ?? null,
        sector: (general.Sector as string) ?? null,
        industry: (general.Industry as string) ?? null,
        asset_type: (general.Type as string) ?? null,
      }
    : overview
      ? {
          summary: overview.Description ?? "",
          analyst_target_price: asNumber(overview.AnalystTargetPrice),
          country: overview.Country ?? null,
          sector: overview.Sector ?? null,
          industry: overview.Industry ?? null,
          asset_type: body.assetType,
        }
      : {};

  const instrumentPayload = {
    symbol: body.symbol,
    slug: slugFromSymbol(body.symbol, exchangeCode),
    name: (general?.Name as string) ?? overview?.Name ?? body.name ?? body.symbol,
    asset_type: body.assetType,
    tv_symbol: defaultTvSymbol(body.symbol, body.assetType, exchangeCode),
    exchange: exchangeCode,
    market: body.market ?? exchangeCode,
    country: (general?.CountryName as string) ?? overview?.Country ?? null,
    currency: liveQuote?.currency ?? (general?.CurrencyCode as string) ?? overview?.Currency ?? "USD",
    sector: (general?.Sector as string) ?? overview?.Sector ?? null,
    industry: (general?.Industry as string) ?? overview?.Industry ?? null,
    description: (general?.Description as string) ?? overview?.Description ?? null,
    last_price: latestPrice,
    change_percent: changePercent,
    source: EODHD_API_KEY ? "eodhd" : "twelve-data",
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

  const latestIndex = values.length - 1;
  const candles = values.map((item, index) => ({
    instrument_id: instrumentRows[0].id as string,
    timeframe: body.timeframe,
    ts: new Date(item.datetime).toISOString(),
    open: asNumber(item.open),
    high: asNumber(item.high),
    low: asNumber(item.low),
    close: asNumber(item.close),
    volume: index === latestIndex ? (liveQuote?.volume ?? asNumber(item.volume)) : asNumber(item.volume),
    source: EODHD_API_KEY ? "eodhd" : "twelve-data",
  }));

  const { error: candleError } = await supabase
    .from("market_candles")
    .upsert(candles, { onConflict: "instrument_id,timeframe,ts" });

  if (candleError) {
    throw new Error(candleError.message);
  }

  return {
    instrument: instrumentRows[0],
    candleCount: candles.length,
    timeframe: body.timeframe,
    provider: liveQuote ? "eodhd-us-quote-delayed" : "eodhd",
  };
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const timeframe = body.timeframe ?? "1d";

    if (body.refreshTracked) {
      const assetTypes: AssetType[] = body.assetTypes?.length
        ? body.assetTypes
        : ["equity", "etf", "index"];
      const limit = Math.min(Math.max(body.limit ?? 25, 1), 50);

      const { data: trackedRows, error: trackedError } = await supabase
        .from("market_instruments")
        .select("symbol,asset_type,exchange,market,name")
        .in("asset_type", assetTypes)
        .order("last_synced_at", { ascending: true, nullsFirst: true })
        .limit(limit);

      if (trackedError) {
        throw new Error(trackedError.message);
      }

      const instruments = (trackedRows ?? []) as TrackedInstrumentRow[];
      const results = await Promise.allSettled(
        instruments.map((instrument) =>
          syncSymbol(supabase, {
            symbol: instrument.symbol.trim().toUpperCase(),
            assetType: instrument.asset_type,
            exchange: instrument.exchange ?? undefined,
            market: instrument.market ?? undefined,
            name: instrument.name ?? undefined,
            timeframe,
          })
        ),
      );

      const refreshed = results.filter((result) => result.status === "fulfilled").length;
      const failures = results
        .flatMap((result, index) =>
          result.status === "rejected"
            ? [{ symbol: instruments[index]?.symbol ?? "UNKNOWN", error: result.reason instanceof Error ? result.reason.message : "Unknown sync error" }]
            : [],
        )
        .slice(0, 10);

      return jsonResponse({
        refreshed,
        attempted: instruments.length,
        timeframe,
        failures,
      });
    }

    const symbol = body.symbol?.trim().toUpperCase();
    if (!symbol) {
      return jsonResponse({ error: "symbol is required" }, 400);
    }

    const assetType = body.assetType ?? "equity";
    const result = await syncSymbol(supabase, {
      symbol,
      assetType,
      exchange: body.exchange,
      market: body.market,
      name: body.name,
      timeframe,
    });

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown market sync error",
      },
      500,
    );
  }
});
