export type Driver = {
  label: string;
  impact: "positive" | "negative" | "neutral";
};

export type ScoreMap = {
  sustainability: number;
  financialRisk: number;
  longTermImpact: number;
};

export type MarketSnapshot = {
  price: number;
  changePercent: number;
  currency?: string;
  exchange?: string;
};

export type NewsItem = {
  title: string;
  source?: string;
  publishedAt?: string;
  url?: string;
  category?: string;
};

export type ClimateSummaryData = {
  summary: string;
  vulnerability?: string;
  events?: Array<{ title?: string; category?: string }>;
};

export type EntityAnalysis = {
  id: string;
  name: string;
  type: string;
  ticker?: string;
  country?: string;
  market: MarketSnapshot;
  scores: ScoreMap;
  drivers: {
    sustainability: Driver[];
    financialRisk: Driver[];
    longTermImpact: Driver[];
  };
  news: NewsItem[];
  climate: ClimateSummaryData;
};
