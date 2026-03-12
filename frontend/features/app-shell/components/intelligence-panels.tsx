"use client";

import { MacWindow } from "@/shared/components/mac-window";
import { useFetchPanel, PanelLoader, PanelError, Badge, Row, TrendArrow } from "./panel-helpers";

/* ── Fintech & Trading Tech ─────────────────────────────────────────── */

type FintechData = {
  developments: Array<{ company: string; headline: string; category: string; impact: string; stage: string }>;
  trend_note: string;
};

export function FintechPanel() {
  const { data, loading, error, refetch } = useFetchPanel<FintechData>("/ai/panel/fintech-trading-tech");
  return (
    <MacWindow title="Fintech & Trading Tech" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.trend_note}</p>
            {data.developments?.length ? (
              <div className="space-y-1.5">
                {data.developments.map((d, i) => (
                  <Row key={i}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-terminal-text">{d.company}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge value={d.stage} />
                        <Badge value={d.impact} />
                      </div>
                    </div>
                    <p className="text-[10px] text-terminal-text-dim">{d.headline}</p>
                    <span className="mt-0.5 text-[9px] uppercase text-terminal-text-muted">{d.category}</span>
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

/* ── Airline Intelligence ───────────────────────────────────────────── */

type AirlineData = {
  airlines: Array<{ name: string; ticker: string; load_factor_pct: number; revenue_trend: string; note: string }>;
  fuel_price: string;
  fuel_trend: string;
  sector_outlook: string;
};

export function AirlineIntelPanel() {
  const { data, loading, error, refetch } = useFetchPanel<AirlineData>("/ai/panel/airline-intelligence");
  return (
    <MacWindow title="Airline Intelligence" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded border border-terminal-border/40 bg-terminal-bg/50 px-3 py-2">
              <div>
                <p className="text-[8px] uppercase text-terminal-text-muted">Jet Fuel</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-mono font-bold text-terminal-text">{data.fuel_price}</p>
                  <TrendArrow trend={data.fuel_trend} />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.sector_outlook}</p>
            {data.airlines?.length ? (
              <div className="space-y-1.5">
                {data.airlines.map((a, i) => (
                  <Row key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendArrow trend={a.revenue_trend} />
                      <span className="text-[10px] font-medium text-terminal-text">{a.name}</span>
                      <span className="text-[9px] font-mono text-terminal-cyan">{a.ticker}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-terminal-text">{a.load_factor_pct}% LF</span>
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
