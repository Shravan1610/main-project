import type { EntityAnalysis } from "@/features/insight-panel/types";

export type CompareRequest = {
  entities: string[];
};

export type CompareResponse = {
  entities: EntityAnalysis[];
};

export type CompareState = {
  selectedEntityIds: string[];
  compareData: EntityAnalysis[];
  loading: boolean;
  error: string | null;
};
