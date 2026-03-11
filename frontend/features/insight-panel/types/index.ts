export type Driver = {
  label: string;
  impact: "positive" | "negative" | "neutral";
  weight?: number | null;
  detail?: string;
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
  marketCap?: number | null;
  volume?: number | null;
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
  events?: Array<{ type?: string; severity?: string; location?: string; description?: string | null }>;
};

export type NewsSignal = {
  category: string;
  count: number;
  direction: "positive" | "negative";
  headline?: string | null;
};

export type ResearchBrief = {
  entityId: string;
  summary: string;
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
  confidence: number;
  sourceRefs: Array<{
    title: string;
    source: string;
    url: string;
  }>;
  generatedAt?: string | null;
};

export type CoverageSummary = {
  articleCount: number;
  sourceCount: number;
  lastUpdated: string;
  latestPublishedAt?: string | null;
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
  newsSignals?: NewsSignal[];
  researchBrief?: ResearchBrief;
  coverage?: CoverageSummary;
};
