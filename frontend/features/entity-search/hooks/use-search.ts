"use client";

import { useEffect, useMemo, useState } from "react";

import { searchEntities } from "../services";
import type { SearchResult } from "../types";

export function useSearch(initialQuery = "", debounceMs = 250) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchEntities(trimmedQuery);
        if (!cancelled) {
          setResults(response.results);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Search failed");
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmedQuery, debounceMs]);

  return { query, setQuery, results, loading, error, clear: () => setQuery("") };
}
