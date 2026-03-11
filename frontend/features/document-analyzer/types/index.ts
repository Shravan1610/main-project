export type DocumentClaim = {
  text: string;
  type: string;
  category: string;
  confidence: number;
};

export type AiAnalytics = {
  analysisEngine?: "esg" | "nlp" | "nlp+esg" | string;
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
  analysisEngine?: "esg" | "nlp" | "nlp+esg" | string;
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
  storage?: {
    status?: string;
    id?: string | null;
    message?: string;
  };
  aiAnalytics?: AiAnalytics | null;
};

export type DocumentAnalyzerHistoryItem = {
  id: string;
  input_type: "document" | "url" | "webpage" | string;
  analysis_engine: "esg" | "nlp" | "nlp+esg" | string;
  model_status: string;
  source?: {
    url?: string | null;
  };
  content_length: number;
  extraction?: {
    summary?: string;
  };
  ai_analytics?: {
    esgRiskScore?: number;
  };
  created_at: string;
};
