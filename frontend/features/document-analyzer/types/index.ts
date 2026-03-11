export type DocumentClaim = {
  text: string;
  type: string;
  category: string;
  confidence: number;
};

export type AiAnalytics = {
  esgRiskScore: number;
  esgRiskLevel: string;
  aiConfidence: number;
  greenwashingProbability: number;
  climateClaimCredibility: number;
  suspiciousStatements: string[];
  riskBreakdown: Record<string, number>;
  esgModelResponse?: Record<string, unknown>;
  nlpModelResponse?: Record<string, unknown>;
  verificationStatus: "verified" | "flagged" | "unavailable" | string;
  extractedMetrics?: Record<string, number>;
};

export type DocumentAnalyzerResponse = {
  inputType: "document" | "url" | "webpage" | string;
  contentLength: number;
  esg: {
    overall_score?: number;
    confidence?: number;
    scores?: Array<{ category?: string; score?: number; confidence?: number }>;
  } | null;
  esk: {
    overall_score?: number;
    confidence?: number;
    scores?: Array<{ category?: string; score?: number; confidence?: number }>;
  } | null;
  extraction: {
    entities?: Record<string, string[]>;
    summary?: string;
  };
  claims?: DocumentClaim[];
  modelStatus: string;
  source?: {
    url?: string | null;
  };
  aiAnalytics?: AiAnalytics | null;
};
