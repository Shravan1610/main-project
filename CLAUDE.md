# CLAUDE.md — GreenTrust Hackathon Project

## Project Overview

**GreenTrust** is a map-first sustainable finance intelligence platform built for a hackathon by a 4-person team: Shravan, Srijan, Sai, Afham.

Users can compare companies, stocks, and crypto entities using ESG scoring, climate vulnerability by geography, market context, location-based news mapping, and risk/opportunity/regulation/disaster tagging.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Leaflet/MapLibre for maps
- **Backend:** Python 3.11+, FastAPI, Pydantic, httpx for async HTTP
- **External APIs:** Market data (Alpha Vantage/Yahoo Finance), News (NewsAPI/GNews), Climate (OpenWeatherMap/NOAA), Geocoding (Nominatim/OpenCage), ESG model on Render
- **Deployment:** Vercel (frontend), Render (backend + ESG model)

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js + TypeScript + Tailwind                │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Map Intel│ │ Search   │ │ Comparison       ││
│  │ (Srijan) │ │ (Sai)    │ │ (Sai)            ││
│  ├──────────┤ ├──────────┤ ├──────────────────┤│
│  │ Layers   │ │ Insight  │ │ Feeds (News,     ││
│  │ (Srijan) │ │ Panel    │ │ Stock, Crypto)   ││
│  │          │ │ (Sai)    │ │ (Sai)            ││
│  └──────────┘ └──────────┘ └──────────────────┘│
│  ┌──────────────────────────────────────────────┤
│  │ App Shell + UI Theme (Shravan + Srijan)     ││
│  └──────────────────────────────────────────────┘
└──────────────────┬──────────────────────────────┘
                   │ HTTP (JSON)
                   │ Contracts: /contracts/*.json
┌──────────────────▼──────────────────────────────┐
│                   BACKEND                        │
│  FastAPI + Python                                │
│                                                  │
│  ┌──────────────────────────────────────────────┤
│  │ API Layer: routes + controllers              ││
│  │ /search, /analyze, /compare, /feeds, /layers ││
│  └──────────────────────────────────────────────┤│
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Entity   │ │ Market   │ │ News Intel       ││
│  │ Resolver │ │ Intel    │ │ (Afham)          ││
│  │ (Afham)  │ │ (Afham)  │ │                  ││
│  ├──────────┤ ├──────────┤ ├──────────────────┤│
│  │ Climate  │ │ ESG      │ │ Scoring          ││
│  │ Intel    │ │ Bridge   │ │ (Shravan)        ││
│  │ (Afham)  │ │ (Shravan)│ │                  ││
│  ├──────────┤ ├──────────┤ ├──────────────────┤│
│  │ Feed     │ │ Shared   │ │                  ││
│  │ Builder  │ │ (config, │ │                  ││
│  │ (Afham)  │ │ utils)   │ │                  ││
│  └──────────┘ └──────────┘ └──────────────────┘│
└─────────────────────────────────────────────────┘
```

## Monorepo Structure

```
hackathon/
├── CLAUDE.md                    # This file - project guidance
├── plan.md                      # Original project plan
├── README.md                    # Project README
├── .env.example                 # Root env template
│
├── contracts/                   # API response contracts (Shravan owns)
│   ├── analyze-response.json
│   ├── compare-response.json
│   ├── entity-schema.json
│   ├── error-response.json
│   ├── feed-response.json
│   ├── map-layers-response.json
│   └── search-response.json
│
├── docs/                        # Documentation
│   ├── api-notes.md
│   ├── architecture.md
│   ├── demo-script.md
│   ├── team-checklist.md
│   └── micro-tasks.md           # Detailed 100+ task breakdown
│
├── frontend/                    # Next.js App
│   ├── app/                     # App Router pages
│   ├── features/                # Feature-based modules
│   │   ├── app-shell/           # Shravan
│   │   ├── map-intelligence/    # Srijan
│   │   ├── layer-controls/      # Srijan
│   │   ├── ui-theme/            # Srijan (Shravan reviews)
│   │   ├── entity-search/       # Sai
│   │   ├── comparison/          # Sai
│   │   ├── insight-panel/       # Sai
│   │   ├── market-feed/         # Sai
│   │   ├── crypto-feed/         # Sai
│   │   └── news-feed/           # Sai
│   ├── shared/                  # Shared utilities (Shravan)
│   └── public/                  # Static assets
│
└── backend/                     # FastAPI App
    ├── src/
    │   ├── main.py              # Entry point (Shravan)
    │   ├── api/                 # Routes + Controllers (Afham)
    │   ├── features/            # Feature modules
    │   │   ├── entity-resolver/ # Afham
    │   │   ├── market-intel/    # Afham
    │   │   ├── news-intel/      # Afham
    │   │   ├── climate-intel/   # Afham
    │   │   ├── feed-builder/    # Afham
    │   │   ├── esg-bridge/      # Shravan
    │   │   └── scoring/         # Shravan
    │   └── shared/              # Shared config, utils, clients
    └── tests/                   # API tests
```

## Team Ownership Rules

### Shravan (Coordinator + Integration)
- **Owns:** contracts/, frontend/app/, frontend/features/app-shell/, frontend/shared/, backend/src/main.py, backend/src/features/esg-bridge/, backend/src/features/scoring/, backend/src/shared/
- **Role:** Locks contracts, reviews PRs, merges code, connects frontend-backend, handles deployment

### Srijan (Map + Layers + Theme)
- **Owns:** frontend/features/map-intelligence/, frontend/features/layer-controls/, frontend/features/ui-theme/
- **Rule:** Only edit files in your feature folders. Export via index files.

### Sai (Search + Comparison + Feeds)
- **Owns:** frontend/features/entity-search/, frontend/features/comparison/, frontend/features/insight-panel/, frontend/features/market-feed/, frontend/features/crypto-feed/, frontend/features/news-feed/
- **Rule:** Only edit files in your feature folders. Export via index files.

### Afham (Backend Orchestration)
- **Owns:** backend/src/api/, backend/src/features/entity-resolver/, backend/src/features/market-intel/, backend/src/features/news-intel/, backend/src/features/climate-intel/, backend/src/features/feed-builder/
- **Rule:** Only edit files in your feature folders. Follow contract schemas exactly.

## API Endpoints

| Method | Path | Description | Owner |
|--------|------|-------------|-------|
| GET | `/health` | Health check | Afham |
| GET | `/search?q={query}` | Search entities | Afham |
| GET | `/analyze?entity={id}` | Full entity analysis | Afham + Shravan |
| POST | `/compare` | Compare up to 3 entities | Afham + Shravan |
| GET | `/feeds` | Latest news, stocks, crypto | Afham |
| GET | `/layers` | Map layer data | Afham |

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Backend (.env)
```
PORT=8000
CORS_ORIGINS=http://localhost:3000
MARKET_API_KEY=
NEWS_API_KEY=
CLIMATE_API_KEY=
GEOCODING_API_KEY=
ESG_MODEL_URL=
```

## ESG Model Service (Canonical URLs)

- Base URL: `https://greenverify-api.onrender.com/`
- Health: `https://greenverify-api.onrender.com/`
- Swagger docs: `https://greenverify-api.onrender.com/docs`
- Predict endpoint: `https://greenverify-api.onrender.com/predict`

## Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run lint         # ESLint check
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000   # Start dev server on :8000
pytest tests/                                # Run tests
```

## Coding Conventions

### Frontend (TypeScript)
- Use functional components with hooks
- All components in `components/` subfolder, hooks in `hooks/`, services in `services/`, types in `types/`
- Export everything through `index.ts` barrel files
- Use `"use client"` directive for interactive components
- Tailwind for all styling — no CSS modules
- Types/interfaces in dedicated `types/` folders
- API calls through shared `api/client.ts`

### Backend (Python)
- Use Pydantic models for all request/response validation
- Use httpx for async external API calls
- All services are async functions
- Error handling: return structured error responses, never crash
- Use dependency injection via FastAPI's Depends()
- Type hints on all function signatures

### Naming
- Frontend files: kebab-case (e.g., `entity-card.tsx`)
- Frontend components: PascalCase (e.g., `EntityCard`)
- Backend files: snake_case (e.g., `entity_schema.py`)
- Backend functions: snake_case (e.g., `resolve_entity`)
- API routes: kebab-case URLs (e.g., `/api/search`)

## Contract Rules
1. All API responses follow schemas in `contracts/`
2. Frontend types mirror contract schemas exactly
3. Backend Pydantic models mirror contract schemas exactly
4. Any contract change requires Shravan's approval
5. Changes must be communicated to all affected team members

## Git Workflow
- Branch naming: `feature/<feature-name>` (e.g., `feature/map-intelligence`)
- One PR per feature concern
- No cross-folder edits without approval
- Shravan merges after contract compatibility check
- Every PR must list: what changed, what contracts it depends on, screenshots/sample responses

## Priority Tiers

### Tier 1 — Must Work (Demo-critical)
- World map loads
- Search returns results
- Single entity analysis (marker + info + scores)
- 3 scores render with drivers
- News + climate context displays

### Tier 2 — Should Work
- Compare 3 entities side-by-side
- Exchange/news/climate markers on map
- Below-fold feeds (news, stocks, crypto)

### Tier 3 — Nice to Have
- Climate vulnerability heatmap overlay
- Region risk overlay
- Entity-event connection lines

## Score Calculation Logic

### Sustainability Score (0-100)
- Primary: ESG model output from Render
- Secondary: Sustainability news signals, regulation adjustments
- Weight: 60% ESG model, 25% news signals, 15% regulation

### Financial Risk Score (0-100)
- Market volatility context
- Climate event exposure
- Negative/disaster news frequency
- Geographic risk factor
- Weight: 30% market, 25% climate, 25% news, 20% geography

### Long-Term Impact Score (0-100)
- Regional climate vulnerability
- ESG resilience signal
- Future regulation outlook
- Opportunity indicators
- Weight: 30% climate vulnerability, 25% ESG resilience, 25% regulation, 20% opportunity

## Common Patterns

### Frontend: Adding a new component
1. Create file in `features/<feature>/components/<component-name>.tsx`
2. Export from `features/<feature>/components/index.ts`
3. Use types from `features/<feature>/types/`
4. Fetch data via `features/<feature>/services/` or `features/<feature>/hooks/`

### Backend: Adding a new service
1. Create file in `features/<feature>/services/<service-name>.py`
2. Define Pydantic schema in `features/<feature>/schemas/`
3. Wire to controller in `api/controllers/`
4. Register route in `api/routes/`

### Making an API call from frontend
```typescript
import { apiClient } from '@/shared/api/client';
const data = await apiClient.get<AnalyzeResponse>('/analyze', { params: { entity: id } });
```

## Micro-Task Plan Reference

All implementation work is tracked in **[docs/micro-tasks.md](docs/micro-tasks.md)** (246 tasks across 6 phases).

### Task ID Format
`[OWNER]-[PHASE]-[NUMBER]` — e.g., `SH-0-01`, `AF-2-03`, `SA-3-05`
- **SH** = Shravan, **SR** = Srijan, **SA** = Sai, **AF** = Afham

### Phase Structure
| Phase | Name | Focus | Review Gate |
|-------|------|-------|-------------|
| 0 | Project Setup & Contracts | Contracts, configs, env files | All contracts valid, deps listed |
| 1 | Scaffolding & Stubs | Every file has imports, types, stub functions | App boots, no empty files |
| 2 | Core Feature Implementation | Working backend services, frontend components render | API returns real data, UI renders |
| 3 | Integration & Wiring | Frontend ↔ Backend connected, map populated | End-to-end flow works |
| 4 | Polish & Edge Cases | Error handling, loading states, responsive design | Demo-ready |
| 5 | Demo Prep & Deployment | Deploy, rehearse demo, fix last bugs | Deployed and tested |

### Every file has a task ID
Each stub file contains a comment/docstring with:
- **Owner** — who implements it
- **Task ID** — the micro-task that covers implementation
- **Phase** — when implementation should happen
- **Expected content** — classes, functions, or components to build

### File Inventory Per Feature

**Frontend features (10 modules):**
| Feature | Owner | Files | Key Components |
|---------|-------|-------|----------------|
| app-shell | Shravan | 5 | AppShell, Header, Sidebar |
| entity-search | Sai | 9 | SearchBar, SearchResultItem, SearchResults |
| comparison | Sai | 10 | CompareTray, CompareCard, CompareGrid, CompareView |
| insight-panel | Sai | 15 | InsightPanel, ScoreDisplay, ScoreCard, DriverList, EntityHeader |
| news-feed | Sai | 9 | NewsCard, NewsFeed, NewsFeedSection |
| market-feed | Sai | 10 | StockTickerCard, StockTicker, MarketFeed |
| crypto-feed | Sai | 10 | CryptoTickerCard, CryptoTicker, CryptoFeed |
| map-intelligence | Srijan | 12 | MapContainer, EntityMarker, ExchangeMarker, MapOverlay |
| layer-controls | Srijan | 6 | LayerPanel, LayerToggle |
| ui-theme | Srijan | 8 | TerminalCard, colors, terminal.css |

**Backend features (7 modules):**
| Feature | Owner | Files | Key Services |
|---------|-------|-------|-------------|
| entity-resolver | Afham | 10 | resolve_entity, normalize_entity, entity_cache |
| market-intel | Afham | 9 | fetch_stock_data, fetch_crypto_data |
| news-intel | Afham | 9 | fetch_news, tag_news, geo_tag_news |
| climate-intel | Afham | 9 | fetch_climate_data, climate_risk_score |
| feed-builder | Afham | 10 | build_news_feed, build_market_feed, build_crypto_feed |
| esg-bridge | Shravan | 8 | call_esg_model, parse_esg_response |
| scoring | Shravan | 10 | sustainability_score, financial_risk_score, impact_score |

**Backend API (13 files):**
| Layer | Owner | Files |
|-------|-------|-------|
| Routes | Afham | health, search, analyze, compare, feed, layer (6 files) |
| Controllers | Afham | search, analyze, compare, feed, layer (5 files) + __init__ |

## Known Pitfalls
- Do NOT edit `frontend/app/page.tsx` or `frontend/app/layout.tsx` without Shravan
- Do NOT install new npm/pip packages without team agreement
- Do NOT change contract schemas without notifying everyone
- Do NOT hardcode API keys — always use environment variables
- Do NOT use `any` type in TypeScript — define proper types
- Map tiles can fail silently — always have fallback tile sources
- External APIs have rate limits — implement caching in backend

## Remote Collaboration Constraints (Mandatory)
- This repo is being edited by 4 people in parallel; keep changes tightly scoped to the assigned task.
- Do not read `.env` files.
- Use only `plan.md` and files under `docs/` as project context unless explicitly asked otherwise.
- Do not assume missing requirements; ask clear questions when requirements are unclear.
- Keep implementations simple and direct; avoid over-engineering.
