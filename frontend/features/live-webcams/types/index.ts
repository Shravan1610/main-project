export type WebcamRegion = "iran" | "all" | "middle-east" | "europe" | "americas" | "asia" | "space";

export type LiveWebcamFeed = {
  id: string;
  city: string;
  country: string;
  region: WebcamRegion | string;
  videoId: string;
  title: string;
  channelTitle: string;
  score: number;
  url: string;
};

export type LiveWebcamResponse = {
  region: WebcamRegion | string;
  feeds: LiveWebcamFeed[];
  updatedAt: string;
  resolver?: {
    cacheSeconds: number;
    reResolveSeconds: number;
    hasApiKey: boolean;
  };
};
