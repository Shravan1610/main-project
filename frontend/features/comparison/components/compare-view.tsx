import { CompareGrid } from "./compare-grid";
import type { EntityAnalysis } from "@/features/insight-panel/types";

type CompareViewProps = {
  entities: EntityAnalysis[];
};

export function CompareView({ entities }: CompareViewProps) {
  if (entities.length === 0) {
    return <p className="text-sm text-terminal-text-dim">No comparison data yet.</p>;
  }

  return <CompareGrid entities={entities} />;
}
