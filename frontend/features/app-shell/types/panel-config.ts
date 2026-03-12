import type { ComponentType } from "react";

export type PanelCategory =
  | "pinned"
  | "markets"
  | "crypto"
  | "macro"
  | "news"
  | "intelligence"
  | "regional"
  | "tools";

export type PanelConfig = {
  id: string;
  label: string;
  category: PanelCategory;
  defaultEnabled: boolean;
  isPinned: boolean;
  hasLiveBadge?: boolean;
  hasAlertBadge?: boolean;
};

export type PanelRegistryEntry = PanelConfig & {
  load: () => Promise<{ default: ComponentType }>;
};
