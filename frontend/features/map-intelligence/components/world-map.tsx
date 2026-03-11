// Main Leaflet map component | Owner: Srijan | Task: SR-1-09
import type { MapProps } from "../types";

export function WorldMap({ viewport, markers, onMarkerSelect }: MapProps) {
  return (
    <div className="h-full min-h-[320px] rounded-md border border-terminal-border bg-terminal-bg/60 p-3">
      <div className="mb-3 flex items-center justify-between text-xs text-terminal-text-dim">
        <span>World Map (Phase 1 scaffold)</span>
        <span>
          Center: {viewport.center[0]}, {viewport.center[1]} | Zoom: {viewport.zoom}
        </span>
      </div>
      <div className="space-y-2">
        {markers.length === 0 ? (
          <p className="text-sm text-terminal-text-dim">No markers yet.</p>
        ) : (
          markers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              onClick={() => onMarkerSelect?.(marker)}
              className="flex w-full items-center justify-between rounded border border-terminal-border bg-terminal-surface px-3 py-2 text-left text-xs"
            >
              <span>
                {marker.label} ({marker.kind})
              </span>
              <span className="text-terminal-text-dim">
                {marker.coordinates.lat}, {marker.coordinates.lng}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
