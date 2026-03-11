"use client";

import { useEffect, useState } from "react";
import type { DependencyList } from "react";

type UseApiOptions<TData> = {
  enabled?: boolean;
  initialData?: TData | null;
};

export function useApi<TData>(
  fetcher: () => Promise<TData>,
  deps: DependencyList,
  options?: UseApiOptions<TData>,
) {
  const [data, setData] = useState<TData | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState<boolean>(Boolean(options?.enabled ?? true));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const isEnabled = options?.enabled ?? true;
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetcher();
        if (!isCancelled) {
          setData(response);
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(caughtError instanceof Error ? caughtError : new Error("Unknown API error"));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      isCancelled = true;
    };
  }, deps);

  return { data, loading, error, setData };
}
