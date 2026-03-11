"use client";

import { useEffect, useState } from "react";

type UseApiOptions<TData> = {
  enabled?: boolean;
  initialData?: TData | null;
  refreshIntervalMs?: number;
  pauseWhenHidden?: boolean;
};

export function useApi<TData>(
  fetcher: () => Promise<TData>,
  options?: UseApiOptions<TData>,
) {
  const isEnabled = options?.enabled ?? true;
  const refreshIntervalMs = options?.refreshIntervalMs ?? 0;
  const pauseWhenHidden = options?.pauseWhenHidden ?? false;
  const [data, setData] = useState<TData | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState<boolean>(Boolean(isEnabled));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      if (pauseWhenHidden && typeof document !== "undefined" && document.visibilityState === "hidden") {
        if (!isCancelled) {
          setLoading(false);
        }
        if (refreshIntervalMs > 0 && !isCancelled) {
          timer = setTimeout(run, refreshIntervalMs);
        }
        return;
      }

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

      if (refreshIntervalMs > 0 && !isCancelled) {
        timer = setTimeout(run, refreshIntervalMs);
      }
    }

    run();

    return () => {
      isCancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [fetcher, isEnabled, refreshIntervalMs, pauseWhenHidden]);

  return { data, loading, error, setData };
}
