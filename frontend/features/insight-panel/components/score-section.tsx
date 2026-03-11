import { ScoreCard } from "./score-card";
import type { EntityAnalysis } from "../types";

type ScoreSectionProps = {
  entity: EntityAnalysis;
};

export function ScoreSection({ entity }: ScoreSectionProps) {
  return (
    <div className="space-y-2">
      <ScoreCard
        label="Sustainability"
        value={entity.scores.sustainability}
        drivers={entity.drivers.sustainability}
        barClassName="bg-terminal-green"
        textClassName="text-terminal-green"
      />
      <ScoreCard
        label="Financial Risk"
        value={entity.scores.financialRisk}
        drivers={entity.drivers.financialRisk}
        barClassName="bg-terminal-red"
        textClassName="text-terminal-red"
      />
      <ScoreCard
        label="Long-Term Impact"
        value={entity.scores.longTermImpact}
        drivers={entity.drivers.longTermImpact}
        barClassName="bg-[#3da9fc]"
        textClassName="text-[#7dc8ff]"
      />
    </div>
  );
}
