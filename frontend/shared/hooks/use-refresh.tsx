"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type RefreshContextValue = {
  /** Monotonically increasing counter — changes trigger refetches. */
  refreshKey: number;
  /** Call to force all panels to refetch now. */
  refresh: () => void;
  /** True while a refresh was just triggered (resets after 2 s). */
  refreshing: boolean;
  /** Seconds until next auto-refresh. */
  secondsUntilRefresh: number;
};

const RefreshContext = createContext<RefreshContextValue>({
  refreshKey: 0,
  refresh: () => {},
  refreshing: false,
  secondsUntilRefresh: 0,
});

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(AUTO_REFRESH_MS / 1000);
  const lastRefreshRef = useRef(0);

  // Initialize ref on mount
  useEffect(() => {
    lastRefreshRef.current = Date.now();
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setRefreshing(true);
    lastRefreshRef.current = Date.now();
    setSecondsUntilRefresh(AUTO_REFRESH_MS / 1000);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - lastRefreshRef.current;
      const remaining = Math.max(0, Math.ceil((AUTO_REFRESH_MS - elapsed) / 1000));
      setSecondsUntilRefresh(remaining);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshKey, refresh, refreshing, secondsUntilRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext);
}
