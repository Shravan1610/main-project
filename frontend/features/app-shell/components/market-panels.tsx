"use client";

import { MacWindow } from "@/shared/components/mac-window";
import { useFetchPanel, PanelLoader, PanelError, Badge, TrendArrow, ChangePct, SectionHeader, Row } from "./panel-helpers";

/* ── Premium Stock Analysis ─────────────────────────────────────────── */

type StockAnalysisData = {
  stocks: Array<{ ticker: string; name: string; price: string; target: string; rating: string; thesis: string; sector: string }>;
};

export function PremiumStockPanel() {
  const { data, loading, error, refetch } = useFetchPanel<StockAnalysisData>("/ai/panel/premium-stock-analysis");
  return (
    <MacWindow title="Premium Stock Analysis" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data?.stocks?.length ? (
          <div className="space-y-2">
            {data.stocks.map((s, i) => (
              <Row key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-terminal-cyan">{s.ticker}</span>
                    <span className="truncate text-[10px] text-terminal-text-dim">{s.name}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-terminal-text-muted">{s.thesis}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-terminal-text">{s.price}</span>
                    <span className="text-[9px] text-terminal-text-muted">→</span>
                    <span className="text-[10px] font-mono text-terminal-green">{s.target}</span>
                  </div>
                  <Badge value={s.rating} />
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="py-6 text-center text-[10px] text-terminal-text-muted">No data</p>}
      </div>
    </MacWindow>
  );
}

/* ── Premium Backtesting ────────────────────────────────────────────── */

type BacktestingData = {
  strategies: Array<{ name: string; return_pct: number; sharpe: number; max_drawdown_pct: number; win_rate_pct: number; trades: number; status: string }>;
};

export function BacktestingPanel() {
  const { data, loading, error, refetch } = useFetchPanel<BacktestingData>("/ai/panel/premium-backtesting");
  return (
    <MacWindow title="Premium Backtesting" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data?.strategies?.length ? (
          <div className="space-y-2">
            {data.strategies.map((s, i) => (
              <Row key={i}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-terminal-text">{s.name}</span>
                  <Badge value={s.status} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-[8px] uppercase text-terminal-text-muted">Return</p>
                    <p className={`text-[11px] font-mono ${s.return_pct >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>{s.return_pct > 0 ? "+" : ""}{s.return_pct}%</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-terminal-text-muted">Sharpe</p>
                    <p className="text-[11px] font-mono text-terminal-text">{s.sharpe}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-terminal-text-muted">Max DD</p>
                    <p className="text-[11px] font-mono text-terminal-red">-{Math.abs(s.max_drawdown_pct)}%</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-terminal-text-muted">Win Rate</p>
                    <p className="text-[11px] font-mono text-terminal-text">{s.win_rate_pct}%</p>
                  </div>
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="py-6 text-center text-[10px] text-terminal-text-muted">No data</p>}
      </div>
    </MacWindow>
  );
}

/* ── Forex & Currencies ─────────────────────────────────────────────── */

type ForexData = {
  pairs: Array<{ pair: string; rate: string; change_pct: number; trend: string; note: string }>;
  dxy_index: string;
  dxy_change: string;
};

export function ForexPanel() {
  const { data, loading, error, refetch } = useFetchPanel<ForexData>("/ai/panel/forex-currencies");
  return (
    <MacWindow title="Forex & Currencies" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded border border-terminal-border/40 bg-terminal-bg/50 px-3 py-2">
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">DXY</span>
              <span className="text-xs font-mono font-bold text-terminal-text">{data.dxy_index}</span>
              <span className="text-[10px] font-mono text-terminal-text-dim">{data.dxy_change}</span>
            </div>
            {data.pairs?.length ? (
              <div className="space-y-1.5">
                {data.pairs.map((p, i) => (
                  <Row key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendArrow trend={p.trend} />
                      <span className="text-[10px] font-mono font-medium text-terminal-cyan">{p.pair}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-terminal-text">{p.rate}</span>
                      <ChangePct value={p.change_pct} />
                    </div>
                  </Row>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

/* ── Fixed Income ───────────────────────────────────────────────────── */

type FixedIncomeData = {
  yields: Array<{ instrument: string; yield_pct: string; change_bps: number; trend: string }>;
  spread_summary: string;
  outlook: string;
};

export function FixedIncomePanel() {
  const { data, loading, error, refetch } = useFetchPanel<FixedIncomeData>("/ai/panel/fixed-income");
  return (
    <MacWindow title="Fixed Income" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge value={data.outlook} />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">credit outlook</span>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.spread_summary}</p>
            {data.yields?.length ? (
              <div className="space-y-1.5">
                {data.yields.map((y, i) => (
                  <Row key={i} className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-terminal-text">{y.instrument}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-terminal-cyan">{y.yield_pct}%</span>
                      <span className={`text-[10px] font-mono ${y.change_bps >= 0 ? "text-terminal-red" : "text-terminal-green"}`}>{y.change_bps > 0 ? "+" : ""}{y.change_bps}bp</span>
                      <TrendArrow trend={y.trend} />
                    </div>
                  </Row>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

/* ── Commodities ────────────────────────────────────────────────────── */

type CommoditiesData = {
  commodities: Array<{ name: string; price: string; unit: string; change_pct: number; trend: string; driver: string }>;
  summary: string;
};

export function CommoditiesPanel() {
  const { data, loading, error, refetch } = useFetchPanel<CommoditiesData>("/ai/panel/commodities");
  return (
    <MacWindow title="Commodities" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.summary}</p>
            {data.commodities?.length ? (
              <div className="space-y-1.5">
                {data.commodities.map((c, i) => (
                  <Row key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendArrow trend={c.trend} />
                      <span className="text-[10px] font-medium text-terminal-text">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-terminal-text">{c.price}<span className="text-terminal-text-muted">/{c.unit}</span></span>
                      <ChangePct value={c.change_pct} />
                    </div>
                  </Row>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

/* ── IPO & SPAC ─────────────────────────────────────────────────────── */

type IpoSpacData = {
  upcoming_ipos: Array<{ company: string; ticker: string; expected_date: string; valuation: string; sector: string }>;
  recent_spacs: Array<{ name: string; target: string; status: string; deal_size: string }>;
  pipeline_summary: string;
};

export function IpoSpacPanel() {
  const { data, loading, error, refetch } = useFetchPanel<IpoSpacData>("/ai/panel/ipo-spac");
  return (
    <MacWindow title="IPO & SPAC" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.pipeline_summary}</p>
            {data.upcoming_ipos?.length ? (
              <div>
                <SectionHeader>Upcoming IPOs</SectionHeader>
                <div className="space-y-1.5">
                  {data.upcoming_ipos.map((ipo, i) => (
                    <Row key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-medium text-terminal-text">{ipo.company}</span>
                        <span className="ml-1.5 text-[9px] font-mono text-terminal-cyan">{ipo.ticker}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-terminal-text-muted">{ipo.expected_date}</span>
                        <span className="text-[9px] text-terminal-amber">{ipo.valuation}</span>
                      </div>
                    </Row>
                  ))}
                </div>
              </div>
            ) : null}
            {data.recent_spacs?.length ? (
              <div>
                <SectionHeader>Recent SPACs</SectionHeader>
                <div className="space-y-1.5">
                  {data.recent_spacs.map((s, i) => (
                    <Row key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-medium text-terminal-text">{s.name}</span>
                        <span className="ml-1.5 text-[9px] text-terminal-text-muted">→ {s.target}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge value={s.status} />
                        <span className="text-[9px] font-mono text-terminal-text">{s.deal_size}</span>
                      </div>
                    </Row>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

/* ── Sector Heatmap ─────────────────────────────────────────────────── */

type SectorHeatmapData = {
  sectors: Array<{ name: string; change_1d_pct: number; change_1w_pct: number; change_1m_pct: number; signal: string }>;
  rotation_note: string;
};

function heatColor(v: number) {
  if (v >= 2) return "bg-terminal-green/30 text-terminal-green";
  if (v > 0) return "bg-terminal-green/15 text-terminal-green";
  if (v === 0) return "bg-terminal-bg/40 text-terminal-text-muted";
  if (v > -2) return "bg-terminal-red/15 text-terminal-red";
  return "bg-terminal-red/30 text-terminal-red";
}

export function SectorHeatmapPanel() {
  const { data, loading, error, refetch } = useFetchPanel<SectorHeatmapData>("/ai/panel/sector-heatmap");
  return (
    <MacWindow title="Sector Heatmap" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.rotation_note}</p>
            {data.sectors?.length ? (
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_60px_60px_60px_50px] gap-1 text-[8px] uppercase tracking-[0.14em] text-terminal-text-muted px-1">
                  <span>Sector</span><span className="text-right">1D</span><span className="text-right">1W</span><span className="text-right">1M</span><span className="text-right">Signal</span>
                </div>
                {data.sectors.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_60px_60px_50px] gap-1 items-center rounded border border-terminal-border/20 px-1 py-1">
                    <span className="truncate text-[10px] font-medium text-terminal-text">{s.name}</span>
                    <span className={`rounded px-1 py-0.5 text-right text-[9px] font-mono ${heatColor(s.change_1d_pct)}`}>{s.change_1d_pct > 0 ? "+" : ""}{s.change_1d_pct.toFixed(1)}%</span>
                    <span className={`rounded px-1 py-0.5 text-right text-[9px] font-mono ${heatColor(s.change_1w_pct)}`}>{s.change_1w_pct > 0 ? "+" : ""}{s.change_1w_pct.toFixed(1)}%</span>
                    <span className={`rounded px-1 py-0.5 text-right text-[9px] font-mono ${heatColor(s.change_1m_pct)}`}>{s.change_1m_pct > 0 ? "+" : ""}{s.change_1m_pct.toFixed(1)}%</span>
                    <span className="text-right"><Badge value={s.signal} /></span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

/* ── Market Radar ───────────────────────────────────────────────────── */

type MarketRadarData = {
  alerts: Array<{ type: string; asset: string; detail: string; severity: string; time: string }>;
};

const RADAR_ICON: Record<string, string> = {
  "volume-spike": "◆", breakout: "▲", breakdown: "▼", "unusual-options": "◈", insider: "●", gap: "◇",
};

export function MarketRadarPanel() {
  const { data, loading, error, refetch } = useFetchPanel<MarketRadarData>("/ai/panel/market-radar");
  return (
    <MacWindow title="Market Radar" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data?.alerts?.length ? (
          <div className="space-y-1.5">
            {data.alerts.map((a, i) => (
              <Row key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-[10px] text-terminal-amber">{RADAR_ICON[a.type] ?? "◈"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-terminal-cyan">{a.asset}</span>
                      <Badge value={a.severity} />
                    </div>
                    <span className="text-[9px] text-terminal-text-muted">{a.time}</span>
                  </div>
                  <p className="text-[10px] text-terminal-text-dim">{a.detail}</p>
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="py-6 text-center text-[10px] text-terminal-text-muted">No alerts</p>}
      </div>
    </MacWindow>
  );
}

/* ── Derivatives & Options ──────────────────────────────────────────── */

type DerivativesData = {
  put_call_ratio: string;
  vix: string;
  vix_change: string;
  notable_flows: Array<{ asset: string; type: string; strike: string; expiry: string; premium: string; sentiment: string }>;
  summary: string;
};

export function DerivativesPanel() {
  const { data, loading, error, refetch } = useFetchPanel<DerivativesData>("/ai/panel/derivatives-options");
  return (
    <MacWindow title="Derivatives & Options" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded border border-terminal-border/40 bg-terminal-bg/50 px-3 py-2">
              <div><p className="text-[8px] uppercase text-terminal-text-muted">VIX</p><p className="text-xs font-mono font-bold text-terminal-text">{data.vix}</p></div>
              <div><p className="text-[8px] uppercase text-terminal-text-muted">Chg</p><p className="text-xs font-mono text-terminal-text-dim">{data.vix_change}</p></div>
              <div><p className="text-[8px] uppercase text-terminal-text-muted">P/C</p><p className="text-xs font-mono text-terminal-text">{data.put_call_ratio}</p></div>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.summary}</p>
            {data.notable_flows?.length ? (
              <div>
                <SectionHeader>Notable Flow</SectionHeader>
                <div className="space-y-1.5">
                  {data.notable_flows.map((f, i) => (
                    <Row key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-terminal-cyan">{f.asset}</span>
                        <span className={`text-[9px] font-bold uppercase ${f.type === "call" ? "text-terminal-green" : "text-terminal-red"}`}>{f.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-terminal-text">{f.strike}</span>
                        <span className="text-[9px] text-terminal-text-muted">{f.expiry}</span>
                        <span className="text-[9px] font-mono text-terminal-amber">{f.premium}</span>
                        <Badge value={f.sentiment} />
                      </div>
                    </Row>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}

/* ── Hedge Funds & PE ───────────────────────────────────────────────── */

type HedgeFundsData = {
  developments: Array<{ firm: string; type: string; headline: string; size: string; impact: string }>;
  aum_trend: string;
};

export function HedgeFundsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<HedgeFundsData>("/ai/panel/hedge-funds-pe");
  return (
    <MacWindow title="Hedge Funds & PE" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.aum_trend}</p>
            {data.developments?.length ? (
              <div className="space-y-1.5">
                {data.developments.map((d, i) => (
                  <Row key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-terminal-text">{d.firm}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge value={d.impact} />
                        <span className="text-[9px] font-mono text-terminal-amber">{d.size}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-terminal-text-dim">{d.headline}</p>
                  </Row>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </MacWindow>
  );
}
