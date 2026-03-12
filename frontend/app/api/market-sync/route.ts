import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Server-side env (NOT exposed to browser) ──────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const EODHD_API_KEY = process.env.EODHD_API_KEY ?? "";

// ── Types ─────────────────────────────────────────────────────────
type AssetType = "equity" | "etf" | "index" | "crypto" | "forex" | "commodity";

type MarketSyncBody = {
  symbol?: string;
  assetType?: AssetType;
  exchange?: string;
  market?: string;
  name?: string;
  timeframe?: "1d" | "1w" | "1M";
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

// ── Helpers ───────────────────────────────────────────────────────
function asNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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
  const raw =
    exchangeCode === "NSE" || exchangeCode === "BSE"
      ? `${symbol}-${exchangeCode}`
      : symbol;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function defaultTvSymbol(
  symbol: string,
  assetType: AssetType,
  exchange?: string | null,
) {
  const exchangeCode = normalizedExchange(exchange);
  if (exchangeCode) return `${exchangeCode}:${symbol}`;
  if (assetType === "crypto") return `BITSTAMP:${symbol}USD`;
  return `NASDAQ:${symbol}`;
}

// ── Technical Indicators ──────────────────────────────────────────
function calculateSma(values: number[], period: number) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((t, v) => t + v, 0) / period;
}

function calculateEma(values: number[], period: number) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = values[values.length - period];
  for (let i = values.length - period + 1; i < values.length; i++) {
    ema = (values[i] - ema) * k + ema;
  }
  return ema;
}

function calculateRsi(values: number[], period = 14) {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calculateTechnicals(candles: CandleValue[]) {
  const closes = candles
    .map((c) => asNumber(c.close))
    .filter((v): v is number => v !== null);
  const highs = candles
    .map((c) => asNumber(c.high))
    .filter((v): v is number => v !== null);
  const lows = candles
    .map((c) => asNumber(c.low))
    .filter((v): v is number => v !== null);

  const lastClose = closes.at(-1) ?? null;
  const sma20 = calculateSma(closes, 20);
  const sma50 = calculateSma(closes, 50);
  const sma200 = calculateSma(closes, 200);
  const ema12 = calculateEma(closes, 12);
  const ema26 = calculateEma(closes, 26);
  const macd = ema12 !== null && ema26 !== null ? ema12 - ema26 : null;
  const rsi = calculateRsi(closes, 14);
  const support =
    lows.length >= 20 ? Math.min(...lows.slice(-20)) : (lows.at(-1) ?? null);
  const resistance =
    highs.length >= 20
      ? Math.max(...highs.slice(-20))
      : (highs.at(-1) ?? null);

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

  return { signal, trend, rsi, sma20, sma50, sma200, macd, support, resistance };
}

// ── EODHD Fetchers ────────────────────────────────────────────────
async function fetchEodSeries(
  symbol: string,
  exchange: string | undefined,
  timeframe: "1d" | "1w" | "1M",
): Promise<CandleValue[]> {
  const exchangeCode = eodhdExchangeCode(exchange);
  const ticker = `${symbol}.${exchangeCode}`;
  const url = new URL(`https://eodhd.com/api/eod/${encodeURIComponent(ticker)}`);
  url.searchParams.set("api_token", EODHD_API_KEY);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("period", eodhdPeriod(timeframe));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `EODHD EOD request failed with status ${res.status}`);
  }

  const payload = await res.json();

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
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

async function fetchEodFundamentals(
  symbol: string,
  exchange?: string,
): Promise<Record<string, unknown> | null> {
  const exchangeCode = eodhdExchangeCode(exchange);
  const ticker = `${symbol}.${exchangeCode}`;
  const url = new URL(`https://eodhd.com/api/fundamentals/${encodeURIComponent(ticker)}`);
  url.searchParams.set("api_token", EODHD_API_KEY);
  url.searchParams.set("fmt", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const payload = await res.json();
  if (!payload || typeof payload !== "object") return null;

  return payload as Record<string, unknown>;
}

async function fetchLiveQuote(
  symbol: string,
  exchange?: string,
): Promise<LiveQuote | null> {
  const exchangeCode = normalizedExchange(exchange);
  if (exchangeCode !== "NASDAQ" && exchangeCode !== "NYSE") {
    return null;
  }

  const url = new URL("https://eodhd.com/api/us-quote-delayed");
  url.searchParams.set("api_token", EODHD_API_KEY);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("s", `${symbol}.US`);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return null;
  }

  const payload = await res.json().catch(() => null);
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload.data as Record<string, Record<string, unknown>>)
      : null;
  const quote = data?.[`${symbol}.US`];

  if (!quote) {
    return null;
  }

  return {
    price: asNumber((quote.lastTradePrice as string | number | null | undefined) ?? null),
    changePercent: asNumber((quote.changePercent as string | number | null | undefined) ?? null),
    marketCap: asNumber((quote.marketCap as string | number | null | undefined) ?? null),
    volume: asNumber((quote.volume as string | number | null | undefined) ?? null),
    currency:
      typeof quote.currency === "string" && quote.currency.trim().length > 0
        ? quote.currency
        : null,
  };
}

// ── Route Handler ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!EODHD_API_KEY) {
    return NextResponse.json(
      { error: "EODHD_API_KEY is not configured." },
      { status: 500 },
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service credentials are not configured." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as MarketSyncBody;
    const symbol = body.symbol?.trim().toUpperCase();
    const assetType = body.assetType ?? "equity";
    const timeframe = body.timeframe ?? "1d";

    if (!symbol) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [values, fundamentalsRaw, liveQuote] = await Promise.all([
      fetchEodSeries(symbol, body.exchange, timeframe),
      fetchEodFundamentals(symbol, body.exchange),
      fetchLiveQuote(symbol, body.exchange),
    ]);

    if (values.length === 0) {
      return NextResponse.json(
        { error: "No candle data returned by provider." },
        { status: 404 },
      );
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

    const fundamentals = fundamentalsRaw
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
      : {};

    const instrumentPayload = {
      symbol,
      slug: slugFromSymbol(symbol, exchangeCode),
      name: (general?.Name as string) ?? body.name ?? symbol,
      asset_type: assetType,
      tv_symbol: defaultTvSymbol(symbol, assetType, exchangeCode),
      exchange: exchangeCode,
      market: body.market ?? exchangeCode,
      country: (general?.CountryName as string) ?? null,
      currency: liveQuote?.currency ?? (general?.CurrencyCode as string) ?? "USD",
      sector: (general?.Sector as string) ?? null,
      industry: (general?.Industry as string) ?? null,
      description: (general?.Description as string) ?? null,
      last_price: latestPrice,
      change_percent: changePercent,
      source: "eodhd",
      last_synced_at: new Date().toISOString(),
      fundamentals,
      technicals,
      profile,
      updated_at: new Date().toISOString(),
    };

    const { data: instrumentRows, error: instrumentError } = await supabase
      .from("market_instruments")
      .upsert(instrumentPayload, { onConflict: "slug" })
      .select(
        "id,symbol,slug,name,asset_type,tv_symbol,exchange,market,country,currency,sector,industry,description,last_price,change_percent,last_synced_at,fundamentals,technicals,profile",
      )
      .limit(1);

    if (instrumentError || !instrumentRows?.[0]) {
      throw new Error(
        instrumentError?.message ?? "Failed to upsert instrument.",
      );
    }

    const instrumentId = instrumentRows[0].id as string;
    const latestIndex = values.length - 1;
    const candles = values.map((item, index) => ({
      instrument_id: instrumentId,
      timeframe,
      ts: new Date(item.datetime).toISOString(),
      open: asNumber(item.open),
      high: asNumber(item.high),
      low: asNumber(item.low),
      close: asNumber(item.close),
      volume:
        index === latestIndex
          ? (liveQuote?.volume ?? asNumber(item.volume))
          : asNumber(item.volume),
      source: "eodhd",
    }));

    const { error: candleError } = await supabase
      .from("market_candles")
      .upsert(candles, { onConflict: "instrument_id,timeframe,ts" });

    if (candleError) {
      throw new Error(candleError.message);
    }

    return NextResponse.json({
      instrument: instrumentRows[0],
      candleCount: candles.length,
      timeframe,
      provider: liveQuote ? "eodhd-us-quote-delayed" : "eodhd",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown market sync error",
      },
      { status: 500 },
    );
  }
}
