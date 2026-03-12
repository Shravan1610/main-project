create table if not exists public.market_instruments (
    id uuid primary key default gen_random_uuid(),
    symbol text not null,
    slug text not null unique,
    name text not null,
    asset_type text not null check (asset_type in ('equity', 'etf', 'index', 'crypto', 'forex', 'commodity')),
    tv_symbol text not null,
    exchange text,
    market text,
    country text,
    currency text not null default 'USD',
    sector text,
    industry text,
    description text,
    last_price numeric(18, 6),
    change_percent numeric(12, 4),
    source text,
    last_synced_at timestamptz,
    fundamentals jsonb not null default '{}'::jsonb,
    technicals jsonb not null default '{}'::jsonb,
    profile jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_market_instruments_symbol on public.market_instruments (symbol);
create index if not exists idx_market_instruments_asset_type on public.market_instruments (asset_type);
create index if not exists idx_market_instruments_exchange on public.market_instruments (exchange);
create unique index if not exists idx_market_instruments_symbol_asset_type
    on public.market_instruments (symbol, asset_type, coalesce(exchange, ''));

create table if not exists public.market_candles (
    id bigint generated always as identity primary key,
    instrument_id uuid not null references public.market_instruments(id) on delete cascade,
    timeframe text not null check (timeframe in ('1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M')),
    ts timestamptz not null,
    open numeric(18, 6) not null,
    high numeric(18, 6) not null,
    low numeric(18, 6) not null,
    close numeric(18, 6) not null,
    volume numeric(24, 6),
    source text,
    created_at timestamptz not null default timezone('utc', now()),
    unique (instrument_id, timeframe, ts)
);

create index if not exists idx_market_candles_lookup
    on public.market_candles (instrument_id, timeframe, ts desc);

alter table public.market_instruments enable row level security;
alter table public.market_candles enable row level security;

drop policy if exists "Public can read market instruments" on public.market_instruments;
create policy "Public can read market instruments"
    on public.market_instruments
    for select
    using (true);

drop policy if exists "Public can read market candles" on public.market_candles;
create policy "Public can read market candles"
    on public.market_candles
    for select
    using (true);
