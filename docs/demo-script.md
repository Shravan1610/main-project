# GreenTrust — Demo Script

**Duration:** 2–3 minutes
**Presenter:** Shravan (with team support)

---

## Opening (15 seconds)

> "This is GreenTrust — a map-first sustainable finance intelligence platform.
> It helps investors understand not just price, but sustainability, climate exposure, and long-term financial resilience."

---

## Step 1: The Map (15 seconds)

*Show the full-screen world map with terminal theme.*

> "The first thing you see is a global map. This is the primary interface.
> Everything — companies, exchanges, climate events, news — lives on this map."

---

## Step 2: Search a Company (30 seconds)

*Type "Apple" in the search bar. Select Apple Inc.*

> "Let's search for Apple. We get instant results.
> When I select it, a marker appears on the map at Apple's headquarters in Cupertino.
> On the right, the insight panel shows:
> - Apple's current stock price and market data
> - Three separate scores: Sustainability, Financial Risk, and Long-Term Impact
> - Each score shows its top drivers — the reasons behind the number"

*Point to each score and its drivers.*

> "This isn't a black-box rating. You see exactly why Apple scored 84 on sustainability."

---

## Step 3: Toggle Layers (20 seconds)

*Turn on Climate Events layer. Turn on News layer.*

> "Now I turn on climate and news layers.
> You can see active weather events near Apple's operations,
> and recent news articles geolocated on the map.
> Each news item is tagged: risk, opportunity, regulation, or disaster."

---

## Step 4: Compare 3 Entities (30 seconds)

*Add Tesla and Bitcoin to compare tray. Click Compare.*

> "Now let's compare. I add Tesla and Bitcoin.
> All three markers appear on the map.
> The comparison view shows their scores side by side.
> Apple has the best sustainability. Bitcoin has higher financial risk.
> Tesla shows strong long-term impact due to its clean energy position."

---

## Step 5: Below-the-Fold Feeds (20 seconds)

*Scroll down below the map.*

> "Below the map, we have live feeds:
> - Latest finance and climate news
> - Real-time stock ticker prices
> - Crypto market overview
> These update in real time and are relevant to sustainable investing."

---

## Closing (15 seconds)

> "GreenTrust helps investors understand not only price and market movement,
> but also sustainability, climate exposure, and long-term financial resilience —
> all on one global map.
>
> Built with Next.js, FastAPI, and real-time data from market, news, climate, and ESG APIs.
> Thank you."

---

## Fallback Plan

If any API is slow or down:
- Show pre-captured screenshots of each step
- Screenshots saved in `public/assets/demo-fallback/`
- Each screenshot labeled: `step1-map.png`, `step2-search.png`, etc.

## Demo Entity Choices (Pre-tested)

| Entity | Type | Why |
|--------|------|-----|
| Apple (AAPL) | Stock | Well-known, good ESG data, clear HQ location |
| Tesla (TSLA) | Stock | Controversial ESG, interesting comparison |
| Bitcoin (BTC) | Crypto | Different asset class, high risk scores |

## Backup Entities

| Entity | Type | Why |
|--------|------|-----|
| Microsoft (MSFT) | Stock | Strong ESG, alternative to Apple |
| Ethereum (ETH) | Crypto | Alternative to Bitcoin |
| Shell (SHEL) | Stock | Oil company, low sustainability scores |
