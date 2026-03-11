// Map types: MarkerData, MapViewport, LayerConfig | Owner: Srijan | Task: SR-1-08
export type MarkerKind = "entity" | "climate" | "news" | "exchange";

export type MapMarker = {
  id: string;
  kind: MarkerKind;
  label: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  meta?: Record<string, string | number | boolean | null>;
};

export type MapViewport = {
  center: [number, number];
  zoom: number;
};

export type LayerConfig = {
  id: string;
  label: string;
  enabled: boolean;
};

export type MapEngine = "2d" | "3d";

export type ActiveLayers = Record<string, boolean>;

export type MapProps = {
  viewport: MapViewport;
  markers: MapMarker[];
  activeLayers?: ActiveLayers;
  onMarkerSelect?: (marker: MapMarker) => void;
  engine?: MapEngine;
  onEngineChange?: (engine: MapEngine) => void;
};

export type LayerResponse = {
  exchanges: MapMarker[];
  climate: MapMarker[];
  news: MapMarker[];
  updatedAt?: string;
};
