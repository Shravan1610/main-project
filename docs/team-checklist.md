# GreenTrust — Team Setup Checklist

## Every Team Member

- [ ] Clone the repository
- [ ] Read `CLAUDE.md` fully
- [ ] Read `docs/architecture.md`
- [ ] Read all files in `contracts/` — understand the response shapes
- [ ] Read `docs/micro-tasks.md` — find your tasks
- [ ] Create your feature branch: `feature/<your-feature>`
- [ ] Set up local environment (see below)
- [ ] Verify frontend starts: `cd frontend && npm install && npm run dev`
- [ ] Verify backend starts: `cd backend && pip install -r requirements.txt && uvicorn src.main:app --reload`
- [ ] Confirm GET `http://localhost:8000/health` returns 200

---

## Shravan Setup

- [ ] All items above
- [x] Verify all contracts are valid JSON
- [x] Confirm `.env.example` files are complete
- [ ] ESG model URL is accessible *(URL now configured in `backend/.env`; remote reachability check from this runtime returned `HTTP 000` and needs re-check from local terminal/network)*
- [ ] Set up API keys in `backend/.env` *(template copied; real keys still required)*
- [ ] Review each team member’s branch naming *(blocked: only `main` exists locally/remotely)*

Shravan implementation progress (Phase 1):
- [x] SH-1-01 to SH-1-33 scaffolding completed across `frontend/app/`, `frontend/shared/`, `frontend/features/app-shell/`, `backend/src/main.py`, and `backend/src/shared/`
- [x] Shared frontend/backend foundation and barrel exports are in place for team integration
- [x] Frontend and backend compile/type checks pass for completed Phase 1 scope
- [x] SH-1-34 to SH-1-46 (ESG + scoring backend) scaffolding completed

Verification notes (2026-03-11):
- Contracts validated with `jq` (`contracts/*.json` all passed).
- Frontend dependency install completed; `npm run dev` now boots after switching to `next.config.mjs` (the `/` page still returns 500 due existing page implementation issues).
- Backend dependency install completed; `uvicorn src.main:app --port 8000` starts and `GET /health` returns `200` with `{"status":"ok","version":"0.1.0"}`.

## Srijan Setup

- [ ] All items above
- [ ] Leaflet / react-leaflet installed and loading
- [ ] Map tiles rendering (check CORS, tile URL)
- [ ] Understand layer types: entity, exchange, climate, news
- [ ] Review `contracts/map-layers-response.json`

Srijan implementation progress (Phase 1):
- [x] SR-1-01 to SR-1-24 scaffolding completed in `ui-theme/`, `map-intelligence/`, and `layer-controls/`
- [x] Barrel exports added for components/hooks/services/types touched in Phase 1
- [x] Project type-check passes after Srijan Phase 1 scaffolding
- [ ] Real Leaflet tile rendering behavior verification (Phase 2 runtime check)

## Sai Setup

- [ ] All items above
- [ ] Understand `contracts/search-response.json`
- [ ] Understand `contracts/analyze-response.json`
- [ ] Understand `contracts/compare-response.json`
- [ ] Understand `contracts/feed-response.json`
- [ ] Review insight-panel, comparison, and feed UI requirements

Sai implementation progress (Phase 1):
- [x] SA-1-01 to SA-1-54 scaffolding completed across `entity-search/`, `insight-panel/`, `comparison/`, `news-feed/`, `market-feed/`, and `crypto-feed/`
- [x] Typed services/hooks/components and barrel exports added for all Sai Phase 1 modules
- [x] Frontend type-check passes after Sai Phase 1 scaffolding
- [ ] Real endpoint runtime verification for `/search`, `/analyze`, `/compare`, `/feeds` (Phase 2+ integration check)

## Afham Setup

- [ ] All items above
- [ ] Python 3.11+ confirmed
- [ ] FastAPI + uvicorn running
- [ ] Market API key (Alpha Vantage / Yahoo Finance) — test a call
- [ ] News API key (NewsAPI.org) — test a call
- [ ] Climate API key (OpenWeatherMap) — test a call
- [ ] Understand all 5 endpoint contracts
- [ ] Review entity-resolver expected behavior

Afham implementation progress (Phase 1):
- [x] AF-1-01 to AF-1-42 scaffolding completed across `api/`, `entity-resolver/`, `market-intel/`, `news-intel/`, `climate-intel/`, and `feed-builder/`
- [x] Route/controller wiring added for `/search`, `/analyze`, `/compare`, `/feeds`, `/layers`
- [x] Backend compile checks pass for `src/api`, `src/features`, and `src/main.py`
- [ ] Real external API integration and data enrichment (Phase 2)

Afham implementation progress (Phase 2):
- [x] AF-2-01 to AF-2-09 implemented with provider wiring and fallbacks
- [x] CoinGecko integration path added for crypto lookup/data
- [x] Alpha Vantage integration path added for company/ticker/search/quotes
- [x] NewsAPI and OpenWeather integration paths added for news/climate

---

## Phase Review Cadence

After each phase, the team does a review:

1. **Phase 0 Review** — Contracts locked? Configs work? Everyone set up?
2. **Phase 1 Review** — App boots? No import errors? All stubs in place?
3. **Phase 2 Review** — Single entity flow works end-to-end?
4. **Phase 3 Review** — Compare + layers work?
5. **Phase 4 Review** — Feeds work? UI polished?
6. **Phase 5 Review** — Demo-ready? Deployed?
