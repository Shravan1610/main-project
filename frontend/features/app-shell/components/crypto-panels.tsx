"use client";

import { MacWindow } from "@/shared/components/mac-window";
import { useFetchPanel, PanelLoader, PanelError, Badge, SectionHeader, Row } from "./panel-helpers";

/* ── Crypto News ────────────────────────────────────────────────────── */

type CryptoNewsData = {
  articles: Array<{ title: string; summary: string; category: string; sentiment: string; time_ago: string }>;
};

export function CryptoNewsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<CryptoNewsData>("/ai/panel/crypto-news");
  return (
    <MacWindow title="Crypto News">
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data?.articles?.length ? (
          <div className="space-y-2">
            {data.articles.map((a, i) => (
              <Row key={i}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-[10px] font-medium leading-snug text-terminal-text">{a.title}</p>
                  <Badge value={a.sentiment} />
                </div>
                <p className="text-[10px] text-terminal-text-dim">{a.summary}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] uppercase text-terminal-text-muted">{a.category}</span>
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

/* ── BTC ETF Tracker ────────────────────────────────────────────────── */

type BtcEtfData = {
  etfs: Array<{ name: string; ticker: string; price: string; aum: string; flow_1d: string; flow_direction: string }>;
  total_btc_held: string;
  net_flow_summary: string;
};

const FLOW_COLORS: Record<string, string> = {
  inflow: "text-terminal-green",
  outflow: "text-terminal-red",
  flat: "text-terminal-text-muted",
};

export function BtcEtfPanel() {
  const { data, loading, error, refetch } = useFetchPanel<BtcEtfData>("/ai/panel/btc-etf-tracker");
  return (
    <MacWindow title="BTC ETF Tracker">
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded border border-terminal-border/40 bg-terminal-bg/50 px-3 py-2">
              <div>
                <p className="text-[8px] uppercase text-terminal-text-muted">Total BTC Held</p>
                <p className="text-xs font-mono font-bold text-terminal-amber">{data.total_btc_held}</p>
              </div>
            </div>
            <p className="text-[10px] text-terminal-text-dim">{data.net_flow_summary}</p>
            {data.etfs?.length ? (
              <div>
                <SectionHeader>ETFs</SectionHeader>
                <div className="space-y-1.5">
                  {data.etfs.map((e, i) => (
                    <Row key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-terminal-cyan">{e.ticker}</span>
                        <span className="truncate text-[9px] text-terminal-text-dim">{e.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-terminal-text">{e.price}</span>
                        <span className={`text-[9px] font-mono ${FLOW_COLORS[e.flow_direction] ?? "text-terminal-text-muted"}`}>{e.flow_1d}</span>
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

/* ── Stablecoins ────────────────────────────────────────────────────── */

type StablecoinsData = {
  stablecoins: Array<{ name: string; ticker: string; peg: string; market_cap: string; volume_24h: string; deviation_bps: number; status: string }>;
  total_market_cap: string;
};

export function StablecoinsPanel() {
  const { data, loading, error, refetch } = useFetchPanel<StablecoinsData>("/ai/panel/stablecoins");
  return (
    <MacWindow title="Stablecoins">
      <div className="p-3">
        {loading ? <PanelLoader /> : error ? <PanelError message={error} onRetry={refetch} /> : data ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded border border-terminal-border/40 bg-terminal-bg/50 px-3 py-2">
              <span className="text-[9px] uppercase tracking-[0.14em] text-terminal-text-muted">Total Mcap</span>
              <span className="text-xs font-mono font-bold text-terminal-text">{data.total_market_cap}</span>
            </div>
            {data.stablecoins?.length ? (
              <div className="space-y-1.5">
                {data.stablecoins.map((s, i) => (
                  <Row key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-terminal-cyan">{s.ticker}</span>
                      <span className="text-[9px] text-terminal-text-dim">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-terminal-text">{s.peg}</span>
                      <span className={`text-[9px] font-mono ${Math.abs(s.deviation_bps) > 10 ? "text-terminal-red" : "text-terminal-green"}`}>{s.deviation_bps > 0 ? "+" : ""}{s.deviation_bps}bp</span>
                      <Badge value={s.status} />
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
