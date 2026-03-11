// Company/stock marker | Owner: Srijan | Task: SR-2-02
"use client";

import { CircleMarker, Popup } from "react-leaflet";

import type { MapMarker } from "../types";

type EntityMarkerProps = {
  marker: MapMarker;
  onSelect?: (marker: MapMarker) => void;
};

export function EntityMarker({ marker, onSelect }: EntityMarkerProps) {
  const position: [number, number] = [marker.coordinates.lat, marker.coordinates.lng];

  return (
    <CircleMarker
      center={position}
      radius={7}
      pathOptions={{
        color: "#7DFF9B",
        fillColor: "#7DFF9B",
        fillOpacity: 0.75,
        weight: 2,
      }}
      eventHandlers={{
        click: () => onSelect?.(marker),
      }}
    >
      <Popup>
        <div className="text-xs">
          <p className="font-semibold">{marker.label}</p>
          <p>
            {marker.coordinates.lat.toFixed(4)}, {marker.coordinates.lng.toFixed(4)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
}
