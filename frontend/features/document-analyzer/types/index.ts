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
  modelStatus: string;
  source?: {
    url?: string | null;
  };
};
