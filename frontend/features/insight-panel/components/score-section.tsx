import { ScoreCard } from "./score-card";
import type { EntityAnalysis } from "../types";

type ScoreSectionProps = {
  entity: EntityAnalysis;
};

export function ScoreSection({ entity }: ScoreSectionProps) {
  return (
    <div className="space-y-2">
      <ScoreCard label="Sustainability" value={entity.scores.sustainability} drivers={entity.drivers.sustainability} />
      <ScoreCard label="Financial Risk" value={entity.scores.financialRisk} drivers={entity.drivers.financialRisk} />
      <ScoreCard label="Long-Term Impact" value={entity.scores.longTermImpact} drivers={entity.drivers.longTermImpact} />
    </div>
  );
}
