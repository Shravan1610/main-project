import type {
  MarketAssetType,
  MarketCandle,
  MarketDetail,
  MarketDetailLookup,
  MarketInstrument,
  MarketTimeframe,
} from "../types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

const INSTRUMENT_FIELDS = [
  "id",
  "symbol",
  "slug",
  "name",
  "asset_type",
  "tv_symbol",
  "exchange",
  "market",
  "country",
  "currency",
  "sector",
  "industry",
  "description",
  "last_price",
  "change_percent",
  "last_synced_at",
  "fundamentals",
  "technicals",
  "profile",
].join(",");

type MarketInstrumentRow = {
  id: string;
  symbol: string;
  slug: string;
  name: string;
  asset_type: MarketAssetType;
  tv_symbol: string;
  exchange?: string | null;
  market?: string | null;
  country?: string | null;
  currency?: string | null;
  sector?: string | null;
  industry?: string | null;
  description?: string | null;
  last_price?: number | string | null;
  change_percent?: number | string | null;
  last_synced_at?: string | null;
  fundamentals?: Record<string, unknown> | null;
  technicals?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
};

type MarketCandleRow = {
  ts: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string | null;
};

function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase market data is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
}

function createRestUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function restSelect<TResponse>(
  path: string,
  params?: Record<string, string>,
): Promise<TResponse> {
  requireSupabaseConfig();

  const response = await fetch(createRestUrl(path, params), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      "Supabase market request failed";
    throw new Error(message);
  }

  return payload as TResponse;
}

function normalizeSymbol(rawSymbol: string) {
  return decodeURIComponent(rawSymbol).trim().toUpperCase();
}

function normalizeExchange(exchange?: string | null) {
  const value = exchange?.trim().toUpperCase();
  if (!value) return null;
  if (value.includes("NSE")) return "NSE";
  if (value.includes("BSE")) return "BSE";
  if (value.includes("NYSE")) return "NYSE";
  if (value.includes("NASDAQ")) return "NASDAQ";
  return value;
}

function slugFromSymbol(symbol: string, exchange?: string | null) {
  const exchangeCode = normalizeExchange(exchange);
  const raw =
    exchangeCode === "NSE" || exchangeCode === "BSE"
      ? `${symbol}-${exchangeCode}`
      : symbol;

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function mapInstrument(row: MarketInstrumentRow): MarketInstrument {
  return {
    id: row.id,
    symbol: row.symbol,
    slug: row.slug,
    name: row.name,
    assetType: row.asset_type,
    tvSymbol: row.tv_symbol,
    exchange: row.exchange ?? null,
    market: row.market ?? null,
    country: row.country ?? null,
    currency: row.currency ?? "USD",
    sector: row.sector ?? null,
    industry: row.industry ?? null,
    description: row.description ?? null,
    lastPrice: asNumber(row.last_price),
    changePercent: asNumber(row.change_percent),
    lastSyncedAt: row.last_synced_at ?? null,
    fundamentals: row.fundamentals ?? {},
    technicals: row.technicals ?? {},
    profile: row.profile ?? {},
  };
}

function mapCandle(row: MarketCandleRow): MarketCandle {
  return {
    time: row.ts,
    open: asNumber(row.open) ?? 0,
    high: asNumber(row.high) ?? 0,
    low: asNumber(row.low) ?? 0,
    close: asNumber(row.close) ?? 0,
    volume: asNumber(row.volume),
  };
}

async function getInstrument(
  rawSymbol: string,
  assetType?: MarketAssetType,
  exchange?: string | null,
): Promise<MarketInstrument | null> {
  const symbol = normalizeSymbol(rawSymbol);
  const baseParams: Record<string, string> = {
    select: INSTRUMENT_FIELDS,
    limit: "1",
  };

  if (assetType) {
    baseParams.asset_type = `eq.${assetType}`;
  }

  const exchangeCode = normalizeExchange(exchange);
  if (exchangeCode) {
    baseParams.exchange = `eq.${exchangeCode}`;
  }

  const bySymbol = await restSelect<MarketInstrumentRow[]>(
    "market_instruments",
    {
      ...baseParams,
      symbol: `eq.${symbol}`,
    },
  );

  if (bySymbol[0]) {
    return mapInstrument(bySymbol[0]);
  }

  const bySlug = await restSelect<MarketInstrumentRow[]>(
    "market_instruments",
    {
      ...baseParams,
      slug: `eq.${slugFromSymbol(symbol, exchangeCode)}`,
    },
  );

  if (bySlug[0]) {
    return mapInstrument(bySlug[0]);
  }

  return null;
}

async function syncMarketDetail(
  symbol: string,
  timeframe: MarketTimeframe,
  lookup?: MarketDetailLookup,
) {
  requireSupabaseConfig();

  const functionName =
    process.env.NEXT_PUBLIC_SUPABASE_MARKET_SYNC_FUNCTION ?? "market-data-sync-v2";
  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        symbol: normalizeSymbol(symbol),
        assetType: lookup?.assetType,
        exchange: lookup?.exchange,
        market: lookup?.market,
        name: lookup?.name,
        timeframe,
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      (payload as { error?: string } | null)?.error ??
      "Market sync function failed.";
    throw new Error(message);
  }
}

function candleLimitForTimeframe(timeframe: MarketTimeframe) {
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

export async function getMarketDetail(
  symbol: string,
  timeframe: MarketTimeframe,
  lookup?: MarketDetailLookup,
): Promise<MarketDetail> {
  let instrument = await getInstrument(
    symbol,
    lookup?.assetType,
    lookup?.exchange,
  );

  if (!instrument) {
    await syncMarketDetail(symbol, timeframe, lookup);
    instrument = await getInstrument(
      symbol,
      lookup?.assetType,
      lookup?.exchange,
    );
  }

  if (!instrument) {
    throw new Error(`No Supabase market record found for ${symbol}.`);
  }

  const candleRows = await restSelect<MarketCandleRow[]>("market_candles", {
    select: "ts,open,high,low,close,volume",
    instrument_id: `eq.${instrument.id}`,
    timeframe: `eq.${timeframe}`,
    order: "ts.asc",
    limit: String(candleLimitForTimeframe(timeframe)),
  });

  if (candleRows.length === 0) {
    try {
      await syncMarketDetail(symbol, timeframe, lookup);
      const syncedInstrument = await getInstrument(
        symbol,
        lookup?.assetType,
        lookup?.exchange,
      );
      const syncedRows = await restSelect<MarketCandleRow[]>("market_candles", {
        select: "ts,open,high,low,close,volume",
        instrument_id: `eq.${syncedInstrument?.id ?? instrument.id}`,
        timeframe: `eq.${timeframe}`,
        order: "ts.asc",
        limit: String(candleLimitForTimeframe(timeframe)),
      });

      if (syncedRows.length === 0) {
        throw new Error(
          `Market sync completed but no candle data was stored in Supabase for ${symbol} (${timeframe}).`,
        );
      }

      return {
        instrument: syncedInstrument ?? instrument,
        candles: syncedRows.map(mapCandle),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : `Market sync failed for ${symbol} (${timeframe}).`,
      );
    }
  }

  return {
    instrument,
    candles: candleRows.map(mapCandle),
  };
}
