import { apiClient } from "@/shared/api";

import type { EntityAnalysis } from "../types";

export async function getEntityAnalysis(entityId: string): Promise<EntityAnalysis> {
  return apiClient.get<EntityAnalysis>("/analyze", { params: { entity: entityId } });
}
