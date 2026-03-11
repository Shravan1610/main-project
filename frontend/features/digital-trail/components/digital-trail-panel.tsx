"use client";

import { useMemo, useState } from "react";

type AssetKind = "crypto" | "webpage" | "document" | "digital-asset" | "blockchain-asset";

type TrailEvent = {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  risk: "low" | "medium" | "high";
};

const ASSET_KINDS: Array<{ id: AssetKind; label: string }> = [
  { id: "crypto", label: "Crypto Currency" },
  { id: "webpage", label: "Webpage" },
  { id: "document", label: "Document" },
  { id: "digital-asset", label: "Digital Asset" },
  { id: "blockchain-asset", label: "Blockchain Asset" },
];

const BASE_EVENTS: TrailEvent[] = [
  {
    id: "1",
    timestamp: "2026-03-11T09:05:00Z",
    event: "Large movement pattern detected across related sources.",
    source: "Cross-source monitor",
    risk: "medium",
  },
  {
    id: "2",
    timestamp: "2026-03-11T09:22:00Z",
    event: "Asset mentioned in coordinated activity spike.",
    source: "Social intel",
    risk: "high",
  },
  {
    id: "3",
    timestamp: "2026-03-11T09:43:00Z",
    event: "New linkage discovered with previously unseen counterparty.",
    source: "Graph correlation",
    risk: "medium",
  },
  {
    id: "4",
    timestamp: "2026-03-11T10:02:00Z",
    event: "Ownership and propagation profile stabilized after activity burst.",
    source: "Attribution analysis",
    risk: "low",
  },
];

function riskClassName(risk: TrailEvent["risk"]) {
  if (risk === "high") return "text-terminal-red";
  if (risk === "medium") return "text-terminal-amber";
  return "text-terminal-green";
}

export function DigitalTrailPanel() {
  const [assetKind, setAssetKind] = useState<AssetKind>("crypto");
  const [asset, setAsset] = useState("BTC");
  const [sourceUrl, setSourceUrl] = useState("");
  const [documentName, setDocumentName] = useState("");

  const events = useMemo(
    () =>
      BASE_EVENTS.map((item) => ({
        ...item,
        event: item.event.replace("Asset", asset.toUpperCase() || "ASSET"),
      })),
    [asset],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-terminal-text">Digital Asset Trail</h3>
        <p className="text-xs text-terminal-text-muted">Crypto, webpages, documents, and blockchain artifacts</p>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
        <p className="text-xs text-terminal-text-muted">Asset Type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ASSET_KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAssetKind(item.id)}
              className={`rounded border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                assetKind === item.id
                  ? "border-terminal-cyan/35 bg-terminal-cyan/8 text-terminal-cyan"
                  : "border-terminal-border text-terminal-text-dim hover:bg-terminal-border/35"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="text-xs text-terminal-text-muted" htmlFor="digital-trail-asset">
          {assetKind === "webpage"
            ? "Webpage Identifier"
            : assetKind === "document"
              ? "Document Identifier"
              : "Asset Symbol / Address / ID"}
        </label>
        <input
          id="digital-trail-asset"
          type="text"
          value={asset}
          onChange={(event) => setAsset(event.target.value)}
          placeholder="BTC or wallet address"
          className="mt-1 w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
        />

        {assetKind === "webpage" ? (
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://example.com"
            className="mt-2 w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
          />
        ) : null}

        {assetKind === "document" ? (
          <input
            type="text"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder="report.pdf or document hash"
            className="mt-2 w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
          />
        ) : null}
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-terminal-text-muted">Trail Timeline</p>
        <p className="mb-2 text-xs text-terminal-text-muted">
          Scope:{" "}
          {assetKind === "webpage"
            ? sourceUrl || "web domain/page"
            : assetKind === "document"
              ? documentName || "document source"
              : asset || "asset id"}
        </p>
        <div className="space-y-2">
          {events.map((event) => (
            <article key={event.id} className="rounded border border-terminal-border bg-terminal-surface p-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-terminal-text">{new Date(event.timestamp).toLocaleString()}</p>
                <p className={`text-xs uppercase ${riskClassName(event.risk)}`}>{event.risk}</p>
              </div>
              <p className="mt-1 text-sm text-terminal-text">{event.event}</p>
              <p className="mt-1 text-xs text-terminal-text-muted">{event.source}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
