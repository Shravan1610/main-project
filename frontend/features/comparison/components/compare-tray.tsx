import type { CompareState } from "../types";

type CompareTrayProps = {
  selectedEntityIds: CompareState["selectedEntityIds"];
  onRemove: (entityId: string) => void;
};

export function CompareTray({ selectedEntityIds, onRemove }: CompareTrayProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-2">
      <p className="mb-2 text-xs text-terminal-text-dim">Compare Tray</p>
      <div className="flex flex-wrap gap-2">
        {selectedEntityIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onRemove(id)}
            className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-text"
          >
            {id} ✕
          </button>
        ))}
        {selectedEntityIds.length === 0 ? <p className="text-xs text-terminal-text-dim">No entities selected.</p> : null}
      </div>
    </div>
  );
}
