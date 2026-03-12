// Map types: MarkerData, MapViewport, LayerConfig | Owner: Srijan | Task: SR-1-08
export type MarkerKind =
  | "population"
  | "climate";

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
  climateHeatmap?: ClimateHeatmapPoint[];
};

export type LayerResponse = {
  population: MapMarker[];
  climate: MapMarker[];
  updatedAt?: string;
};

export type ClimateHeatmapPoint = {
  lat: number;
  lng: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  weight: number;
};

export type { ExchangeStatusInfo } from "../utils/market-hours";
export type { WorldExchange } from "../config/world-exchanges";
