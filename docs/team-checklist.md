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
- [ ] Verify all contracts are valid JSON
- [ ] Confirm `.env.example` files are complete
- [ ] ESG model URL is accessible
- [ ] Set up API keys in `backend/.env`
- [ ] Review each team member’s branch naming

## Srijan Setup

- [ ] All items above
- [ ] Leaflet / react-leaflet installed and loading
- [ ] Map tiles rendering (check CORS, tile URL)
- [ ] Understand layer types: entity, exchange, climate, news
- [ ] Review `contracts/map-layers-response.json`

## Sai Setup

- [ ] All items above
- [ ] Understand `contracts/search-response.json`
- [ ] Understand `contracts/analyze-response.json`
- [ ] Understand `contracts/compare-response.json`
- [ ] Understand `contracts/feed-response.json`
- [ ] Review insight-panel, comparison, and feed UI requirements

## Afham Setup

- [ ] All items above
- [ ] Python 3.11+ confirmed
- [ ] FastAPI + uvicorn running
- [ ] Market API key (Alpha Vantage / Yahoo Finance) — test a call
- [ ] News API key (NewsAPI.org) — test a call
- [ ] Climate API key (OpenWeatherMap) — test a call
- [ ] Understand all 5 endpoint contracts
- [ ] Review entity-resolver expected behavior

---

## Phase Review Cadence

After each phase, the team does a review:

1. **Phase 0 Review** — Contracts locked? Configs work? Everyone set up?
2. **Phase 1 Review** — App boots? No import errors? All stubs in place?
3. **Phase 2 Review** — Single entity flow works end-to-end?
4. **Phase 3 Review** — Compare + layers work?
5. **Phase 4 Review** — Feeds work? UI polished?
6. **Phase 5 Review** — Demo-ready? Deployed?
