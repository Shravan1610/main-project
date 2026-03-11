import { apiClient } from "@/shared/api";

import type { LiveWebcamResponse, WebcamRegion } from "../types";

export async function getLiveWebcams(region: WebcamRegion, limit = 4): Promise<LiveWebcamResponse> {
  return apiClient.get<LiveWebcamResponse>("/feeds/webcams", {
    params: {
      region,
      limit,
    },
  });
}
