"use client";

import { MacWindow } from "@/shared/components/mac-window";
import { useFetchPanel, PanelLoader, PanelError, Badge, TrendArrow, SectionHeader, Row } from "./panel-helpers";

/* ── Central Bank Watch ─────────────────────────────────────────────── */

type CentralBankData = {
  banks: Array<{ name: string; rate_pct: string; last_action: string; next_meeting: string; bias: string; note: string }>;
  global_bias: string;
};

export function CentralBankPanel() {
  const { data, loading, error, refetch } = useFetchPanel<CentralBankData>("/ai/panel/central-bank-watch");
  return (
    <MacWindow title="Central Bank Watch" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge value={data.global_bias} />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">global bias</span>
            </div>
            {data.banks?.length ? (
              <div className="space-y-1.5">
                {data.banks.map((b, i) => (
                  <Row key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-terminal-text">{b.name}</span>
                      <Badge value={b.bias} />
                    </div>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="font-mono text-terminal-cyan">{b.rate_pct}%</span>
                      <span className="uppercase text-terminal-text-muted">{b.last_action}</span>
                      <span className="text-terminal-text-muted">Next: {b.next_meeting}</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-terminal-text-muted">{b.note}</p>
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

/* ── Economic Indicators ────────────────────────────────────────────── */

type EconomicIndicatorsData = {
  indicators: Array<{ name: string; value: string; previous: string; change: string; trend: string; country: string }>;
  outlook: string;
};

export function EconomicIndicatorsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<EconomicIndicatorsData>("/ai/panel/economic-indicators");
  return (
    <MacWindow title="Economic Indicators" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.outlook}</p>
            {data.indicators?.length ? (
              <div className="space-y-1.5">
                {data.indicators.map((ind, i) => (
                  <Row key={i} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <TrendArrow trend={ind.trend} />
                        <span className="text-[10px] font-medium text-terminal-text">{ind.name}</span>
                      </div>
                      <span className="text-[9px] text-terminal-text-muted">{ind.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-terminal-text">{ind.value}</span>
                      <span className="text-[9px] font-mono text-terminal-text-muted">prev {ind.previous}</span>
                      <span className="text-[9px] font-mono text-terminal-text-dim">{ind.change}</span>
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

/* ── Trade Policy ───────────────────────────────────────────────────── */

type TradePolicyData = {
  developments: Array<{ headline: string; parties: string; type: string; impact: string; status: string }>;
  risk_level: string;
  summary: string;
};

export function TradePolicyPanel() {
  const { data, loading, error, refetch } = useFetchPanel<TradePolicyData>("/ai/panel/trade-policy");
  return (
    <MacWindow title="Trade Policy" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge value={data.risk_level} />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">trade risk</span>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.summary}</p>
            {data.developments?.length ? (
              <div className="space-y-1.5">
                {data.developments.map((d, i) => (
                  <Row key={i}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-medium leading-snug text-terminal-text">{d.headline}</p>
                      <Badge value={d.impact} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-terminal-text-muted">{d.parties}</span>
                      <Badge value={d.type} />
                      <Badge value={d.status} />
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

/* ── Supply Chain ───────────────────────────────────────────────────── */

type SupplyChainData = {
  alerts: Array<{ region: string; sector: string; issue: string; severity: string; trend: string }>;
  global_stress_index: string;
  shipping_note: string;
};

export function SupplyChainPanel() {
  const { data, loading, error, refetch } = useFetchPanel<SupplyChainData>("/ai/panel/supply-chain");
  return (
    <MacWindow title="Supply Chain" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge value={data.global_stress_index} />
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">stress index</span>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.shipping_note}</p>
            {data.alerts?.length ? (
              <div className="space-y-1.5">
                {data.alerts.map((a, i) => (
                  <Row key={i} className="flex items-start gap-2">
                    <TrendArrow trend={a.trend} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-terminal-text">{a.region}</span>
                        <span className="text-[9px] text-terminal-text-muted">{a.sector}</span>
                        <Badge value={a.severity} />
                      </div>
                      <p className="text-[10px] text-terminal-text-dim">{a.issue}</p>
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
