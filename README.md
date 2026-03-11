# GreenTrust

**Map-first sustainable finance intelligence platform.**

Compare companies, stocks, and crypto entities using ESG scoring, climate vulnerability, market context, and location-based news mapping — all on one interactive global map.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### Frontend
```bash
cd frontend
cp .env.example .env.local    # Edit with your values
npm install
npm run dev                    # → http://localhost:3000
```

### Backend
```bash
cd backend
cp .env.example .env           # Edit with your API keys
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000   # → http://localhost:8000
```

### Supabase Edge Functions
```bash
cp supabase/functions/.env.example supabase/functions/.env
# Fill in SUPABASE_SERVICE_ROLE_KEY and GOOGLE_AI_STUDIO_API_KEY as needed
supabase functions serve document-analyzer
```

The local Edge Function reads secrets from `supabase/functions/.env` via `Deno.env.get(...)`.
The backend proxy uses `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DOCUMENT_ANALYZER_EDGE_FUNCTION_NAME`
from `backend/.env` to invoke the deployed function.

## Market Charting

The market detail page lives at `/markets/[symbol]` and uses:

- `lightweight-charts` from TradingView for the interactive OHLC chart
- Supabase public tables `market_instruments` and `market_candles` for chart/fundamental/technical payloads
- frontend env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_MARKET_SYNC_FUNCTION`
- the `market-data-sync-v2` Supabase Edge Function with `ALPHA_VANTAGE_API_KEY`

Watchlist clicks in the stock and crypto sections deep-link into that page.
If the chart page shows an empty-state message, the Supabase market tables exist but do not have candle rows for that symbol/timeframe yet.

## Architecture

| Layer | Stack | Description |
|-------|-------|-------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, Leaflet | Map-first dashboard with terminal theme |
| Backend | FastAPI, Python, Pydantic, httpx | API orchestration + score calculation |
| External | Alpha Vantage, NewsAPI, OpenWeatherMap, ESG Model | Real-time data sources |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/search?q={query}` | Search companies, stocks, crypto |
| GET | `/analyze?entity={id}` | Full entity analysis with scores |
| POST | `/compare` | Compare up to 3 entities |
| GET | `/feeds` | Latest news, stock, crypto feeds |
| GET | `/layers` | Map layer data (exchanges, climate, news) |

## Team

| Member | Role | Owns |
|--------|------|------|
| Shravan | Coordinator + Integration | Contracts, app shell, scoring, ESG bridge |
| Srijan | Map Intelligence | World map, layers, UI theme |
| Sai | Search + Comparison + Feeds | Search, insight panel, comparison, feeds |
| Afham | Backend Orchestration | API routes, entity resolver, data services |

## Project Structure

See [CLAUDE.md](CLAUDE.md) for full architecture details and coding conventions.
See [docs/micro-tasks.md](docs/micro-tasks.md) for the 120+ task breakdown.

## Contracts

All API response schemas are defined in `contracts/` as JSON Schema files. Frontend types and backend Pydantic models must match these exactly.
