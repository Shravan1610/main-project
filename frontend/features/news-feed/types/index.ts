export type FeedNewsItem = {
  title: string;
  source?: string;
  publishedAt?: string;
  url?: string;
  category?: string;
};

export type NewsFeedState = {
  items: FeedNewsItem[];
  loading: boolean;
  error: string | null;
};
