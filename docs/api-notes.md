# GreenTrust API Documentation

Base URL: `http://localhost:8000` (dev) or deployed Render URL (prod)

All responses follow schemas in `contracts/`.

---

## GET /health

Health check endpoint.

**Response:**
```json
{ "status": "ok", "timestamp": "2026-03-11T12:00:00Z" }
```

---

## GET /search?q={query}

Search for companies, stocks, or crypto by name or ticker.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | yes | Search query (company name, ticker, crypto symbol) |

**Response:** `contracts/search-response.json`

**Example:**
```
GET /search?q=apple
```
```json
{
  "query": "apple",
  "results": [
    {
      "id": "AAPL",
      "name": "Apple Inc.",
      "type": "stock",
      "ticker": "AAPL",
      "country": "US",
      "exchange": "NASDAQ",
      "coordinates": { "lat": 37.3349, "lng": -122.0090 }
    }
  ],
  "total": 1
}
```

---

## GET /analyze?entity={id}

Full analysis of a single entity including market data, news, climate, and scores.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| entity | string | yes | Entity ID (ticker or slug from search results) |

**Response:** `contracts/analyze-response.json`

**Example:**
```
GET /analyze?entity=AAPL
```
```json
{
  "id": "AAPL",
  "name": "Apple Inc.",
  "type": "stock",
  "ticker": "AAPL",
  "country": "US",
  "coordinates": { "lat": 37.3349, "lng": -122.0090 },
  "market": {
    "price": 178.50,
    "changePercent": 1.23,
    "currency": "USD",
    "exchange": "NASDAQ"
  },
  "news": [
    {
      "title": "Apple reports record Q4 earnings",
      "source": "Reuters",
      "publishedAt": "2026-03-10T08:00:00Z",
      "url": "https://example.com/article",
      "category": "opportunity"
    }
  ],
  "climate": {
    "summary": "Low climate exposure. No active severe weather events near headquarters.",
    "vulnerability": "low",
    "events": []
  },
  "scores": {
    "sustainability": 84,
    "financialRisk": 32,
    "longTermImpact": 79
  },
  "drivers": {
    "sustainability": [
      { "label": "Strong ESG governance rating", "impact": "positive" },
      { "label": "Renewable energy commitments", "impact": "positive" },
      { "label": "Supply chain concerns", "impact": "negative" }
    ],
    "financialRisk": [
      { "label": "Stable market position", "impact": "positive" },
      { "label": "Low climate exposure", "impact": "positive" }
    ],
    "longTermImpact": [
      { "label": "Strong innovation pipeline", "impact": "positive" },
      { "label": "Favorable regulatory environment", "impact": "positive" }
    ]
  }
}
```

---

## POST /compare

Compare up to 3 entities side by side.

**Body:**
```json
{
  "entities": ["AAPL", "TSLA", "BTC"]
}
```

Max 3 entities. Returns error `COMPARE_LIMIT_EXCEEDED` if more than 3.

**Response:** `contracts/compare-response.json`

---

## GET /feeds

Latest news, stock tickers, and crypto tickers for the homepage feeds.

**Response:** `contracts/feed-response.json`

---

## GET /layers

Map layer data: stock exchanges, climate events, geocoded news.

**Response:** `contracts/map-layers-response.json`

---

## Error Responses

All errors follow `contracts/error-response.json`:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Entity 'XYZ123' not found",
    "details": null
  }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|------------|-------------|
| NOT_FOUND | 404 | Entity or resource not found |
| INVALID_QUERY | 400 | Missing or invalid query parameter |
| EXTERNAL_API_ERROR | 502 | External API (market, news, climate) failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |
| VALIDATION_ERROR | 422 | Request body validation failed |
| ENTITY_NOT_RESOLVED | 404 | Could not resolve entity from query |
| COMPARE_LIMIT_EXCEEDED | 400 | More than 3 entities in compare request |
