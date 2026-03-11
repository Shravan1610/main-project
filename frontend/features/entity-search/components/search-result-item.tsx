import type { SearchResult } from "../types";

type SearchResultItemProps = {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
};

export function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className="w-full rounded border border-terminal-border bg-terminal-surface px-3 py-2 text-left text-sm hover:border-terminal-green/50"
    >
      <p className="font-medium text-terminal-text">{result.name}</p>
      <p className="text-xs text-terminal-text-dim">
        {result.type.toUpperCase()}
        {result.ticker ? ` • ${result.ticker}` : ""}
      </p>
    </button>
  );
}
