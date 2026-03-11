import { apiClient } from "@/shared/api";

import type { EntityAnalysis } from "../types";

export async function getEntityAnalysis(entityId: string): Promise<EntityAnalysis> {
  const normalizedEntityId = entityId.trim();
  if (!normalizedEntityId) {
    throw new Error("Entity ID is required");
  }

  return apiClient.get<EntityAnalysis>("/analyze", { params: { entity: normalizedEntityId } });
}
