import type { PanelRegistryEntry } from "../types/panel-config";

// ── Pinned panels (always visible, top row) ─────────────────────────────
const PINNED_PANELS: PanelRegistryEntry[] = [
  {
    id: "live-news",
    label: "Live News",
    category: "pinned",
    defaultEnabled: true,
    isPinned: true,
    hasLiveBadge: true,
    load: () =>
      import("@/features/live-news/components/live-news-panel").then((m) => ({
        default: m.LiveNewsPanel,
      })),
  },
  {
    id: "live-webcams",
    label: "Live Webcams",
    category: "pinned",
    defaultEnabled: true,
    isPinned: true,
    hasLiveBadge: true,
    load: () =>
      import("@/features/live-webcams/components/live-webcams-dashboard").then(
        (m) => ({ default: m.LiveWebcamsDashboard }),
      ),
  },
];

// ── Markets ──────────────────────────────────────────────────────────────
const MARKET_PANELS: PanelRegistryEntry[] = [
  {
    id: "markets",
    label: "Markets",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("@/features/market-feed/components/market-feed-section").then(
        (m) => ({ default: m.MarketFeedSection }),
      ),
  },
  {
    id: "premium-stock-analysis",
    label: "Premium Stock Analysis",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.PremiumStockPanel,
      })),
  },
  {
    id: "premium-backtesting",
    label: "Premium Backtesting",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.BacktestingPanel,
      })),
  },
  {
    id: "daily-market-brief",
    label: "Daily Market Brief",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/ai-panels").then((m) => ({
        default: m.DailyBriefPanel,
      })),
  },
  {
    id: "forex-currencies",
    label: "Forex & Currencies",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.ForexPanel,
      })),
  },
  {
    id: "fixed-income",
    label: "Fixed Income",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.FixedIncomePanel,
      })),
  },
  {
    id: "commodities",
    label: "Commodities",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.CommoditiesPanel,
      })),
  },
  {
    id: "ipo-spac",
    label: "IPO & SPAC",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    hasLiveBadge: true,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.IpoSpacPanel,
      })),
  },
  {
    id: "sector-heatmap",
    label: "Sector Heatmap",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.SectorHeatmapPanel,
      })),
  },
  {
    id: "market-radar",
    label: "Market Radar",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.MarketRadarPanel,
      })),
  },
  {
    id: "derivatives-options",
    label: "Derivatives & Options",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    hasLiveBadge: true,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.DerivativesPanel,
      })),
  },
  {
    id: "hedge-funds-pe",
    label: "Hedge Funds & PE",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    hasLiveBadge: true,
    load: () =>
      import("../components/market-panels").then((m) => ({
        default: m.HedgeFundsPanel,
      })),
  },
  {
    id: "market-analysis",
    label: "Market Analysis",
    category: "markets",
    defaultEnabled: true,
    isPinned: false,
    hasLiveBadge: true,
    load: () =>
      import("../components/ai-panels").then((m) => ({
        default: m.MarketAnalysisPanel,
      })),
  },
];

// ── Crypto ────────────────────────────────────────────────────────────────
const CRYPTO_PANELS: PanelRegistryEntry[] = [
  {
    id: "crypto",
    label: "Crypto",
    category: "crypto",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("@/features/crypto-feed/components/crypto-feed-section").then(
        (m) => ({ default: m.CryptoFeedSection }),
      ),
  },
  {
    id: "crypto-news",
    label: "Crypto News",
    category: "crypto",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/crypto-panels").then((m) => ({
        default: m.CryptoNewsPanel,
      })),
  },
  {
    id: "btc-etf-tracker",
    label: "BTC ETF Tracker",
    category: "crypto",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/crypto-panels").then((m) => ({
        default: m.BtcEtfPanel,
      })),
  },
  {
    id: "stablecoins",
    label: "Stablecoins",
    category: "crypto",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/crypto-panels").then((m) => ({
        default: m.StablecoinsPanel,
      })),
  },
];

// ── Macro / Economics ────────────────────────────────────────────────────
const MACRO_PANELS: PanelRegistryEntry[] = [
  {
    id: "central-bank-watch",
    label: "Central Bank Watch",
    category: "macro",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/macro-panels").then((m) => ({
        default: m.CentralBankPanel,
      })),
  },
  {
    id: "economic-indicators",
    label: "Economic Indicators",
    category: "macro",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/macro-panels").then((m) => ({
        default: m.EconomicIndicatorsPanel,
      })),
  },
  {
    id: "trade-policy",
    label: "Trade Policy",
    category: "macro",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/macro-panels").then((m) => ({
        default: m.TradePolicyPanel,
      })),
  },
  {
    id: "supply-chain",
    label: "Supply Chain",
    category: "macro",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/macro-panels").then((m) => ({
        default: m.SupplyChainPanel,
      })),
  },
];

// ── News ─────────────────────────────────────────────────────────────────
const NEWS_PANELS: PanelRegistryEntry[] = [
  {
    id: "markets-news",
    label: "Markets News",
    category: "news",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("@/features/news-feed/components/news-feed-section").then((m) => ({
        default: m.NewsFeedSection,
      })),
  },
  {
    id: "commodities-news",
    label: "Commodities News",
    category: "news",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/news-panels").then((m) => ({
        default: m.CommoditiesNewsPanel,
      })),
  },
  {
    id: "economic-news",
    label: "Economic News",
    category: "news",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/news-panels").then((m) => ({
        default: m.EconomicNewsPanel,
      })),
  },
];

// ── Intelligence ─────────────────────────────────────────────────────────
const INTELLIGENCE_PANELS: PanelRegistryEntry[] = [
  {
    id: "global-situation",
    label: "Global Situation",
    category: "intelligence",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/ai-panels").then((m) => ({
        default: m.GlobalSituationPanel,
      })),
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    category: "intelligence",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/ai-panels").then((m) => ({
        default: m.AIInsightsPanel,
      })),
  },
  {
    id: "fintech-trading-tech",
    label: "Fintech & Trading Tech",
    category: "intelligence",
    defaultEnabled: true,
    isPinned: false,
    hasLiveBadge: true,
    load: () =>
      import("../components/intelligence-panels").then((m) => ({
        default: m.FintechPanel,
      })),
  },
  {
    id: "ai-regulation",
    label: "AI Regulation Dashboard",
    category: "intelligence",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/ai-panels").then((m) => ({
        default: m.AIRegulationPanel,
      })),
  },
  {
    id: "predictions",
    label: "Predictions",
    category: "intelligence",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/ai-panels").then((m) => ({
        default: m.PredictionsPanel,
      })),
  },
  {
    id: "airline-intelligence",
    label: "Airline Intelligence",
    category: "intelligence",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/intelligence-panels").then((m) => ({
        default: m.AirlineIntelPanel,
      })),
  },
];

// ── Regional ─────────────────────────────────────────────────────────────
const REGIONAL_PANELS: PanelRegistryEntry[] = [
  {
    id: "gcc-investments",
    label: "GCC Investments",
    category: "regional",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/regional-panels").then((m) => ({
        default: m.GccInvestmentsPanel,
      })),
  },
  {
    id: "gcc-business-news",
    label: "GCC Business News",
    category: "regional",
    defaultEnabled: true,
    isPinned: false,
    hasLiveBadge: true,
    load: () =>
      import("../components/regional-panels").then((m) => ({
        default: m.GccBusinessNewsPanel,
      })),
  },
  {
    id: "gulf-economies",
    label: "Gulf Economies",
    category: "regional",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/regional-panels").then((m) => ({
        default: m.GulfEconomiesPanel,
      })),
  },
];

// ── Tools ────────────────────────────────────────────────────────────────
const TOOL_PANELS: PanelRegistryEntry[] = [
  {
    id: "entity-console",
    label: "Entity Console",
    category: "tools",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/entity-console-panel").then((m) => ({
        default: m.default,
      })),
  },

  {
    id: "world-clock",
    label: "World Clock",
    category: "tools",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/world-clock-panel").then((m) => ({
        default: m.default,
      })),
  },
  {
    id: "my-monitors",
    label: "My Monitors",
    category: "tools",
    defaultEnabled: true,
    isPinned: false,
    load: () =>
      import("../components/my-monitors-panel").then((m) => ({
        default: m.default,
      })),
  },
];

// ── Full registry (order determines render order) ────────────────────────
export const PANEL_REGISTRY: PanelRegistryEntry[] = [
  ...PINNED_PANELS,
  ...INTELLIGENCE_PANELS,
  ...MARKET_PANELS,
  ...CRYPTO_PANELS,
  ...MACRO_PANELS,
  ...NEWS_PANELS,
  ...REGIONAL_PANELS,
  ...TOOL_PANELS,
];

export const PINNED_PANEL_IDS = new Set(
  PINNED_PANELS.map((p) => p.id),
);

export const PANEL_CATEGORIES = [
  { key: "intelligence" as const, label: "Intelligence" },
  { key: "markets" as const, label: "Markets" },
  { key: "crypto" as const, label: "Crypto" },
  { key: "macro" as const, label: "Macro & Economics" },
  { key: "news" as const, label: "News" },
  { key: "regional" as const, label: "Regional" },
  { key: "tools" as const, label: "Tools" },
] as const;
