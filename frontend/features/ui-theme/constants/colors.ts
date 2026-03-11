export const TERMINAL_COLORS = {
  bg: "#0a0e17",
  surface: "#111827",
  border: "#1e293b",
  green: "#00ff88",
  cyan: "#00e5ff",
  amber: "#ffb800",
  red: "#ff3b5c",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
} as const;

export const SCORE_COLORS = {
  sustainability: TERMINAL_COLORS.green,
  financialRisk: TERMINAL_COLORS.amber,
  longTermImpact: TERMINAL_COLORS.cyan,
} as const;

export const CATEGORY_COLORS = {
  risk: TERMINAL_COLORS.red,
  opportunity: TERMINAL_COLORS.green,
  regulation: TERMINAL_COLORS.cyan,
  disaster: TERMINAL_COLORS.amber,
  general: TERMINAL_COLORS.textDim,
} as const;
