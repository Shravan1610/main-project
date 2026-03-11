export type FeedNewsItem = {
  title: string;
  summary?: string | null;
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
