import { apiClient } from "@/shared/api";

import type { ResearchBrief } from "../types";

export async function getEntityBrief(entityId: string): Promise<ResearchBrief> {
  const normalizedEntityId = entityId.trim();
  if (!normalizedEntityId) {
    throw new Error("Entity ID is required");
  }

  return apiClient.get<ResearchBrief>("/brief", { params: { entity: normalizedEntityId } });
}
