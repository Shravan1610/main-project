import type { EntityAnalysis } from "../types";

type EntityHeaderProps = {
  entity: Pick<EntityAnalysis, "name" | "type" | "ticker" | "country">;
};

export function EntityHeader({ entity }: EntityHeaderProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-terminal-text">{entity.name}</h3>
      <p className="text-xs text-terminal-text-dim">
        {entity.type.toUpperCase()}
        {entity.ticker ? ` • ${entity.ticker}` : ""}
        {entity.country ? ` • ${entity.country}` : ""}
      </p>
    </div>
  );
}
