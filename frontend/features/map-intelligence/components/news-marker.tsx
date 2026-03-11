// News location marker | Owner: Srijan | Task: SR-1-12
import type { MapMarker } from "../types";

type NewsMarkerProps = {
  marker: MapMarker;
};

export function NewsMarker({ marker }: NewsMarkerProps) {
  return (
    <div className="rounded border border-terminal-cyan/50 bg-terminal-cyan/10 px-2 py-1 text-xs text-terminal-cyan">
      {marker.label}
    </div>
  );
}
