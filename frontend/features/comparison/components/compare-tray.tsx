import type { CompareState } from "../types";

type CompareTrayProps = {
  selectedEntityIds: CompareState["selectedEntityIds"];
  onRemove: (entityId: string) => void;
  onCompare?: () => void;
  loading?: boolean;
};

export function CompareTray({ selectedEntityIds, onRemove, onCompare, loading = false }: CompareTrayProps) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-surface p-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-terminal-text-dim">Compare Tray</p>
        <button
          type="button"
          onClick={onCompare}
          disabled={!onCompare || selectedEntityIds.length < 2 || loading}
          className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-text disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
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
