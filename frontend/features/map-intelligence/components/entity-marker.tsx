// Company/stock marker | Owner: Srijan | Task: SR-1-10
import type { MapMarker } from "../types";

type EntityMarkerProps = {
  marker: MapMarker;
};

export function EntityMarker({ marker }: EntityMarkerProps) {
  return (
    <div className="rounded border border-terminal-green/40 bg-terminal-green/10 px-2 py-1 text-xs text-terminal-green">
      {marker.label}
    </div>
  );
}
