"use client";

import { useSearch } from "../hooks";
import { SearchResults } from "./search-results";
import type { SearchResult } from "../types";

type SearchBarProps = {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
};

export function SearchBar({ onSelect, placeholder = "Search companies, stocks, crypto" }: SearchBarProps) {
  const { query, setQuery, results, loading, error } = useSearch();

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-green/60"
      />
      {query.trim() ? <SearchResults results={results} loading={loading} error={error} onSelect={(item) => onSelect?.(item)} /> : null}
    </div>
  );
}
