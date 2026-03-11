export type EntityType = "company" | "stock" | "crypto";

export type SearchResult = {
  id: string;
  name: string;
  type: EntityType;
  ticker?: string;
  country?: string;
  exchange?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  total: number;
};

export type SearchState = {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
};
