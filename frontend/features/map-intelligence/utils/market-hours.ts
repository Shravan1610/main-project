/**
 * Utilities for computing world market open/closed status
 * based on current time and exchange local trading hours.
 * Handles DST automatically via Intl.DateTimeFormat.
 */

import { WORLD_EXCHANGES, type WorldExchange } from "../config/world-exchanges";

export type ExchangeStatus = "open" | "closed";

export type ExchangeStatusInfo = {
  exchange: WorldExchange;
  status: ExchangeStatus;
  localTimeStr: string;
  localHour: number;
  /** Human-readable time until next state change */
  timeUntilChange: string;
  /** Progress through trading day (0-1), only meaningful when open */
  sessionProgress: number;
};

/** Get the local decimal hour for a timezone using Intl (handles DST). */
function getLocalHour(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(now);

  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return hour + minute / 60;
}

/** Get the local day of week for a timezone (0 = Sunday). */
function getLocalDay(timezone: string, now: Date): number {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(now);
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return dayMap[dayStr] ?? 0;
}

/** Format a local time string like "09:30 AM" */
function getLocalTimeStr(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(now);
}

/** Convert decimal hours to "Xh Ym" string */
function hoursToHumanReadable(h: number): string {
  if (h < 0) h += 24;
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Get the full status for a single exchange */
export function getExchangeStatus(
  exchange: WorldExchange,
  now: Date,
): ExchangeStatusInfo {
  const localHour = getLocalHour(exchange.timezone, now);
  const localDay = getLocalDay(exchange.timezone, now);
  const localTimeStr = getLocalTimeStr(exchange.timezone, now);

  const { open, close } = exchange.localHours;

  // Weekends
  const isWeekday = localDay >= 1 && localDay <= 5;

  if (!isWeekday) {
    const daysUntilMonday = localDay === 6 ? 2 : 1;
    const hoursUntilOpen = (daysUntilMonday - 1) * 24 + (24 - localHour) + open;
    return {
      exchange,
      status: "closed",
      localTimeStr,
      localHour,
      timeUntilChange: `Opens ${hoursToHumanReadable(hoursUntilOpen)}`,
      sessionProgress: 0,
    };
  }

  const isOpen = localHour >= open && localHour < close;

  if (isOpen) {
    const remaining = close - localHour;
    const total = close - open;
    const elapsed = localHour - open;
    return {
      exchange,
      status: "open",
      localTimeStr,
      localHour,
      timeUntilChange: `Closes ${hoursToHumanReadable(remaining)}`,
      sessionProgress: Math.min(1, elapsed / total),
    };
  }

  // Before market open today
  if (localHour < open) {
    const until = open - localHour;
    return {
      exchange,
      status: "closed",
      localTimeStr,
      localHour,
      timeUntilChange: `Opens ${hoursToHumanReadable(until)}`,
      sessionProgress: 0,
    };
  }

  // After market close — next open is tomorrow (or Monday if Friday)
  const isOpenTomorrow = localDay < 5; // Mon-Thu
  const daysUntil = isOpenTomorrow ? 1 : 3; // Friday → Monday
  const hoursUntilOpen = (daysUntil - 1) * 24 + (24 - localHour) + open;
  return {
    exchange,
    status: "closed",
    localTimeStr,
    localHour,
    timeUntilChange: `Opens ${hoursToHumanReadable(hoursUntilOpen)}`,
    sessionProgress: 0,
  };
}

/** Get status for all world exchanges */
export function getAllExchangeStatuses(now?: Date): ExchangeStatusInfo[] {
  const d = now ?? new Date();
  return WORLD_EXCHANGES.map((ex) => getExchangeStatus(ex, d));
}

/** Get the user's local timezone name */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Get user-friendly timezone abbreviation */
export function getUserTimezoneAbbr(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "LOCAL";
}
