export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const DEFAULT_MAP_VIEW = {
  lat: 20,
  lng: 0,
  zoom: 2,
} as const;

export const SCORE_RANGE = {
  min: 0,
  max: 100,
} as const;

export const COMPARE_LIMIT = 3;
