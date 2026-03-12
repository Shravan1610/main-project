export type LiveNewsChannel = {
  id: string;
  label: string;
  channelId: string;
  channelTitle: string;
  videoId: string | null;
  liveUrl: string;
};

export type LiveNewsResponse = {
  channels: LiveNewsChannel[];
  updatedAt: string;
  hasApiKey: boolean;
};
