import { CompareCard } from "./compare-card";
import type { EntityAnalysis } from "@/features/insight-panel/types";

type CompareGridProps = {
  entities: EntityAnalysis[];
};

export function CompareGrid({ entities }: CompareGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {entities.map((entity) => (
        <CompareCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
}
