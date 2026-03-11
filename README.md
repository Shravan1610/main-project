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

