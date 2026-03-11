import Supercluster from "supercluster";

import type { MapMarker } from "../types";

export type ClusterFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    /** Original marker — only present for leaf features */
    marker?: MapMarker;
  };
};

const DEFAULT_OPTIONS: Supercluster.Options<
  { marker: MapMarker },
  { cluster: boolean; cluster_id?: number; point_count?: number; marker?: MapMarker }
> = {
  radius: 60,
  maxZoom: 16,
  minZoom: 0,
};

export function buildClusterIndex(markers: MapMarker[]) {
  const index = new Supercluster<
    { marker: MapMarker },
    { cluster: boolean; cluster_id?: number; point_count?: number; marker?: MapMarker }
  >(DEFAULT_OPTIONS);

  const points: GeoJSON.Feature<GeoJSON.Point, { marker: MapMarker }>[] = markers.map(
    (m) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [m.coordinates.lng, m.coordinates.lat],
      },
      properties: { marker: m },
    }),
  );

  index.load(points);
  return index;
}

export function getClusters(
  index: Supercluster<
    { marker: MapMarker },
    { cluster: boolean; cluster_id?: number; point_count?: number; marker?: MapMarker }
  >,
  bounds: [number, number, number, number],
  zoom: number,
): ClusterFeature[] {
  return index.getClusters(bounds, Math.floor(zoom)) as ClusterFeature[];
}
