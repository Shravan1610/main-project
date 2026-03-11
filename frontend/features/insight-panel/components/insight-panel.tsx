"use client";

import { ClimateSummary } from "./climate-summary";
import { EntityHeader } from "./entity-header";
import { MarketSummary } from "./market-summary";
import { NewsSummary } from "./news-summary";
import { ResearchBriefCard } from "./research-brief";
import { ScoreSection } from "./score-section";
import { useEntityAnalysis } from "../hooks";

type InsightPanelProps = {
  entityId?: string;
};

export function InsightPanel({ entityId }: InsightPanelProps) {
  const { data, loading, error } = useEntityAnalysis(entityId);

  if (!entityId) {
    return <div className="text-sm text-terminal-text-dim">Select an entity to view insights.</div>;
  }

  if (loading) {
    return <div className="text-sm text-terminal-text-dim">Loading analysis...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-terminal-red">Failed to load entity analysis{error?.message ? `: ${error.message}` : "."}</div>;
  }

  return (
    <div className="space-y-3">
      <EntityHeader entity={data} />
      <MarketSummary market={data.market} />
      <ScoreSection entity={data} />
      <ResearchBriefCard brief={data.researchBrief} coverage={data.coverage} />
      <NewsSummary news={data.news} />
      <ClimateSummary climate={data.climate} />
    </div>
  );
}
