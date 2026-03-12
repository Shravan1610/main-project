"use client";

import { MacWindow } from "@/shared/components/mac-window";
import { useFetchPanel, PanelLoader, PanelError, Badge, Row } from "./panel-helpers";

/* ── Commodities News ───────────────────────────────────────────────── */

type CommoditiesNewsData = {
  articles: Array<{ title: string; summary: string; commodity: string; impact: string; time_ago: string }>;
};

export function CommoditiesNewsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<CommoditiesNewsData>("/ai/panel/commodities-news");
  return (
    <MacWindow title="Commodities News">
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data?.articles?.length ? (
          <div className="space-y-2">
            {data.articles.map((a, i) => (
              <Row key={i}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-[10px] font-medium leading-snug text-terminal-text">{a.title}</p>
                  <Badge value={a.impact} />
                </div>
                <p className="text-[10px] text-terminal-text-dim">{a.summary}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] font-medium uppercase text-terminal-amber">{a.commodity}</span>
                  <span className="text-[9px] text-terminal-text-muted">{a.time_ago}</span>
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="py-6 text-center text-[10px] text-terminal-text-muted">No articles</p>}
      </div>
    </MacWindow>
  );
}

/* ── Economic News ──────────────────────────────────────────────────── */

type EconomicNewsData = {
  articles: Array<{ title: string; summary: string; region: string; category: string; time_ago: string }>;
};

export function EconomicNewsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<EconomicNewsData>("/ai/panel/economic-news");
  return (
    <MacWindow title="Economic News">
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
                  <span className="text-[9px] uppercase text-terminal-cyan">{a.region}</span>
                  <Badge value={a.category} />
                </div>
              </Row>
            ))}
          </div>
        ) : <p className="py-6 text-center text-[10px] text-terminal-text-muted">No articles</p>}
      </div>
    </MacWindow>
  );
}
