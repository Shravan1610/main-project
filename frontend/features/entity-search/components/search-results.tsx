import { SearchResultItem } from "./search-result-item";
import type { SearchResult } from "../types";

type SearchResultsProps = {
  results: SearchResult[];
  loading?: boolean;
  error?: string | null;
  onSelect: (result: SearchResult) => void;
};

export function SearchResults({ results, loading, error, onSelect }: SearchResultsProps) {
  if (loading) {
    return <div className="rounded border border-terminal-border p-3 text-xs text-terminal-text-dim">Searching...</div>;
  }

  if (error) {
    return <div className="rounded border border-terminal-red/50 p-3 text-xs text-terminal-red">{error}</div>;
  }

  if (results.length === 0) {
    return <div className="rounded border border-terminal-border p-3 text-xs text-terminal-text-dim">No results</div>;
  }

  return (
    <div className="space-y-1">
      {results.map((result) => (
        <SearchResultItem key={result.id} result={result} onSelect={onSelect} />
      ))}
    </div>
  );
}
