# GreenTrust Architecture

## System Overview

```
┌───────────────────────────────────────────────┐
│              USER BROWSER                      │
│  Next.js App (port :3000)                      │
│                                                 │
│  ┌───────────────────────────────────────────┐│
│  │ Header: Logo + Search Bar + Compare Tray    ││
│  ├───────────────────────────────────────────┤│
│  │ ┌─────────────────────────┐ ┌─────────────┐  ││
│  │ │ World Map (Leaflet)       │ │ Insight    │  ││
│  │ │ - Entity markers         │ │ Panel      │  ││
│  │ │ - Exchange markers       │ │ - Scores   │  ││
│  │ │ - Climate markers        │ │ - Market   │  ││
│  │ │ - News markers           │ │ - News     │  ││
│  │ │ + Layer Controls         │ │ - Climate  │  ││
│  │ └─────────────────────────┘ └─────────────┘  ││
│  ├───────────────────────────────────────────┤│
│  │ Below-fold: News Feed | Stock Feed | Crypto ││
│  └───────────────────────────────────────────┘│
└──────────────────┬────────────────────────────┘
                   │
                   │ HTTP REST (JSON)
                   │ Contracts: /contracts/*.json
                   │
┌──────────────────┴────────────────────────────┐
│             FASTAPI BACKEND (port :8000)         │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Routes:                                     │ │
│  │  GET  /health                                 │ │
│  │  GET  /search?q=                               │ │
│  │  GET  /analyze?entity=                          │ │
│  │  POST /compare                                 │ │
│  │  GET  /feeds                                    │ │
│  │  GET  /layers                                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Entity     │ │ Market      │ │ News        │  │
│  │ Resolver   │ │ Intel       │ │ Intel       │  │
│  └────────────┘ └─────────────┘ └─────────────┘  │
│  ┌────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Climate    │ │ ESG Bridge  │ │ Scoring     │  │
│  │ Intel      │ │ (to Render) │ │ Engine      │  │
│  └────────────┘ └─────────────┘ └─────────────┘  │
│  ┌────────────┐                                    │
│  │ Feed       │                                    │
│  │ Builder    │                                    │
│  └────────────┘                                    │
└────────────────────────────────────────────────┘
         │                │             │
         ▼                ▼             ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Market API │  │ News API   │  │ Weather API│
│ (Alpha V)  │  │ (NewsAPI)  │  │ (OWM)      │
└────────────┘  └────────────┘  └────────────┘
```

## Data Flow: Single Entity Analysis

```
User searches "Apple"
    │
    ▼
Frontend: entity-search → calls GET /search?q=apple
    │
    ▼
Backend: search_controller → entity-resolver → returns matches
    │
    ▼
User selects "Apple Inc" from results
    │
    ▼
Frontend: insight-panel → calls GET /analyze?entity=AAPL
    │
    ▼
Backend: analyze_controller orchestrates in parallel:
    ├── entity-resolver → company info + coordinates
    ├── market-intel → stock price, change, volume
    ├── news-intel → recent news + geocoded + tagged
    ├── climate-intel → weather events + vulnerability
    └── esg-bridge → ESG model output
    │
    ▼
Backend: scoring-engine combines all data:
    ├── sustainability_scorer(esg, news, regulation)
    ├── financial_risk_scorer(market, climate, news, geo)
    └── longterm_impact_scorer(climate, esg, regulation)
    │
    ▼
Backend: driver_generator creates top reasons for each score
    │
    ▼
JSON response → matches contracts/analyze-response.json
    │
    ▼
Frontend renders:
    ├── Marker on world map (map-intelligence)
    ├── Entity info + scores in insight panel
    └── News + climate summaries
```

## Data Flow: Compare 3 Entities

```
User adds 3 entities to compare tray
    │
    ▼
Frontend: comparison → calls POST /compare { entities: ["AAPL", "TSLA", "BTC"] }
    │
    ▼
Backend: compare_controller → runs analyze_controller for each (parallel)
    │
    ▼
JSON response: { entities: [AnalyzeResponse, AnalyzeResponse, AnalyzeResponse] }
    │
    ▼
Frontend renders:
    ├── All 3 markers on map
    ├── Side-by-side comparison cards
    └── Score comparison bars
```

## Feature Module Architecture

Each feature follows the same internal structure:

```
feature-name/
    components/    → React components (frontend) or N/A (backend)
    hooks/         → Custom React hooks (frontend only)
    services/      → API calls (frontend) or business logic (backend)
    types/         → TypeScript interfaces (frontend only)
    schemas/       → Pydantic models (backend only)
    utils/         → Helper functions
    index.ts/.py   → Barrel export
```

## Score Calculation Architecture

```
                    ┌─────────────────┐
                    │ scoring_engine │
                    └────────┬────────┘
                             │
              ┌────────────┼────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌───────────┐ ┌─────────────┐
    │ Sustainability│  │ Financial │ │ Long-Term    │
    │ Scorer        │  │ Risk      │ │ Impact       │
    └─────────────┘  └───────────┘ └─────────────┘
    Inputs:          Inputs:       Inputs:
    - ESG model      - Market vol  - Climate vuln
    - News signals   - Climate     - ESG resilience
    - Regulation     - News neg    - Regulation
    Weights:         - Geography   - Opportunity
    60/25/15         Weights:      Weights:
                     30/25/25/20   30/25/25/20
              │              │              │
              ▼              ▼              ▼
    ┌───────────────────────────────────────────┐
    │           driver_generator                  │
    │  Generates top 3 reasons per score           │
    └───────────────────────────────────────────┘
```
