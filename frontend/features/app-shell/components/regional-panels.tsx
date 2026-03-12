"use client";

import { MacWindow } from "@/shared/components/mac-window";
import { useFetchPanel, PanelLoader, PanelError, Badge, SectionHeader, Row } from "./panel-helpers";

/* ── GCC Investments ────────────────────────────────────────────────── */

type GccInvestmentsData = {
  investments: Array<{ entity: string; target: string; type: string; value: string; sector: string }>;
  total_swf_aum: string;
  trend_note: string;
};

export function GccInvestmentsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<GccInvestmentsData>("/ai/panel/gcc-investments");
  return (
    <MacWindow title="GCC Investments" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded border border-terminal-border/40 bg-terminal-bg/50 px-3 py-2">
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">SWF AUM</span>
              <span className="text-xs font-mono font-bold text-terminal-amber">{data.total_swf_aum}</span>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.trend_note}</p>
            {data.investments?.length ? (
              <div className="space-y-1.5">
                {data.investments.map((inv, i) => (
                  <Row key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-terminal-text">{inv.entity}</span>
                      <span className="text-[9px] font-mono text-terminal-amber">{inv.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-terminal-text-dim">→ {inv.target}</span>
                      <Badge value={inv.type} />
                      <span className="text-[9px] text-terminal-text-muted">{inv.sector}</span>
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

/* ── GCC Business News ──────────────────────────────────────────────── */

type GccBusinessNewsData = {
  articles: Array<{ title: string; summary: string; country: string; sector: string; time_ago: string }>;
};

export function GccBusinessNewsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<GccBusinessNewsData>("/ai/panel/gcc-business-news");
  return (
    <MacWindow title="GCC Business News" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data?.articles?.length ? (
          <div className="space-y-2">
            {data.articles.map((a, i) => (
              <Row key={i}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-[10px] font-medium leading-snug text-terminal-text">{a.title}</p>
                  <span className="text-[9px] text-terminal-text-muted">{a.time_ago}</span>
                </div>
                <p className="text-[10px] text-terminal-text-dim">{a.summary}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] uppercase text-terminal-cyan">{a.country}</span>
                  <span className="text-[9px] text-terminal-text-muted">{a.sector}</span>
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="py-6 text-center text-[10px] text-terminal-text-muted">No articles</p>}
      </div>
    </MacWindow>
  );
}

/* ── Gulf Economies ─────────────────────────────────────────────────── */

type GulfEconomiesData = {
  countries: Array<{ name: string; gdp_growth_pct: string; oil_dependency_pct: number; diversification_score: number; key_project: string; outlook: string }>;
  region_summary: string;
};

export function GulfEconomiesPanel() {
  const { data, loading, error, refetch } = useFetchPanel<GulfEconomiesData>("/ai/panel/gulf-economies");
  return (
    <MacWindow title="Gulf Economies" rightSlot={<span className="text-terminal-cyan/80">AI</span>}>
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <p className="text-[10px] text-terminal-text-dim">{data.region_summary}</p>
            {data.countries?.length ? (
              <div className="space-y-1.5">
                {data.countries.map((c, i) => (
                  <Row key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-terminal-text">{c.name}</span>
                      <Badge value={c.outlook} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[8px] uppercase text-terminal-text-muted">GDP</p>
                        <p className="text-[10px] font-mono text-terminal-green">{c.gdp_growth_pct}%</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-terminal-text-muted">Oil Dep</p>
                        <p className="text-[10px] font-mono text-terminal-text">{c.oil_dependency_pct}%</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-terminal-text-muted">Diversify</p>
                        <p className="text-[10px] font-mono text-terminal-cyan">{c.diversification_score}/10</p>
                      </div>
                    </div>
                    <p className="mt-1 text-[9px] text-terminal-text-muted">{c.key_project}</p>
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
