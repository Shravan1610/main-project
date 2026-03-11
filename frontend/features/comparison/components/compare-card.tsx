import type { EntityAnalysis } from "@/features/insight-panel/types";

type CompareCardProps = {
  entity: EntityAnalysis;
};

export function CompareCard({ entity }: CompareCardProps) {
  return (
    <article className="rounded border border-terminal-border bg-terminal-surface p-3">
      <h4 className="text-sm font-semibold text-terminal-text">{entity.name}</h4>
      <p className="text-xs text-terminal-text-dim">{entity.ticker || entity.id}</p>
      <div className="mt-2 space-y-1 text-xs text-terminal-text-dim">
        <p>Sustainability: {entity.scores.sustainability}</p>
        <p>Financial Risk: {entity.scores.financialRisk}</p>
        <p>Long-Term Impact: {entity.scores.longTermImpact}</p>
      </div>
    </article>
  );
}
