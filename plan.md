Here’s the revised detailed plan for **GreenTrust**, now aligned to:

* **Team members:** Shravan, Srijan, Sai, Afham
* **Stack:** **TypeScript + Next.js + Tailwind CSS** for frontend, **Python** for backend
* **Team workflow:** feature-based code structure, strong file isolation, PR-based development
* **Your role:** you help everyone, unblock issues, and handle final integration/connections
* **Terminal UI prerequisite:** every member should install the OpenTUI skill in their IDE/workflow using `npx skills add msmps/opentui-skill`; that skill exists as a public repo, and `npx skills` is the CLI used to add skills. ([GitHub][1])

---

# GreenTrust project plan

## 1. Project goal

**GreenTrust** is a **map-first sustainable finance intelligence platform**.

It helps users compare **companies, stocks, and lighter crypto entities** using:

* ESG scoring
* climate vulnerability by geography
* market context
* location-based news mapping
* risk / opportunity / regulation / disaster tagging

### Main judge demo flow

A user:

1. opens the world map
2. searches 3 companies/stocks
3. compares them on the map
4. sees ESG, financial risk, and long-term impact scores
5. turns on news/climate layers
6. scrolls down to latest news, stocks, and crypto

---

## 2. Locked scope for the hackathon

## Core features

* World map as the main screen
* Search bar at top-right
* Compare up to **3 companies/stocks**
* Company markers
* Stock exchange markers
* Climate event markers
* News markers
* Separate scores:

  * Sustainability / ESG Score
  * Financial Risk Score
  * Long-Term Impact Score
* Latest news section
* Latest stocks section
* Latest crypto section
* Terminal-inspired visual theme

## Optional layers

These should be toggleable and treated as extra overlays:

* climate vulnerability heatmap
* region risk overlay
* event-company connection lines

## Removed from MVP

* auth
* email
* route checking

---

# 3. Build philosophy

This project should be:

* **feature-based**
* **modular**
* **isolated by ownership**
* **integration-friendly**
* **demo-stable**

The team should not work file-by-file across the whole repo.
Each person should own a **feature directory** and avoid touching others’ folders unless required.

You, **Shravan**, act as:

* coordinator
* contract owner
* blocker remover
* PR reviewer
* final integrator
* final demo connector

---

# 4. Prerequisites for all 4 team members

Before coding starts, every member should have:

* Node environment ready for frontend
* Python environment ready for backend
* GitHub repo access
* environment variable template shared
* agreed API contracts
* OpenTUI skill installed in their IDE/workflow:

  * `npx skills add msmps/opentui-skill` ([GitHub][1])

### Team rule

Treat the OpenTUI skill as a **developer-side terminal UI reference/prerequisite**, not as the deployed app runtime.
The shipped app is still built with:

* Next.js
* TypeScript
* Tailwind CSS
* Python backend

---

# 5. High-level architecture

## Frontend

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* map-first UI
* compare mode
* layered dashboard

## Backend

* **Python**
* API orchestration layer
* external API integration
* ESG model integration
* score calculation
* normalized response formatting

## External sources

* market data API
* news API
* climate/severe weather API
* geocoding/map data
* hosted ESG model on Render

---

# 6. Recommended repo structure

Use a **monorepo** with strict feature ownership.

```text
greentrust/
  frontend/
    app/
      layout.tsx
      page.tsx
      globals.css

    features/
      app-shell/
        components/
        hooks/
        utils/

      map-intelligence/
        components/
        hooks/
        services/
        types/

      layer-controls/
        components/
        hooks/
        types/

      entity-search/
        components/
        hooks/
        services/
        types/

      comparison/
        components/
        hooks/
        services/
        types/

      insight-panel/
        components/
        hooks/
        services/
        types/

      market-feed/
        components/
        hooks/
        services/
        types/

      crypto-feed/
        components/
        hooks/
        services/
        types/

      news-feed/
        components/
        hooks/
        services/
        types/

      ui-theme/
        components/
        styles/
        constants/

    shared/
      api/
      lib/
      hooks/
      constants/
      utils/

  backend/
    src/
      api/
        routes/
        controllers/

      features/
        entity-resolver/
          services/
          schemas/
          utils/

        market-intel/
          services/
          schemas/
          utils/

        news-intel/
          services/
          schemas/
          utils/

        climate-intel/
          services/
          schemas/
          utils/

        esg-bridge/
          services/
          schemas/
          utils/

        scoring/
          services/
          schemas/
          utils/

        feed-builder/
          services/
          schemas/
          utils/

      shared/
        clients/
        config/
        schemas/
        utils/

      main.py

  contracts/
    analyze-response.json
    search-response.json
    map-layers-response.json
    compare-response.json

  docs/
    architecture.md
    api-notes.md
    demo-script.md
    team-checklist.md
```

---

# 7. File isolation rules

This is the most important engineering rule for your team.

## Rule 1

Each person owns **feature folders**, not random files across the app.

## Rule 2

No one should directly edit another person’s feature folder unless discussed.

## Rule 3

Shared files should be edited by **Shravan only** or after coordination.

## Rule 4

All cross-feature communication should happen through:

* typed contracts
* exported service functions
* API payload definitions

## Rule 5

Do not let everyone touch:

* `page.tsx`
* app shell
* backend entrypoint
* shared contracts

Those become merge-conflict magnets.

---

# 8. Ownership plan by team member

## Shravan — coordinator, integration, scoring, final connections

You should own:

### Primary ownership

* `contracts/`
* `frontend/app/`
* `frontend/features/app-shell/`
* `backend/src/features/esg-bridge/`
* `backend/src/features/scoring/`
* final environment setup
* final deployment wiring
* PR review
* integration testing
* final connection of frontend + backend

### Responsibility

* lock contracts early
* help unblock everyone
* verify feature compatibility
* connect frontend with backend at milestones
* handle final polish and final merge
* keep the build demo-safe

### You also support

* ESG model integration with Render
* score explanations
* fallback handling
* demo script and final presentation flow

---

## Srijan — map intelligence and layer system

Srijan should own:

```text
frontend/features/map-intelligence/
frontend/features/layer-controls/
frontend/features/ui-theme/   (shared with your review)
```

### Responsibilities

* world map setup
* marker rendering
* default economy-focused map state
* layer toggle UI
* stock exchange markers
* climate markers
* news markers
* optional overlay support hooks
* terminal-inspired look for the map area

### Deliverables

* map loads first
* markers render correctly
* layers can be toggled
* map remains clean by default
* compare entities can all appear on same map

---

## Sai — search, comparison, insight panel, below-fold experience

Sai should own:

```text
frontend/features/entity-search/
frontend/features/comparison/
frontend/features/insight-panel/
frontend/features/market-feed/
frontend/features/crypto-feed/
frontend/features/news-feed/
```

### Responsibilities

* top-right search bar
* query UX
* selected entity cards
* comparison mode for 3 entities
* score card UI
* driver/explanation UI
* latest news section
* stock ticker section
* crypto ticker section

### Deliverables

* search input works smoothly
* side panel displays entity insights
* compare mode is readable
* 3-card comparison is polished
* below-fold feeds look complete for judges

---

## Afham — Python backend orchestration and API aggregation

Afham should own:

```text
backend/src/features/entity-resolver/
backend/src/features/market-intel/
backend/src/features/news-intel/
backend/src/features/climate-intel/
backend/src/features/feed-builder/
backend/src/api/
```

### Responsibilities

* entity resolution from input
* company/ticker/crypto lookup
* market API integration
* news API integration
* climate API integration
* feed generation for homepage
* normalized backend responses
* backend route/controller setup

### Deliverables

* analyze/search/feed endpoints work
* market/news/climate data is normalized
* compare requests can return multiple entities
* fallback responses exist for partial API failures

---

# 9. Locked shared ownership boundaries

To reduce conflicts, these files/folders should be controlled carefully.

## Shravan-only or Shravan-approved

* `frontend/app/page.tsx`
* `frontend/app/layout.tsx`
* `backend/src/main.py`
* `contracts/*`
* root environment files
* deployment config

## Everyone else

Only edit your own feature folders and your own feature exports.

---

# 10. Core backend endpoints

Keep the backend simple and predictable.

## 1. `/search`

Input:

* query

Output:

* matched companies
* matched stocks
* matched crypto

## 2. `/analyze`

Input:

* one entity query

Output:

* entity info
* market data
* related news
* climate context
* ESG score
* financial risk score
* long-term impact score
* score drivers
* map marker info

## 3. `/compare`

Input:

* up to 3 entities

Output:

* normalized array of analysis objects

## 4. `/feeds`

Output:

* latest finance/climate news
* latest stock ticker feed
* latest crypto ticker feed

## 5. `/layers`

Output:

* exchange markers
* climate markers
* news markers
* optional overlay datasets

---

# 11. Shared response contracts to lock first

Before real coding starts, lock these payload shapes.

## Analyze entity response

```json
{
  "id": "",
  "name": "",
  "type": "company | stock | crypto",
  "ticker": "",
  "country": "",
  "coordinates": { "lat": 0, "lng": 0 },
  "market": {
    "price": 0,
    "changePercent": 0,
    "exchange": ""
  },
  "news": [],
  "climate": {
    "summary": "",
    "events": [],
    "vulnerability": ""
  },
  "scores": {
    "sustainability": 0,
    "financialRisk": 0,
    "longTermImpact": 0
  },
  "drivers": {
    "sustainability": [],
    "financialRisk": [],
    "longTermImpact": []
  }
}
```

## Compare response

```json
{
  "entities": []
}
```

## Feed response

```json
{
  "news": [],
  "stocks": [],
  "crypto": []
}
```

These contracts should be created first in `contracts/` and mirrored in frontend/backend.

---

# 12. Score logic plan

You said you want **separate scores**, not a master score.

## 1. Sustainability Score

Main source:

* ESG model output from Render

Can also use:

* sustainability-related signals
* regulation/opportunity news adjustments

## 2. Financial Risk Score

Can combine:

* market movement/volatility context
* severe weather relevance
* negative or disaster-tagged news
* geography-based exposure

## 3. Long-Term Impact Score

Can combine:

* regional climate vulnerability
* ESG resilience signal
* future climate relevance
* regulation/opportunity outlook

## Important UI rule

Every score should show **Top Drivers**.
That makes the demo more trustworthy.

Example:

* Sustainability Score: 84

  * strong ESG model output
  * positive regulation signals
* Financial Risk Score: 67

  * recent climate event exposure
  * negative market/news pressure
* Long-Term Impact Score: 79

  * favorable resilience indicators
  * lower long-term vulnerability

---

# 13. Frontend screen plan

## Screen 1 — Main dashboard

### Top

* GreenTrust logo
* top-right search bar
* compare tray
* layer toggles

### Main area

* full-screen world map

### Side panel

* selected entity analysis
* price/company info
* 3 scores
* top drivers
* recent news summary
* climate summary

### Below fold

* latest finance/climate news
* stock ticker row
* crypto ticker row

---

## Screen 2 — Compare mode

When 2 or 3 entities are selected:

* all markers visible on map
* comparison cards visible
* score blocks side by side
* differences easy to spot

---

## Screen 3 — Layer control

Toggle:

* economy/default layer
* company markers
* stock exchange markers
* climate events
* news markers
* optional overlays

---

# 14. 24-hour execution schedule

## Phase 1 — Hour 0 to 2

### Goal

Lock everything before coding chaos starts.

### Shravan

* create repo structure
* create `contracts/`
* create environment template
* define branch names
* write team checklist
* confirm API contracts

### Everyone

* install the OpenTUI skill
* pull repo
* create feature branch
* review contract files

---

## Phase 2 — Hour 2 to 6

### Goal

Scaffold everything.

### Srijan

* world map skeleton
* markers scaffold
* layer panel shell

### Sai

* search bar
* compare UI shell
* insight panel shell
* below-fold layout shell

### Afham

* backend route scaffold
* API service stubs
* resolver stub
* feed stub

### Shravan

* contracts finalized
* ESG bridge stub
* scoring service stub
* shell integration points
* unblock issues

---

## Phase 3 — Hour 6 to 10

### Goal

Get real data moving.

### Srijan

* render static/dynamic markers
* layer toggles functional

### Sai

* connect search and insight panel to API responses
* card rendering for analysis

### Afham

* market API integration
* news API integration
* climate API integration
* unified analyze response

### Shravan

* ESG endpoint integration
* scoring logic
* frontend-backend connection pass 1

---

## Phase 4 — Hour 10 to 14

### Goal

Complete 1-entity analysis flow.

By the end of this phase, this must work:

* search one company/stock
* marker appears
* stock info appears
* news appears
* climate appears
* 3 scores appear

### Shravan

Own the integration checkpoint here.

---

## Phase 5 — Hour 14 to 18

### Goal

Finish comparison mode.

### Srijan

* multi-marker visibility
* map adjustments for 2–3 entities

### Sai

* comparison cards for 3 entities
* score comparison layout

### Afham

* compare endpoint / multi-entity backend flow

### Shravan

* compare response integration
* scoring consistency
* fix payload mismatches

---

## Phase 6 — Hour 18 to 21

### Goal

Polish and optional layers.

Do only if core flow is stable:

* exchange markers
* news markers refinement
* climate markers refinement
* optional overlays if time allows

---

## Phase 7 — Hour 21 to 24

### Goal

Demo lock.

### Shravan

* final merge
* final bug check
* final connections
* final env verification
* deployment
* demo script rehearsal

### Everyone

* test assigned feature
* prepare fallback screenshots
* rehearse judge flow

---

# 15. PR workflow

## Branch names

* `feature/map-intelligence`
* `feature/layer-controls`
* `feature/entity-search`
* `feature/comparison`
* `feature/insight-panel`
* `feature/feeds`
* `feature/backend-orchestrator`
* `feature/esg-scoring`
* `chore/contracts`

## PR rules

* one PR per feature concern
* no mixed PRs
* no cross-folder edits without note
* every PR should list:

  * what changed
  * what API contract it depends on
  * screenshots if frontend
  * sample response if backend

## Merge rule

Shravan merges only after:

* contract compatibility is checked
* branch builds locally
* no one else’s feature was broken

---

# 16. Team coordination rules

## Daily working rule for hackathon

Every 2–3 hours, do a quick sync:

* what is done
* what is blocked
* what contract changed
* what needs integration

## Ownership rule

If someone is blocked in another folder:

* do not patch it directly
* tell the owner
* Shravan coordinates the fix

## Final integration rule

No big refactors after compare mode works.

---

# 17. Priority order

## Tier 1 — Must work

* map
* search
* single company/stock analysis
* ESG score
* financial risk score
* long-term impact score
* stock/company summary
* news
* climate context

## Tier 2 — Should work

* compare 3 entities
* exchange markers
* news markers
* below-fold feeds
* crypto lighter flow

## Tier 3 — Nice to have

* climate vulnerability heatmap
* region risk overlay
* event-company lines
* X updates for crypto

---

# 18. Demo script plan

## Step 1

Open GreenTrust homepage:

* world map
* terminal-style theme
* search top-right

## Step 2

Search first company/stock:

* show marker
* show stock/company summary
* show ESG, risk, impact scores

## Step 3

Turn on climate and news layers:

* show why location matters
* show category-tagged news

## Step 4

Add 2 more entities:

* show 3-way comparison

## Step 5

Scroll down:

* latest news
* stocks
* crypto

## Final line

GreenTrust helps users understand not only price and market movement, but also sustainability, climate exposure, and long-term financial resilience on one global map.

---

# 19. Definition of done

The project is ready if:

* homepage opens on the map
* search works
* at least one real company/stock flow works fully
* compare 3 works
* scores render correctly
* map layers render correctly
* feeds show real data
* UI looks polished enough for judges
* demo can be completed smoothly in 2–3 minutes

---

# 20. Final recommendation for your role, Shravan

Your best role is not to own “just one feature.”
Your best role is to be the **integration captain**.

You should:

* define contracts first
* keep everyone inside isolated folders
* support blockers quickly
* own ESG + scoring + shared shell
* do final stitching
* lock the final demo flow

That gives the team the highest chance of hitting **80–90%** of your intended scope without repo chaos.

I can convert this into a **GitHub issues/task board with one checklist per team member**.

[1]: https://github.com/msmps/opentui-skill?utm_source=chatgpt.com "msmps/opentui-skill: OpenTUI skill for use with OpenCode - GitHub"
