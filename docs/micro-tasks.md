# GreenTrust — Detailed Micro-Task Breakdown (120+ Tasks)

> Every task is designed to be completable by an AI agent or a team member in a single focused session.
> Tasks are grouped by owner → phase → review checkpoint.
> After each phase, the team does a **Phase Review** before moving on.

---

## Task ID Format: `[OWNER]-[PHASE]-[NUMBER]`
- **SH** = Shravan, **SR** = Srijan, **SA** = Sai, **AF** = Afham

## Status Legend
- ⬜ Not started
- 🔄 In progress
- ✅ Completed
- 🔍 In review

---

# ═══════════════════════════════════════════
# PHASE 0: PROJECT SETUP & CONTRACTS (Hour 0–2)
# ═══════════════════════════════════════════

> **Goal:** Lock contracts, configs, environment. No one writes feature code until Phase 0 is reviewed.

## Shravan — Phase 0

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-0-01 | Create CLAUDE.md | Write project guidance file with architecture, conventions, commands | CLAUDE.md | ⬜ |
| SH-0-02 | Fill contracts/entity-schema.json | Define the canonical entity shape used everywhere | entity-schema.json with full schema | ⬜ |
| SH-0-03 | Fill contracts/analyze-response.json | Define /analyze endpoint response contract | analyze-response.json | ⬜ |
| SH-0-04 | Fill contracts/search-response.json | Define /search endpoint response contract | search-response.json | ⬜ |
| SH-0-05 | Fill contracts/compare-response.json | Define /compare endpoint response contract | compare-response.json | ⬜ |
| SH-0-06 | Fill contracts/feed-response.json | Define /feeds endpoint response contract | feed-response.json | ⬜ |
| SH-0-07 | Fill contracts/map-layers-response.json | Define /layers endpoint response contract | map-layers-response.json | ⬜ |
| SH-0-08 | Fill contracts/error-response.json | Define standard error shape for all endpoints | error-response.json | ⬜ |
| SH-0-09 | Write backend/requirements.txt | List all Python dependencies with pinned versions | requirements.txt | ⬜ |
| SH-0-10 | Write frontend/package.json | Define all npm dependencies and scripts | package.json | ⬜ |
| SH-0-11 | Write frontend/tsconfig.json | TypeScript config with path aliases | tsconfig.json | ⬜ |
| SH-0-12 | Write frontend/tailwind.config.ts | Tailwind config with terminal theme colors | tailwind.config.ts | ⬜ |
| SH-0-13 | Write frontend/next.config.mjs | Next.js config | next.config.mjs | ⬜ |
| SH-0-14 | Write frontend/postcss.config.js | PostCSS config for Tailwind | postcss.config.js | ⬜ |
| SH-0-15 | Write .env.example files | Root, frontend, backend env templates | 3 .env.example files | ⬜ |
| SH-0-16 | Write docs/architecture.md | Architecture overview matching CLAUDE.md diagram | architecture.md | ⬜ |
| SH-0-17 | Write docs/api-notes.md | API endpoint documentation with request/response examples | api-notes.md | ⬜ |
| SH-0-18 | Write docs/team-checklist.md | Checklist for each team member's setup | team-checklist.md | ⬜ |
| SH-0-19 | Write docs/demo-script.md | Step-by-step demo script for judges | demo-script.md | ⬜ |
| SH-0-20 | Write README.md | Project overview with setup instructions | README.md | ⬜ |

### 🔍 PHASE 0 REVIEW CHECKPOINT
- [ ] All contracts are valid JSON with complete schemas
- [ ] package.json has all dependencies
- [ ] requirements.txt has all dependencies
- [ ] .env.example files list all required variables
- [ ] Every team member has read contracts and understands the shapes
- [ ] Architecture doc matches the actual folder structure

---

# ═══════════════════════════════════════════
# PHASE 1: SCAFFOLDING & STUBS (Hour 2–6)
# ═══════════════════════════════════════════

> **Goal:** Every file has proper imports, types, and stub functions. Nothing is empty. The app boots (even if pages are blank).

## Shravan — Phase 1 (App Shell + Shared + Backend Core)

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-1-01 | Write frontend/app/layout.tsx | Root layout with HTML structure, font, metadata, providers | layout.tsx | ✅ |
| SH-1-02 | Write frontend/app/page.tsx | Main page composing AppShell with map + panels + feeds | page.tsx | ✅ |
| SH-1-03 | Write frontend/app/globals.css | Tailwind directives + terminal theme base styles | globals.css | ✅ |
| SH-1-04 | Write frontend/shared/api/client.ts | API client with base URL, error handling, typed methods | client.ts | ✅ |
| SH-1-05 | Write frontend/shared/api/index.ts | Barrel export for API module | index.ts | ✅ |
| SH-1-06 | Write frontend/shared/constants/index.ts | App-wide constants (API URL, map defaults, score ranges) | index.ts | ✅ |
| SH-1-07 | Write frontend/shared/hooks/use-api.ts | Generic data-fetching hook with loading/error states | use-api.ts | ✅ |
| SH-1-08 | Write frontend/shared/hooks/index.ts | Barrel export for hooks | index.ts | ✅ |
| SH-1-09 | Write frontend/shared/utils/format.ts | Number/date/score formatting utilities | format.ts | ✅ |
| SH-1-10 | Write frontend/shared/utils/index.ts | Barrel export for utils | index.ts | ✅ |
| SH-1-11 | Write frontend/shared/lib/cn.ts | Tailwind class merge utility (clsx + twMerge) | cn.ts | ✅ |
| SH-1-12 | Write frontend/shared/lib/index.ts | Barrel export for lib | index.ts | ✅ |
| SH-1-13 | Write frontend/features/app-shell/components/app-shell.tsx | Main app container: header + map area + side panel + footer | app-shell.tsx | ✅ |
| SH-1-14 | Write frontend/features/app-shell/components/header.tsx | Top bar: logo + search slot + compare tray slot | header.tsx | ✅ |
| SH-1-15 | Write frontend/features/app-shell/components/index.ts | Barrel export | index.ts | ✅ |
| SH-1-16 | Write frontend/features/app-shell/hooks/use-app-state.ts | Global app state: selected entities, compare mode, active layers | use-app-state.ts | ✅ |
| SH-1-17 | Write frontend/features/app-shell/hooks/index.ts | Barrel export | index.ts | ✅ |
| SH-1-18 | Write frontend/features/app-shell/utils/index.ts | Barrel export (placeholder) | index.ts | ✅ |
| SH-1-19 | Write backend/src/main.py | FastAPI app with CORS, route registration, health check | main.py | ✅ |
| SH-1-20 | Write backend/src/shared/config/settings.py | Pydantic Settings class loading from env | settings.py | ✅ |
| SH-1-21 | Write backend/src/shared/config/api_keys.py | API key accessors with validation | api_keys.py | ✅ |
| SH-1-22 | Write backend/src/shared/config/__init__.py | Config barrel export | __init__.py | ✅ |
| SH-1-23 | Write backend/src/shared/utils/error_handler.py | Exception handler middleware for FastAPI | error_handler.py | ✅ |
| SH-1-24 | Write backend/src/shared/utils/response_builder.py | Standardized response builder matching contracts | response_builder.py | ✅ |
| SH-1-25 | Write backend/src/shared/utils/logger.py | Structured logger setup | logger.py | ✅ |
| SH-1-26 | Write backend/src/shared/utils/__init__.py | Utils barrel export | __init__.py | ✅ |
| SH-1-27 | Write backend/src/shared/schemas/base_schema.py | Base Pydantic models (Coordinates, Marker, etc.) | base_schema.py | ✅ |
| SH-1-28 | Write backend/src/shared/schemas/error_schema.py | Error response Pydantic model | error_schema.py | ✅ |
| SH-1-29 | Write backend/src/shared/schemas/__init__.py | Schema barrel export | __init__.py | ✅ |
| SH-1-30 | Write backend/src/shared/clients/http_client.py | Async httpx client with retry/timeout | http_client.py | ✅ |
| SH-1-31 | Write backend/src/shared/clients/cache_client.py | Simple in-memory cache with TTL | cache_client.py | ✅ |
| SH-1-32 | Write backend/src/shared/clients/__init__.py | Clients barrel export | __init__.py | ✅ |
| SH-1-33 | Write backend/src/shared/__init__.py | Shared barrel export | __init__.py | ✅ |

## Srijan — Phase 1 (Map + Layers + Theme)

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SR-1-01 | Write ui-theme/constants/colors.ts | Terminal-inspired color palette constants | colors.ts | ✅ |
| SR-1-02 | Write ui-theme/constants/index.ts | Barrel export | index.ts | ✅ |
| SR-1-03 | Write ui-theme/styles/terminal.css | Terminal-style CSS: glow effects, scanlines, fonts | terminal.css | ✅ |
| SR-1-04 | Write ui-theme/components/terminal-card.tsx | Reusable card with terminal border/glow styling | terminal-card.tsx | ✅ |
| SR-1-05 | Write ui-theme/components/terminal-badge.tsx | Badge component for tags (risk, opportunity, etc.) | terminal-badge.tsx | ✅ |
| SR-1-06 | Write ui-theme/components/loading-indicator.tsx | Terminal-style loading spinner/bar | loading-indicator.tsx | ✅ |
| SR-1-07 | Write ui-theme/components/index.ts | Barrel export | index.ts | ✅ |
| SR-1-08 | Write map-intelligence/types/index.ts | Map types: MarkerData, MapViewport, LayerConfig, MapProps | index.ts | ✅ |
| SR-1-09 | Write map-intelligence/components/world-map.tsx | Main map component with Leaflet, tile layer, marker rendering | world-map.tsx | ✅ |
| SR-1-10 | Write map-intelligence/components/entity-marker.tsx | Company/stock marker with popup | entity-marker.tsx | ✅ |
| SR-1-11 | Write map-intelligence/components/climate-marker.tsx | Climate event marker with category styling | climate-marker.tsx | ✅ |
| SR-1-12 | Write map-intelligence/components/news-marker.tsx | News location marker | news-marker.tsx | ✅ |
| SR-1-13 | Write map-intelligence/components/exchange-marker.tsx | Stock exchange location marker | exchange-marker.tsx | ✅ |
| SR-1-14 | Write map-intelligence/components/index.ts | Barrel export | index.ts | ✅ |
| SR-1-15 | Write map-intelligence/hooks/use-map.ts | Map state hook: viewport, zoom, markers | use-map.ts | ✅ |
| SR-1-16 | Write map-intelligence/hooks/index.ts | Barrel export | index.ts | ✅ |
| SR-1-17 | Write map-intelligence/services/map-data-service.ts | Fetch and transform layer data from /layers endpoint | map-data-service.ts | ✅ |
| SR-1-18 | Write map-intelligence/services/index.ts | Barrel export | index.ts | ✅ |
| SR-1-19 | Write layer-controls/types/index.ts | Layer types: LayerType enum, LayerState | index.ts | ✅ |
| SR-1-20 | Write layer-controls/components/layer-panel.tsx | Layer toggle panel UI | layer-panel.tsx | ✅ |
| SR-1-21 | Write layer-controls/components/layer-toggle.tsx | Individual layer toggle switch | layer-toggle.tsx | ✅ |
| SR-1-22 | Write layer-controls/components/index.ts | Barrel export | index.ts | ✅ |
| SR-1-23 | Write layer-controls/hooks/use-layers.ts | Layer visibility state management | use-layers.ts | ✅ |
| SR-1-24 | Write layer-controls/hooks/index.ts | Barrel export | index.ts | ✅ |

## Sai — Phase 1 (Search + Panels + Feeds)

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SA-1-01 | Write entity-search/types/index.ts | Search types: SearchResult, SearchState | index.ts | ✅ |
| SA-1-02 | Write entity-search/components/search-bar.tsx | Search input with debounced query, results dropdown | search-bar.tsx | ✅ |
| SA-1-03 | Write entity-search/components/search-results.tsx | Dropdown showing matched entities | search-results.tsx | ✅ |
| SA-1-04 | Write entity-search/components/index.ts | Barrel export | index.ts | ✅ |
| SA-1-05 | Write entity-search/hooks/use-search.ts | Search state + debounced API call | use-search.ts | ✅ |
| SA-1-06 | Write entity-search/hooks/index.ts | Barrel export | index.ts | ✅ |
| SA-1-07 | Write entity-search/services/search-service.ts | Call /search endpoint, transform response | search-service.ts | ✅ |
| SA-1-08 | Write entity-search/services/index.ts | Barrel export | index.ts | ✅ |
| SA-1-09 | Write insight-panel/types/index.ts | Panel types: EntityAnalysis, ScoreData, DriverData | index.ts | ✅ |
| SA-1-10 | Write insight-panel/components/insight-panel.tsx | Side panel container showing entity analysis | insight-panel.tsx | ✅ |
| SA-1-11 | Write insight-panel/components/entity-header.tsx | Entity name, type, ticker, country | entity-header.tsx | ✅ |
| SA-1-12 | Write insight-panel/components/score-card.tsx | Single score display with progress bar + drivers | score-card.tsx | ✅ |
| SA-1-13 | Write insight-panel/components/score-section.tsx | All 3 scores grouped together | score-section.tsx | ✅ |
| SA-1-14 | Write insight-panel/components/market-summary.tsx | Price, change %, exchange info | market-summary.tsx | ✅ |
| SA-1-15 | Write insight-panel/components/news-summary.tsx | Recent news list for entity | news-summary.tsx | ✅ |
| SA-1-16 | Write insight-panel/components/climate-summary.tsx | Climate context summary | climate-summary.tsx | ✅ |
| SA-1-17 | Write insight-panel/components/index.ts | Barrel export | index.ts | ✅ |
| SA-1-18 | Write insight-panel/hooks/use-entity-analysis.ts | Fetch + cache entity analysis from /analyze | use-entity-analysis.ts | ✅ |
| SA-1-19 | Write insight-panel/hooks/index.ts | Barrel export | index.ts | ✅ |
| SA-1-20 | Write insight-panel/services/analyze-service.ts | Call /analyze endpoint | analyze-service.ts | ✅ |
| SA-1-21 | Write insight-panel/services/index.ts | Barrel export | index.ts | ✅ |
| SA-1-22 | Write comparison/types/index.ts | Compare types: CompareState, CompareResult | index.ts | ✅ |
| SA-1-23 | Write comparison/components/compare-tray.tsx | Selected entities tray (up to 3 slots) | compare-tray.tsx | ✅ |
| SA-1-24 | Write comparison/components/compare-view.tsx | Side-by-side comparison cards | compare-view.tsx | ✅ |
| SA-1-25 | Write comparison/components/compare-card.tsx | Single entity comparison card | compare-card.tsx | ✅ |
| SA-1-26 | Write comparison/components/index.ts | Barrel export | index.ts | ✅ |
| SA-1-27 | Write comparison/hooks/use-compare.ts | Compare state: add/remove entities, fetch comparison | use-compare.ts | ✅ |
| SA-1-28 | Write comparison/hooks/index.ts | Barrel export | index.ts | ✅ |
| SA-1-29 | Write comparison/services/compare-service.ts | Call /compare endpoint | compare-service.ts | ✅ |
| SA-1-30 | Write comparison/services/index.ts | Barrel export | index.ts | ✅ |
| SA-1-31 | Write news-feed/types/index.ts | News feed types: NewsItem, NewsFeedState | index.ts | ✅ |
| SA-1-32 | Write news-feed/components/news-feed.tsx | Scrollable news feed section | news-feed.tsx | ✅ |
| SA-1-33 | Write news-feed/components/news-card.tsx | Single news item card | news-card.tsx | ✅ |
| SA-1-34 | Write news-feed/components/index.ts | Barrel export | index.ts | ✅ |
| SA-1-35 | Write news-feed/hooks/use-news-feed.ts | Fetch news from /feeds | use-news-feed.ts | ✅ |
| SA-1-36 | Write news-feed/hooks/index.ts | Barrel export | index.ts | ✅ |
| SA-1-37 | Write news-feed/services/news-feed-service.ts | Call /feeds and extract news | news-feed-service.ts | ✅ |
| SA-1-38 | Write news-feed/services/index.ts | Barrel export | index.ts | ✅ |
| SA-1-39 | Write market-feed/types/index.ts | Stock feed types: StockTicker, MarketFeedState | index.ts | ✅ |
| SA-1-40 | Write market-feed/components/market-feed.tsx | Horizontal scrolling stock ticker section | market-feed.tsx | ✅ |
| SA-1-41 | Write market-feed/components/stock-ticker.tsx | Single stock ticker chip | stock-ticker.tsx | ✅ |
| SA-1-42 | Write market-feed/components/index.ts | Barrel export | index.ts | ✅ |
| SA-1-43 | Write market-feed/hooks/use-market-feed.ts | Fetch stocks from /feeds | use-market-feed.ts | ✅ |
| SA-1-44 | Write market-feed/hooks/index.ts | Barrel export | index.ts | ✅ |
| SA-1-45 | Write market-feed/services/market-feed-service.ts | Call /feeds and extract stocks | market-feed-service.ts | ✅ |
| SA-1-46 | Write market-feed/services/index.ts | Barrel export | index.ts | ✅ |
| SA-1-47 | Write crypto-feed/types/index.ts | Crypto feed types: CryptoTicker, CryptoFeedState | index.ts | ✅ |
| SA-1-48 | Write crypto-feed/components/crypto-feed.tsx | Horizontal scrolling crypto ticker section | crypto-feed.tsx | ✅ |
| SA-1-49 | Write crypto-feed/components/crypto-ticker.tsx | Single crypto ticker chip | crypto-ticker.tsx | ✅ |
| SA-1-50 | Write crypto-feed/components/index.ts | Barrel export | index.ts | ✅ |
| SA-1-51 | Write crypto-feed/hooks/use-crypto-feed.ts | Fetch crypto from /feeds | use-crypto-feed.ts | ✅ |
| SA-1-52 | Write crypto-feed/hooks/index.ts | Barrel export | index.ts | ✅ |
| SA-1-53 | Write crypto-feed/services/crypto-feed-service.ts | Call /feeds and extract crypto | crypto-feed-service.ts | ✅ |
| SA-1-54 | Write crypto-feed/services/index.ts | Barrel export | index.ts | ✅ |

## Afham — Phase 1 (Backend Routes + Feature Stubs)

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| AF-1-01 | Write api/routes/__init__.py | Import and register all route modules | __init__.py | ✅ |
| AF-1-02 | Write api/routes/health_routes.py | GET /health endpoint | health_routes.py | ✅ |
| AF-1-03 | Write api/routes/search_routes.py | GET /search with query param | search_routes.py | ✅ |
| AF-1-04 | Write api/routes/analyze_routes.py | GET /analyze with entity param | analyze_routes.py | ✅ |
| AF-1-05 | Write api/routes/compare_routes.py | POST /compare with entity list body | compare_routes.py | ✅ |
| AF-1-06 | Write api/routes/feed_routes.py | GET /feeds | feed_routes.py | ✅ |
| AF-1-07 | Write api/routes/layer_routes.py | GET /layers | layer_routes.py | ✅ |
| AF-1-08 | Write api/controllers/__init__.py | Controller barrel | __init__.py | ✅ |
| AF-1-09 | Write api/controllers/search_controller.py | Search orchestration: resolve → return matches | search_controller.py | ✅ |
| AF-1-10 | Write api/controllers/analyze_controller.py | Analyze orchestration: resolve → market + news + climate + ESG → score | analyze_controller.py | ✅ |
| AF-1-11 | Write api/controllers/compare_controller.py | Compare orchestration: batch analyze | compare_controller.py | ✅ |
| AF-1-12 | Write api/controllers/feed_controller.py | Feed orchestration: aggregate latest data | feed_controller.py | ✅ |
| AF-1-13 | Write api/controllers/layer_controller.py | Layer orchestration: aggregate marker data | layer_controller.py | ✅ |
| AF-1-14 | Write entity-resolver/schemas/entity_schema.py | Pydantic models for entity | entity_schema.py | ✅ |
| AF-1-15 | Write entity-resolver/services/resolver_service.py | Main resolver: query → entity type + data | resolver_service.py | ✅ |
| AF-1-16 | Write entity-resolver/services/company_lookup.py | Company name → info + coordinates | company_lookup.py | ✅ |
| AF-1-17 | Write entity-resolver/services/ticker_lookup.py | Ticker → stock info + exchange coordinates | ticker_lookup.py | ✅ |
| AF-1-18 | Write entity-resolver/services/crypto_lookup.py | Crypto symbol → info | crypto_lookup.py | ✅ |
| AF-1-19 | Write entity-resolver/utils/normalization.py | Query normalization helpers | normalization.py | ✅ |
| AF-1-20 | Write market-intel/schemas/market_schema.py | Pydantic models for market data | market_schema.py | ✅ |
| AF-1-21 | Write market-intel/services/market_service.py | Main market data aggregator | market_service.py | ✅ |
| AF-1-22 | Write market-intel/services/stock_data.py | Stock API integration | stock_data.py | ✅ |
| AF-1-23 | Write market-intel/services/crypto_data.py | Crypto API integration | crypto_data.py | ✅ |
| AF-1-24 | Write market-intel/utils/formatters.py | Price/percentage formatting | formatters.py | ✅ |
| AF-1-25 | Write news-intel/schemas/news_schema.py | Pydantic models for news data | news_schema.py | ✅ |
| AF-1-26 | Write news-intel/services/news_service.py | Main news aggregator | news_service.py | ✅ |
| AF-1-27 | Write news-intel/services/news_geocoder.py | Geocode news articles | news_geocoder.py | ✅ |
| AF-1-28 | Write news-intel/services/news_tagger.py | Tag news: risk/opportunity/regulation/disaster | news_tagger.py | ✅ |
| AF-1-29 | Write news-intel/utils/filters.py | News filtering and deduplication | filters.py | ✅ |
| AF-1-30 | Write climate-intel/schemas/climate_schema.py | Pydantic models for climate data | climate_schema.py | ✅ |
| AF-1-31 | Write climate-intel/services/climate_service.py | Main climate data aggregator | climate_service.py | ✅ |
| AF-1-32 | Write climate-intel/services/weather_events.py | Fetch severe weather events by region | weather_events.py | ✅ |
| AF-1-33 | Write climate-intel/services/vulnerability_scorer.py | Compute climate vulnerability by location | vulnerability_scorer.py | ✅ |
| AF-1-34 | Write climate-intel/utils/geo_helpers.py | Geo distance, coordinate helpers | geo_helpers.py | ✅ |
| AF-1-35 | Write feed-builder/schemas/feed_schema.py | Pydantic models for feed responses | feed_schema.py | ✅ |
| AF-1-36 | Write feed-builder/services/feed_service.py | Main feed aggregator | feed_service.py | ✅ |
| AF-1-37 | Write feed-builder/services/news_feed.py | Latest news for feed | news_feed.py | ✅ |
| AF-1-38 | Write feed-builder/services/stock_feed.py | Latest stock tickers for feed | stock_feed.py | ✅ |
| AF-1-39 | Write feed-builder/services/crypto_feed.py | Latest crypto tickers for feed | crypto_feed.py | ✅ |
| AF-1-40 | Write feed-builder/utils/aggregator.py | Feed combination and sorting | aggregator.py | ✅ |
| AF-1-41 | Write all feature __init__.py files | Barrel exports for each feature package | 6x __init__.py | ✅ |
| AF-1-42 | Write all services __init__.py files | Barrel exports for each services package | 6x __init__.py | ✅ |

## Shravan — Phase 1 (ESG + Scoring Backend)

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-1-34 | Write esg-bridge/schemas/esg_schema.py | Pydantic models for ESG data | esg_schema.py | ⬜ |
| SH-1-35 | Write esg-bridge/services/esg_client.py | HTTP client to Render ESG model | esg_client.py | ⬜ |
| SH-1-36 | Write esg-bridge/services/esg_normalizer.py | Normalize ESG model output to 0–100 | esg_normalizer.py | ⬜ |
| SH-1-37 | Write esg-bridge/utils/fallbacks.py | Fallback ESG data if model is down | fallbacks.py | ⬜ |
| SH-1-38 | Write scoring/schemas/score_schema.py | Pydantic models for scores + drivers | score_schema.py | ⬜ |
| SH-1-39 | Write scoring/services/scoring_engine.py | Main scoring orchestrator | scoring_engine.py | ⬜ |
| SH-1-40 | Write scoring/services/sustainability_scorer.py | Compute sustainability score | sustainability_scorer.py | ⬜ |
| SH-1-41 | Write scoring/services/financial_risk_scorer.py | Compute financial risk score | financial_risk_scorer.py | ⬜ |
| SH-1-42 | Write scoring/services/longterm_impact_scorer.py | Compute long-term impact score | longterm_impact_scorer.py | ⬜ |
| SH-1-43 | Write scoring/services/driver_generator.py | Generate top drivers for each score | driver_generator.py | ⬜ |
| SH-1-44 | Write scoring/utils/weights.py | Score weight constants | weights.py | ⬜ |
| SH-1-45 | Write all esg-bridge __init__.py files | Barrel exports | __init__.py files | ⬜ |
| SH-1-46 | Write all scoring __init__.py files | Barrel exports | __init__.py files | ⬜ |

### 🔍 PHASE 1 REVIEW CHECKPOINT
- [ ] `npm run dev` starts frontend without errors (blank page OK)
- [ ] `uvicorn src.main:app --reload` starts backend without import errors
- [ ] GET /health returns 200
- [ ] All barrel exports resolve correctly
- [ ] All Pydantic models validate against contract JSON schemas
- [ ] All frontend types match contract JSON schemas
- [ ] No circular imports

---

# ═══════════════════════════════════════════
# PHASE 2: REAL DATA + SINGLE ENTITY FLOW (Hour 6–10)
# ═══════════════════════════════════════════

> **Goal:** Search one company → marker appears → info loads → 3 scores display. Real API data flowing.

## Afham — Phase 2

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| AF-2-01 | Implement entity-resolver/services/company_lookup.py | Real company lookup via external API | Working company resolution | ⬜ |
| AF-2-02 | Implement entity-resolver/services/ticker_lookup.py | Real ticker/stock lookup | Working stock resolution | ⬜ |
| AF-2-03 | Implement entity-resolver/services/crypto_lookup.py | Real crypto lookup | Working crypto resolution | ⬜ |
| AF-2-04 | Implement market-intel/services/stock_data.py | Real stock price/change data from API | Working stock data | ⬜ |
| AF-2-05 | Implement market-intel/services/crypto_data.py | Real crypto price data from API | Working crypto data | ⬜ |
| AF-2-06 | Implement news-intel/services/news_service.py | Real news data from NewsAPI/GNews | Working news data | ⬜ |
| AF-2-07 | Implement climate-intel/services/climate_service.py | Real climate data from weather API | Working climate data | ⬜ |
| AF-2-08 | Wire analyze_controller.py end-to-end | Connect all services → full /analyze response | Working /analyze | ⬜ |
| AF-2-09 | Wire search_controller.py end-to-end | Connect resolver → /search response | Working /search | ⬜ |

## Shravan — Phase 2

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-2-01 | Implement esg-bridge/services/esg_client.py | Real ESG model HTTP call | Working ESG data | ⬜ |
| SH-2-02 | Implement scoring/services/scoring_engine.py | Wire all 3 scorers + driver generator | Working scores | ⬜ |
| SH-2-03 | Integration: frontend search → backend /search | End-to-end search working | Verified flow | ⬜ |
| SH-2-04 | Integration: frontend analyze → backend /analyze | End-to-end single entity analysis | Verified flow | ⬜ |

## Srijan — Phase 2

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SR-2-01 | Implement world-map.tsx with real tile rendering | Map loads with tiles | Visible map | ⬜ |
| SR-2-02 | Implement entity-marker.tsx with real positioning | Marker appears at entity coordinates | Visible marker | ⬜ |
| SR-2-03 | Implement layer-panel.tsx with toggle state | Layer toggles work (even if no data yet) | Interactive layers | ⬜ |

## Sai — Phase 2

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SA-2-01 | Implement search-bar.tsx with real API call | Search triggers, results appear | Working search UI | ⬜ |
| SA-2-02 | Implement insight-panel.tsx with real data | Panel shows entity analysis | Visible analysis | ⬜ |
| SA-2-03 | Implement score-card.tsx + score-section.tsx | 3 scores render with drivers | Visible scores | ⬜ |
| SA-2-04 | Implement market-summary.tsx | Price/change renders | Visible market data | ⬜ |

### 🔍 PHASE 2 REVIEW CHECKPOINT
- [ ] Search "Apple" → results dropdown → select → marker on map → insight panel shows all data + 3 scores
- [ ] Search "TSLA" → works for stock ticker input
- [ ] Search "Bitcoin" → works for crypto input
- [ ] All 3 score cards show with colored bars and top drivers
- [ ] Error states display properly (API down, no results)
- [ ] Loading states display properly

---

# ═══════════════════════════════════════════
# PHASE 3: COMPARISON + LAYERS (Hour 10–14)
# ═══════════════════════════════════════════

> **Goal:** Compare 3 entities side-by-side. Map layers toggle with real markers.

## Afham — Phase 3

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| AF-3-01 | Implement compare_controller.py | Batch analyze → comparison response | Working /compare | ⬜ |
| AF-3-02 | Implement layer_controller.py | Aggregate markers for /layers | Working /layers | ⬜ |
| AF-3-03 | Implement news_geocoder.py | Geocode news for map markers | News with coordinates | ⬜ |
| AF-3-04 | Implement news_tagger.py | Tag news articles with categories | Tagged news | ⬜ |

## Sai — Phase 3

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SA-3-01 | Implement compare-tray.tsx | Add/remove entities, max 3 | Working tray UI | ⬜ |
| SA-3-02 | Implement compare-view.tsx + compare-card.tsx | Side-by-side cards with scores | Working comparison | ⬜ |
| SA-3-03 | Implement news-summary.tsx + climate-summary.tsx in panel | News + climate sections in insight panel | Complete panel | ⬜ |

## Srijan — Phase 3

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SR-3-01 | Implement climate-marker.tsx with real data | Climate events on map | Visible climate markers | ⬜ |
| SR-3-02 | Implement news-marker.tsx with real data | News locations on map | Visible news markers | ⬜ |
| SR-3-03 | Implement exchange-marker.tsx with real data | Stock exchanges on map | Visible exchange markers | ⬜ |
| SR-3-04 | Layer toggles control marker visibility | Toggling layers hides/shows markers | Interactive layers | ⬜ |
| SR-3-05 | Multi-entity markers (compare mode) | All 3 entities visible on map at once | Multi-marker map | ⬜ |

## Shravan — Phase 3

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-3-01 | Integration: compare flow end-to-end | Frontend compare → backend → 3 cards | Verified compare | ⬜ |
| SH-3-02 | Integration: layers flow end-to-end | Frontend toggle → backend → markers appear | Verified layers | ⬜ |

### 🔍 PHASE 3 REVIEW CHECKPOINT
- [ ] Add 3 entities → compare tray fills → compare button → side-by-side cards
- [ ] All 3 entities show markers on map simultaneously
- [ ] Layer toggles: climate ON/OFF, news ON/OFF, exchanges ON/OFF
- [ ] Scores are consistent between single analyze and compare views
- [ ] Map doesn't break with multiple marker types

---

# ═══════════════════════════════════════════
# PHASE 4: FEEDS + POLISH (Hour 14–18)
# ═══════════════════════════════════════════

> **Goal:** Below-fold feeds work. UI is polished. Terminal theme is applied everywhere.

## Afham — Phase 4

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| AF-4-01 | Implement feed_controller.py | Aggregate latest news + stocks + crypto | Working /feeds | ⬜ |
| AF-4-02 | Implement feed-builder services | news_feed.py, stock_feed.py, crypto_feed.py | Working feed data | ⬜ |
| AF-4-03 | Add caching to all external API calls | In-memory TTL cache for repeated queries | Faster responses | ⬜ |

## Sai — Phase 4

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SA-4-01 | Implement news-feed.tsx + news-card.tsx | Scrollable news section below map | Visible news feed | ⬜ |
| SA-4-02 | Implement market-feed.tsx + stock-ticker.tsx | Horizontal stock ticker row | Visible stock feed | ⬜ |
| SA-4-03 | Implement crypto-feed.tsx + crypto-ticker.tsx | Horizontal crypto ticker row | Visible crypto feed | ⬜ |
| SA-4-04 | Polish all components with terminal theme | Apply TerminalCard, badges, colors | Themed components | ⬜ |

## Srijan — Phase 4

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SR-4-01 | Polish map styling with terminal theme | Dark map tiles, glowing markers | Themed map | ⬜ |
| SR-4-02 | Add map interaction polish | Smooth zoom, marker clusters if needed | Smooth map UX | ⬜ |
| SR-4-03 | Marker popups with styled content | Terminal-themed popups with entity info | Styled popups | ⬜ |

## Shravan — Phase 4

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-4-01 | Integration: feeds end-to-end | Frontend feeds → backend /feeds | Verified feeds | ⬜ |
| SH-4-02 | Full app visual review | Check all pages, flows, edge cases | Bug list | ⬜ |
| SH-4-03 | Fix integration bugs | Address any data mismatches | Fixes merged | ⬜ |

### 🔍 PHASE 4 REVIEW CHECKPOINT
- [ ] Scroll below map → news feed, stock tickers, crypto tickers all populated
- [ ] Terminal theme is consistent across all components
- [ ] All loading and error states are styled
- [ ] App looks "demo-ready" for judges
- [ ] No console errors

---

# ═══════════════════════════════════════════
# PHASE 5: TESTING + DEMO LOCK (Hour 18–24)
# ═══════════════════════════════════════════

> **Goal:** Everything works for the demo. Fallbacks exist. Rehearsed.

## Shravan — Phase 5

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| SH-5-01 | Write backend tests | Test all 5 endpoints | Passing tests | ⬜ |
| SH-5-02 | Full demo run-through | Follow demo-script.md step by step | Issues list | ⬜ |
| SH-5-03 | Fix any remaining bugs | Address demo run-through issues | Stable app | ⬜ |
| SH-5-04 | Deploy backend to Render | Backend accessible at public URL | Live backend | ⬜ |
| SH-5-05 | Deploy frontend to Vercel | Frontend accessible at public URL | Live frontend | ⬜ |
| SH-5-06 | Final env variable setup | Production env vars set | Working production | ⬜ |
| SH-5-07 | Final demo rehearsal | Complete demo script with live app | Ready for judges | ⬜ |

## Everyone — Phase 5

| ID | Task | Description | Output | Status |
|----|------|-------------|--------|--------|
| ALL-5-01 | Test own feature on deployed app | Verify feature works in production | Confirmation | ⬜ |
| ALL-5-02 | Prepare fallback screenshots | Screenshots of working features | Screenshots saved | ⬜ |
| ALL-5-03 | Rehearse demo presentation roles | Each person knows their demo part | Prepared team | ⬜ |

### 🔍 PHASE 5 REVIEW CHECKPOINT
- [ ] Demo flows on production URL without interruption
- [ ] All team members can present their part
- [ ] Fallback screenshots exist for every feature
- [ ] Backend tests pass
- [ ] No critical bugs remaining

---

## TOTAL TASK COUNT

| Owner | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Total |
|-------|---------|---------|---------|---------|---------|---------|-------|
| Shravan | 20 | 46 | 4 | 2 | 3 | 7 | **82** |
| Srijan | 0 | 24 | 3 | 5 | 3 | 1+ | **36+** |
| Sai | 0 | 54 | 4 | 3 | 4 | 1+ | **66+** |
| Afham | 0 | 42 | 9 | 4 | 3 | 1+ | **59+** |
| **TOTAL** | **20** | **166** | **20** | **14** | **13** | **13** | **246** |

> Note: Shravan's Phase 1 count includes shared infrastructure that unblocks all other team members.

---

## Key Rules for AI Agents Executing These Tasks

1. **Read contracts first** — Before writing any service or type file, read the contract JSON schema it must conform to
2. **Read CLAUDE.md** — Follow naming conventions, patterns, and architecture guidance
3. **Check imports** — After writing any file, verify all imports resolve to real files
4. **Follow barrel pattern** — Every folder has an index.ts/\_\_init\_\_.py that re-exports public API
5. **No cross-feature imports** — Features only import from shared/ or their own folder
6. **Match contract shapes exactly** — TypeScript types and Pydantic models must match JSON contracts field-for-field
7. **Stub before implement** — Write the function signature + return type first, then implement
8. **Test after each phase** — Don't move to next phase until review checkpoint passes
