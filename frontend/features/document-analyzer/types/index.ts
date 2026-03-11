export type DocumentClaim = {
  text: string;
  type: string;
  category: string;
  confidence: number;
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
};
