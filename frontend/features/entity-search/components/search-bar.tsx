"use client";

import { useSearch } from "../hooks";
import { SearchResults } from "./search-results";
import type { SearchResult } from "../types";

type SearchBarProps = {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
};

export function SearchBar({ onSelect, placeholder = "Search companies, stocks, crypto" }: SearchBarProps) {
  const { query, setQuery, results, loading, error, clear } = useSearch();

  const handleSelect = (item: SearchResult) => {
    onSelect?.(item);
    clear();
  };

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-terminal-border bg-terminal-bg/75 px-3 py-2 text-sm text-terminal-text shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-terminal-text-muted focus:border-terminal-cyan/55"
      />
      {query.trim() ? <SearchResults results={results} loading={loading} error={error} onSelect={handleSelect} /> : null}
    </div>
  );
}
