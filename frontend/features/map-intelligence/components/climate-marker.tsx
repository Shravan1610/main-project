// Climate event marker | Owner: Srijan | Task: SR-1-11
import type { MapMarker } from "../types";

type ClimateMarkerProps = {
  marker: MapMarker;
};

export function ClimateMarker({ marker }: ClimateMarkerProps) {
  return (
    <div className="rounded border border-terminal-amber/50 bg-terminal-amber/10 px-2 py-1 text-xs text-terminal-amber">
      {marker.label}
    </div>
  );
}
