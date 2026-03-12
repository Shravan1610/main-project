import { MacWindow } from "@/shared/components/mac-window";

function StubContent({ title, category }: { title: string; category: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-8">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-terminal-border bg-terminal-bg/60">
        <span className="text-lg text-terminal-text-muted">◈</span>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-terminal-text-dim">
          {title}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-terminal-text-muted">
          {category} &middot; Coming Soon
        </p>
      </div>
      <div className="mt-2 h-px w-16 bg-terminal-border/50" />
      <p className="max-w-50 text-center text-[10px] leading-relaxed text-terminal-text-muted">
        This module is being integrated. Data feeds will appear here once connected.
      </p>
    </div>
  );
}

export default function GlobalSituationPanel() {
  return (
    <MacWindow title="Global Situation">
      <StubContent title="Global Situation" category="Intelligence" />
    </MacWindow>
  );
}

export function AIInsightsPanel() {
  return (
    <MacWindow title="Insights">
      <StubContent title="Insights" category="Intelligence" />
    </MacWindow>
  );
}

export function PremiumStockPanel() {
  return (
    <MacWindow title="Premium Stock Analysis">
      <StubContent title="Premium Stock Analysis" category="Markets" />
    </MacWindow>
  );
}

export function BacktestingPanel() {
  return (
    <MacWindow title="Premium Backtesting">
      <StubContent title="Premium Backtesting" category="Markets" />
    </MacWindow>
  );
}

export function DailyBriefPanel() {
  return (
    <MacWindow title="Daily Market Brief">
      <StubContent title="Daily Market Brief" category="Markets" />
    </MacWindow>
  );
}

export function ForexPanel() {
  return (
    <MacWindow title="Forex &amp; Currencies">
      <StubContent title="Forex & Currencies" category="Markets" />
    </MacWindow>
  );
}

export function FixedIncomePanel() {
  return (
    <MacWindow title="Fixed Income">
      <StubContent title="Fixed Income" category="Markets" />
    </MacWindow>
  );
}

export function CommoditiesPanel() {
  return (
    <MacWindow title="Commodities">
      <StubContent title="Commodities" category="Markets" />
    </MacWindow>
  );
}

export function CommoditiesNewsPanel() {
  return (
    <MacWindow title="Commodities News">
      <StubContent title="Commodities News" category="News" />
    </MacWindow>
  );
}

export function CryptoNewsPanel() {
  return (
    <MacWindow title="Crypto News">
      <StubContent title="Crypto News" category="Crypto" />
    </MacWindow>
  );
}

export function CentralBankPanel() {
  return (
    <MacWindow title="Central Bank Watch">
      <StubContent title="Central Bank Watch" category="Macro" />
    </MacWindow>
  );
}

export function EconomicIndicatorsPanel() {
  return (
    <MacWindow title="Economic Indicators">
      <StubContent title="Economic Indicators" category="Macro" />
    </MacWindow>
  );
}

export function TradePolicyPanel() {
  return (
    <MacWindow title="Trade Policy">
      <StubContent title="Trade Policy" category="Macro" />
    </MacWindow>
  );
}

export function SupplyChainPanel() {
  return (
    <MacWindow title="Supply Chain">
      <StubContent title="Supply Chain" category="Macro" />
    </MacWindow>
  );
}

export function EconomicNewsPanel() {
  return (
    <MacWindow title="Economic News">
      <StubContent title="Economic News" category="News" />
    </MacWindow>
  );
}

export function IpoSpacPanel() {
  return (
    <MacWindow title="IPO &amp; SPAC">
      <StubContent title="IPO & SPAC" category="Markets" />
    </MacWindow>
  );
}

export function SectorHeatmapPanel() {
  return (
    <MacWindow title="Sector Heatmap">
      <StubContent title="Sector Heatmap" category="Markets" />
    </MacWindow>
  );
}

export function MarketRadarPanel() {
  return (
    <MacWindow title="Market Radar">
      <StubContent title="Market Radar" category="Markets" />
    </MacWindow>
  );
}

export function DerivativesPanel() {
  return (
    <MacWindow title="Derivatives &amp; Options">
      <StubContent title="Derivatives & Options" category="Markets" />
    </MacWindow>
  );
}

export function FintechPanel() {
  return (
    <MacWindow title="Fintech &amp; Trading Tech">
      <StubContent title="Fintech & Trading Tech" category="Intelligence" />
    </MacWindow>
  );
}

export function AIRegulationPanel() {
  return (
    <MacWindow title="Regulation Dashboard">
      <StubContent title="Regulation Dashboard" category="Intelligence" />
    </MacWindow>
  );
}

export function HedgeFundsPanel() {
  return (
    <MacWindow title="Hedge Funds &amp; PE">
      <StubContent title="Hedge Funds & PE" category="Markets" />
    </MacWindow>
  );
}

export function MarketAnalysisPanel() {
  return (
    <MacWindow title="Market Analysis">
      <StubContent title="Market Analysis" category="Markets" />
    </MacWindow>
  );
}

export function BtcEtfPanel() {
  return (
    <MacWindow title="BTC ETF Tracker">
      <StubContent title="BTC ETF Tracker" category="Crypto" />
    </MacWindow>
  );
}

export function StablecoinsPanel() {
  return (
    <MacWindow title="Stablecoins">
      <StubContent title="Stablecoins" category="Crypto" />
    </MacWindow>
  );
}

export function GccInvestmentsPanel() {
  return (
    <MacWindow title="GCC Investments">
      <StubContent title="GCC Investments" category="Regional" />
    </MacWindow>
  );
}

export function GccBusinessNewsPanel() {
  return (
    <MacWindow title="GCC Business News">
      <StubContent title="GCC Business News" category="Regional" />
    </MacWindow>
  );
}

export function GulfEconomiesPanel() {
  return (
    <MacWindow title="Gulf Economies">
      <StubContent title="Gulf Economies" category="Regional" />
    </MacWindow>
  );
}

export function PredictionsPanel() {
  return (
    <MacWindow title="Predictions">
      <StubContent title="Predictions" category="Intelligence" />
    </MacWindow>
  );
}

export function AirlineIntelPanel() {
  return (
    <MacWindow title="Airline Intelligence">
      <StubContent title="Airline Intelligence" category="Intelligence" />
    </MacWindow>
  );
}

export function WorldClockPanel() {
  return (
    <MacWindow title="World Clock">
      <StubContent title="World Clock" category="Tools" />
    </MacWindow>
  );
}

export function MyMonitorsPanel() {
  return (
    <MacWindow title="My Monitors">
      <StubContent title="My Monitors" category="Tools" />
    </MacWindow>
  );
}
