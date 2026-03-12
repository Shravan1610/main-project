"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StreetViewPanelProps = {
  lat: number;
  lng: number;
  onClose: () => void;
};

let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: Array<() => void> = [];

function loadGoogleMapsApi(): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (googleMapsLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set — Street View unavailable");
      resolve();
      return;
    }

    googleMapsLoading = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=streetView`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      resolve();
      for (const cb of loadCallbacks) cb();
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      googleMapsLoading = false;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export function StreetViewPanel({ lat, lng, onClose }: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "no-key">("loading");

  const initStreetView = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus("no-key");
      return;
    }

    await loadGoogleMapsApi();

    if (!window.google?.maps) {
      setStatus("unavailable");
      return;
    }

    if (!containerRef.current) return;

    const sv = new google.maps.StreetViewService();
    try {
      const result = await sv.getPanorama({
        location: { lat, lng },
        radius: 500,
        source: google.maps.StreetViewSource.OUTDOOR,
      });

      if (result.data?.location?.latLng && containerRef.current) {
        panoramaRef.current = new google.maps.StreetViewPanorama(containerRef.current, {
          position: result.data.location.latLng,
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
          addressControl: true,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          fullscreenControl: false,
          motionTracking: false,
        });
        setStatus("ready");
      } else {
        setStatus("unavailable");
      }
    } catch {
      setStatus("unavailable");
    }
  }, [lat, lng]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initStreetView();
    return () => {
      panoramaRef.current = null;
    };
  }, [initStreetView]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-terminal-bg/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-terminal-border px-3 py-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold tracking-[0.12em] text-terminal-text">
            STREET VIEW
          </span>
          <span className="text-terminal-text-dim">
            {lat.toFixed(4)}°, {lng.toFixed(4)}°
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-terminal-border px-2 py-0.5 text-[10px] text-terminal-text-dim transition-colors hover:bg-terminal-border/40 hover:text-terminal-text"
        >
          ✕ CLOSE
        </button>
      </div>

      {/* Street View container */}
      <div className="relative flex-1">
        {status === "loading" && (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-terminal-green border-t-transparent" />
              <span className="text-xs text-terminal-text-dim">Loading Street View...</span>
            </div>
          </div>
        )}

        {status === "no-key" && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
              <p className="text-sm text-terminal-amber">Google Maps API Key Required</p>
              <p className="mt-1 text-xs text-terminal-text-dim">
                Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable Street View.
              </p>
            </div>
          </div>
        )}

        {status === "unavailable" && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
              <p className="text-sm text-terminal-amber">Street View Unavailable</p>
              <p className="mt-1 text-xs text-terminal-text-dim">
                No panorama found near {lat.toFixed(4)}°, {lng.toFixed(4)}°.
              </p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={`h-full w-full ${status === "ready" ? "" : "hidden"}`}
        />
      </div>
    </div>
  );
}
