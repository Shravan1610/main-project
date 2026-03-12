"""Gemini-powered intelligence panels for the World Monitor dashboard.

Uses Gemini 3 Flash with Google Search grounding so every panel
returns data backed by live web results.
"""

from __future__ import annotations

import logging

from src.shared.clients import call_gemini_grounded

logger = logging.getLogger(__name__)


# ── Panel-specific generators ─────────────────────────────────────────────


async def generate_ai_insights() -> dict:
    """AI Insights panel — key trends and signals across markets."""
    prompt = "\n".join([
        "You are a senior financial intelligence analyst for a real-time terminal dashboard.",
        "Generate 5 current AI-driven insights about global markets, technology, and geopolitics for today.",
        "Return ONLY valid JSON with this shape:",
        '{"insights": [{"title": "string (max 60 chars)", "body": "string (max 200 chars)", "category": "string", "sentiment": "bullish"|"bearish"|"neutral", "confidence": number 0-1}]}',
        "Categories: markets, tech, geopolitics, crypto, macro.",
        "Be specific with numbers, names, and events. Sound like Bloomberg Terminal alerts.",
    ])
    result = await call_gemini_grounded(prompt)
    if not result or "insights" not in result:
        return {"insights": [], "source": "unavailable"}
    return {**result, "source": "gemini"}


async def generate_global_situation() -> dict:
    """Global Situation panel — real-time geopolitical and macro overview."""
    prompt = "\n".join([
        "You are a geopolitical risk analyst for a financial intelligence terminal.",
        "Generate a concise global situation briefing covering the most critical ongoing events.",
        "Return ONLY valid JSON with this shape:",
        '{"threat_level": "low"|"elevated"|"high"|"critical",',
        '"summary": "string (max 150 chars)",',
        '"regions": [{"name": "string", "status": "stable"|"watch"|"alert"|"crisis", "headline": "string (max 100 chars)"}],',
        '"top_risks": [{"risk": "string (max 80 chars)", "probability": "low"|"medium"|"high", "impact": "low"|"medium"|"high"}]}',
        "Include 4-6 regions and 3-5 risks. Be specific about current events.",
    ])
    result = await call_gemini_grounded(prompt)
    if not result or "threat_level" not in result:
        return {"threat_level": "unknown", "summary": "Data unavailable", "regions": [], "top_risks": [], "source": "unavailable"}
    return {**result, "source": "gemini"}


async def generate_market_analysis() -> dict:
    """Market Analysis panel — AI-driven market outlook."""
    prompt = "\n".join([
        "You are a quantitative market strategist for a Bloomberg-style terminal.",
        "Generate a current market analysis covering equities, bonds, forex, and commodities.",
        "Return ONLY valid JSON with this shape:",
        '{"outlook": "risk-on"|"risk-off"|"mixed",',
        '"summary": "string (max 200 chars)",',
        '"sectors": [{"name": "string", "signal": "buy"|"sell"|"hold", "reason": "string (max 80 chars)"}],',
        '"key_levels": [{"asset": "string", "level": "string", "significance": "string (max 60 chars)"}]}',
        "Include 4-6 sectors and 3-5 key levels. Use real asset names and plausible levels.",
    ])
    result = await call_gemini_grounded(prompt)
    if not result or "outlook" not in result:
        return {"outlook": "unknown", "summary": "Data unavailable", "sectors": [], "key_levels": [], "source": "unavailable"}
    return {**result, "source": "gemini"}


async def generate_predictions() -> dict:
    """Predictions panel — AI probability estimates for upcoming events."""
    prompt = "\n".join([
        "You are a prediction market analyst for a financial terminal.",
        "Generate 5-7 predictions about upcoming market, political, or technology events.",
        "Return ONLY valid JSON with this shape:",
        '{"predictions": [{"event": "string (max 100 chars)", "probability": number 0-100, "timeframe": "string (e.g. Q2 2026)", "category": "markets"|"politics"|"tech"|"crypto"|"macro"}]}',
        "Be specific with dates, names, numbers. Include a mix of high and low probability events.",
    ])
    result = await call_gemini_grounded(prompt)
    if not result or "predictions" not in result:
        return {"predictions": [], "source": "unavailable"}
    return {**result, "source": "gemini"}


async def generate_daily_brief() -> dict:
    """Daily Market Brief panel — morning briefing for traders."""
    prompt = "\n".join([
        "You are a senior market strategist writing a morning brief for institutional traders.",
        "Generate today's daily market brief.",
        "Return ONLY valid JSON with this shape:",
        '{"date": "string (YYYY-MM-DD)", "headline": "string (max 80 chars)",',
        '"summary": "string (max 300 chars)",',
        '"bullets": ["string (max 100 chars each, 5-7 items)"],',
        '"watchlist": [{"ticker": "string", "reason": "string (max 60 chars)"}]}',
        "Include 5-7 bullets and 3-5 watchlist items. Sound authoritative and data-driven.",
    ])
    result = await call_gemini_grounded(prompt)
    if not result or "headline" not in result:
        return {"date": "", "headline": "Brief unavailable", "summary": "", "bullets": [], "watchlist": [], "source": "unavailable"}
    return {**result, "source": "gemini"}


async def generate_ai_regulation() -> dict:
    """AI Regulation Dashboard — latest AI policy and regulation updates."""
    prompt = "\n".join([
        "You are an AI policy analyst tracking global AI regulation for a finance terminal.",
        "Generate a current AI regulation dashboard.",
        "Return ONLY valid JSON with this shape:",
        '{"status": "tightening"|"stable"|"loosening",',
        '"summary": "string (max 150 chars)",',
        '"updates": [{"jurisdiction": "string", "action": "string (max 100 chars)", "impact": "low"|"medium"|"high", "date": "string"}],',
        '"watchlist": ["string (max 80 chars each)"]}',
        "Include 4-6 updates and 3-5 watchlist items. Cover US, EU, UK, China, and other key jurisdictions.",
    ])
    result = await call_gemini_grounded(prompt)
    if not result or "status" not in result:
        return {"status": "unknown", "summary": "Data unavailable", "updates": [], "watchlist": [], "source": "unavailable"}
    return {**result, "source": "gemini"}


# ── Generic panel data generator ──────────────────────────────────────────

_PANEL_PROMPTS: dict[str, tuple[str, str, dict]] = {
    "premium-stock-analysis": (
        "You are a senior equity analyst for a Bloomberg-style terminal. "
        "Generate 5-6 current high-conviction stock picks with analysis.",
        '{"stocks": [{"ticker": "string", "name": "string", "price": "string", "target": "string", "rating": "strong-buy"|"buy"|"hold"|"sell", "thesis": "string (max 80 chars)", "sector": "string"}]}',
        {"stocks": []},
    ),
    "premium-backtesting": (
        "You are a quantitative strategist. Generate results for 4-5 trading strategies "
        "that have been backtested over the past 12 months.",
        '{"strategies": [{"name": "string", "return_pct": number, "sharpe": number, "max_drawdown_pct": number, "win_rate_pct": number, "trades": number, "status": "active"|"paused"|"review"}]}',
        {"strategies": []},
    ),
    "forex-currencies": (
        "You are a senior FX strategist. Generate current data for 6-8 major and minor currency pairs.",
        '{"pairs": [{"pair": "string (e.g. EUR/USD)", "rate": "string", "change_pct": number, "trend": "up"|"down"|"flat", "note": "string (max 60 chars)"}], "dxy_index": "string", "dxy_change": "string"}',
        {"pairs": [], "dxy_index": "--", "dxy_change": "--"},
    ),
    "fixed-income": (
        "You are a fixed income strategist. Generate current bond yield data and credit market conditions.",
        '{"yields": [{"instrument": "string", "yield_pct": "string", "change_bps": number, "trend": "up"|"down"|"flat"}], "spread_summary": "string (max 120 chars)", "outlook": "tightening"|"easing"|"neutral"}',
        {"yields": [], "spread_summary": "Data unavailable", "outlook": "neutral"},
    ),
    "commodities": (
        "You are a commodities analyst. Generate current prices and outlook for 6-8 key commodities.",
        '{"commodities": [{"name": "string", "price": "string", "unit": "string", "change_pct": number, "trend": "up"|"down"|"flat", "driver": "string (max 60 chars)"}], "summary": "string (max 120 chars)"}',
        {"commodities": [], "summary": "Data unavailable"},
    ),
    "ipo-spac": (
        "You are an IPO/SPAC analyst. Generate data on 3-4 upcoming IPOs and 2-3 recent SPAC deals.",
        '{"upcoming_ipos": [{"company": "string", "ticker": "string", "expected_date": "string", "valuation": "string", "sector": "string"}], "recent_spacs": [{"name": "string", "target": "string", "status": "announced"|"voted"|"completed", "deal_size": "string"}], "pipeline_summary": "string (max 120 chars)"}',
        {"upcoming_ipos": [], "recent_spacs": [], "pipeline_summary": "Data unavailable"},
    ),
    "sector-heatmap": (
        "You are a sector rotation analyst. Generate performance data for 11 GICS sectors.",
        '{"sectors": [{"name": "string", "change_1d_pct": number, "change_1w_pct": number, "change_1m_pct": number, "signal": "hot"|"warm"|"neutral"|"cool"|"cold"}], "rotation_note": "string (max 120 chars)"}',
        {"sectors": [], "rotation_note": "Data unavailable"},
    ),
    "market-radar": (
        "You are a market surveillance analyst. Generate 5-7 unusual market activity alerts.",
        '{"alerts": [{"type": "volume-spike"|"breakout"|"breakdown"|"unusual-options"|"insider"|"gap", "asset": "string", "detail": "string (max 100 chars)", "severity": "low"|"medium"|"high", "time": "string"}]}',
        {"alerts": []},
    ),
    "derivatives-options": (
        "You are a derivatives strategist. Generate notable options flow and market data.",
        '{"put_call_ratio": "string", "vix": "string", "vix_change": "string", "notable_flows": [{"asset": "string", "type": "call"|"put", "strike": "string", "expiry": "string", "premium": "string", "sentiment": "bullish"|"bearish"|"hedge"}], "summary": "string (max 120 chars)"}',
        {"put_call_ratio": "--", "vix": "--", "vix_change": "--", "notable_flows": [], "summary": "Data unavailable"},
    ),
    "hedge-funds-pe": (
        "You are an alternatives analyst. Generate 4-5 recent hedge fund and PE developments.",
        '{"developments": [{"firm": "string", "type": "new-fund"|"deal"|"exit"|"performance"|"strategy-shift", "headline": "string (max 100 chars)", "size": "string", "impact": "low"|"medium"|"high"}], "aum_trend": "string (max 80 chars)"}',
        {"developments": [], "aum_trend": "Data unavailable"},
    ),
    "crypto-news": (
        "You are a crypto journalist for a terminal. Generate 5-6 current crypto news items.",
        '{"articles": [{"title": "string (max 80 chars)", "summary": "string (max 120 chars)", "category": "defi"|"regulation"|"exchange"|"nft"|"layer1"|"layer2"|"stablecoin", "sentiment": "bullish"|"bearish"|"neutral", "time_ago": "string"}]}',
        {"articles": []},
    ),
    "btc-etf-tracker": (
        "You are a crypto ETF analyst. Generate current BTC ETF data for 5-6 major spot Bitcoin ETFs.",
        '{"etfs": [{"name": "string", "ticker": "string", "price": "string", "aum": "string", "flow_1d": "string", "flow_direction": "inflow"|"outflow"|"flat"}], "total_btc_held": "string", "net_flow_summary": "string (max 100 chars)"}',
        {"etfs": [], "total_btc_held": "--", "net_flow_summary": "Data unavailable"},
    ),
    "stablecoins": (
        "You are a stablecoin analyst. Generate data for 5-6 major stablecoins.",
        '{"stablecoins": [{"name": "string", "ticker": "string", "peg": "string", "market_cap": "string", "volume_24h": "string", "deviation_bps": number, "status": "stable"|"minor-depeg"|"major-depeg"}], "total_market_cap": "string"}',
        {"stablecoins": [], "total_market_cap": "--"},
    ),
    "central-bank-watch": (
        "You are a central bank policy analyst. Generate current data for 5-6 major central banks.",
        '{"banks": [{"name": "string", "rate_pct": "string", "last_action": "hike"|"cut"|"hold", "next_meeting": "string", "bias": "hawkish"|"dovish"|"neutral", "note": "string (max 60 chars)"}], "global_bias": "hawkish"|"dovish"|"mixed"}',
        {"banks": [], "global_bias": "mixed"},
    ),
    "economic-indicators": (
        "You are a macro economist. Generate latest readings for 6-8 key economic indicators.",
        '{"indicators": [{"name": "string", "value": "string", "previous": "string", "change": "string", "trend": "improving"|"deteriorating"|"stable", "country": "string"}], "outlook": "string (max 120 chars)"}',
        {"indicators": [], "outlook": "Data unavailable"},
    ),
    "trade-policy": (
        "You are a trade policy analyst. Generate 4-5 current trade policy developments.",
        '{"developments": [{"headline": "string (max 100 chars)", "parties": "string", "type": "tariff"|"agreement"|"sanction"|"dispute"|"subsidy", "impact": "low"|"medium"|"high", "status": "active"|"proposed"|"resolved"}], "risk_level": "low"|"elevated"|"high", "summary": "string (max 120 chars)"}',
        {"developments": [], "risk_level": "low", "summary": "Data unavailable"},
    ),
    "supply-chain": (
        "You are a supply chain intelligence analyst. Generate 4-6 current supply chain alerts.",
        '{"alerts": [{"region": "string", "sector": "string", "issue": "string (max 100 chars)", "severity": "low"|"medium"|"high"|"critical", "trend": "improving"|"worsening"|"stable"}], "global_stress_index": "low"|"moderate"|"elevated"|"high", "shipping_note": "string (max 100 chars)"}',
        {"alerts": [], "global_stress_index": "moderate", "shipping_note": "Data unavailable"},
    ),
    "commodities-news": (
        "You are a commodities news journalist. Generate 5-6 current commodities news items.",
        '{"articles": [{"title": "string (max 80 chars)", "summary": "string (max 120 chars)", "commodity": "string", "impact": "bullish"|"bearish"|"neutral", "time_ago": "string"}]}',
        {"articles": []},
    ),
    "economic-news": (
        "You are an economic news journalist. Generate 5-6 current economic and policy news items.",
        '{"articles": [{"title": "string (max 80 chars)", "summary": "string (max 120 chars)", "region": "string", "category": "fiscal"|"monetary"|"employment"|"trade"|"housing"|"inflation", "time_ago": "string"}]}',
        {"articles": []},
    ),
    "fintech-trading-tech": (
        "You are a fintech analyst. Generate 4-5 current fintech and trading technology developments.",
        '{"developments": [{"company": "string", "headline": "string (max 100 chars)", "category": "ai-trading"|"defi"|"neobank"|"payments"|"regtech"|"infrastructure", "impact": "low"|"medium"|"high", "stage": "launch"|"funding"|"partnership"|"acquisition"}], "trend_note": "string (max 120 chars)"}',
        {"developments": [], "trend_note": "Data unavailable"},
    ),
    "airline-intelligence": (
        "You are an airline and aviation industry analyst. Generate current airline sector intelligence.",
        '{"airlines": [{"name": "string", "ticker": "string", "load_factor_pct": number, "revenue_trend": "up"|"down"|"flat", "note": "string (max 60 chars)"}], "fuel_price": "string", "fuel_trend": "up"|"down"|"flat", "sector_outlook": "string (max 120 chars)"}',
        {"airlines": [], "fuel_price": "--", "fuel_trend": "flat", "sector_outlook": "Data unavailable"},
    ),
    "gcc-investments": (
        "You are a GCC sovereign wealth and investment analyst. Generate 4-5 recent GCC investment developments.",
        '{"investments": [{"entity": "string", "target": "string", "type": "acquisition"|"stake"|"fund"|"real-estate"|"infrastructure", "value": "string", "sector": "string"}], "total_swf_aum": "string", "trend_note": "string (max 120 chars)"}',
        {"investments": [], "total_swf_aum": "--", "trend_note": "Data unavailable"},
    ),
    "gcc-business-news": (
        "You are a Gulf business journalist. Generate 5-6 current GCC business news items.",
        '{"articles": [{"title": "string (max 80 chars)", "summary": "string (max 120 chars)", "country": "string", "sector": "string", "time_ago": "string"}]}',
        {"articles": []},
    ),
    "gulf-economies": (
        "You are a Gulf economies analyst. Generate current economic data for 6 GCC countries.",
        '{"countries": [{"name": "string", "gdp_growth_pct": "string", "oil_dependency_pct": number, "diversification_score": number, "key_project": "string (max 60 chars)", "outlook": "positive"|"stable"|"negative"}], "region_summary": "string (max 120 chars)"}',
        {"countries": [], "region_summary": "Data unavailable"},
    ),
}


async def generate_panel_data(panel_id: str) -> dict:
    """Generic panel data generator — dispatches to panel-specific prompts."""
    config = _PANEL_PROMPTS.get(panel_id)
    if not config:
        return {"error": f"Unknown panel: {panel_id}", "source": "unavailable"}

    role_prompt, json_shape, fallback = config
    prompt = "\n".join([
        role_prompt,
        f"Today is {__import__('datetime').date.today().isoformat()}.",
        "Return ONLY valid JSON with this exact shape:",
        json_shape,
        "Be specific with real-world current data, names, and numbers. Sound like a Bloomberg Terminal.",
    ])
    result = await call_gemini_grounded(prompt, temperature=0.4)
    if not result:
        return {**fallback, "source": "unavailable"}
    return {**result, "source": "gemini"}
