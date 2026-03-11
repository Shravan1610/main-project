"use client";

import { useState } from "react";

import { useLiveWebcams } from "../hooks";
import type { WebcamRegion } from "../types";

const REGION_LABELS: Record<WebcamRegion, string> = {
  iran: "Iran Attacks",
  all: "All",
  "middle-east": "Mideast",
  europe: "Europe",
  americas: "Americas",
  asia: "Asia",
  space: "Space",
};

const REGION_ORDER: WebcamRegion[] = ["iran", "all", "middle-east", "europe", "americas", "asia", "space"];

function buildYoutubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function LiveWebcamsDashboard() {
  const [region, setRegion] = useState<WebcamRegion>("space");
  const { data, loading, error } = useLiveWebcams(region, 4);

  const feeds = data?.feeds ?? [];
  const hasApiKey = data?.resolver?.hasApiKey ?? true;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-terminal-text">Live Webcams</h3>
        <p className="text-xs text-rose-300">{feeds.length} live</p>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {REGION_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`rounded border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
                region === item
                  ? "border-rose-500/70 bg-rose-500/20 text-rose-200"
                  : "border-terminal-border text-terminal-text-dim hover:bg-terminal-border/35"
              }`}
            >
              {REGION_LABELS[item]}
            </button>
          ))}
        </div>

        {loading ? <p className="text-xs text-terminal-text-dim">Resolving live streams...</p> : null}
        {error ? <p className="text-xs text-terminal-red">Failed to resolve live streams.</p> : null}
        {!hasApiKey ? <p className="text-xs text-terminal-text-dim">Set `YOUTUBE_API_KEY` to enable live webcam resolver.</p> : null}

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {feeds.map((feed) => (
            <article key={`${feed.id}-${feed.videoId}`} className="overflow-hidden rounded border border-terminal-border bg-terminal-surface">
              <header className="flex items-center justify-between border-b border-terminal-border px-2 py-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-terminal-text">{feed.city}</p>
                <span className="text-[10px] uppercase tracking-wide text-terminal-text-muted">{feed.country}</span>
              </header>
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={buildYoutubeEmbedUrl(feed.videoId)}
                  title={`${feed.city} live webcam`}
                  loading="lazy"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </article>
          ))}
          {!loading && feeds.length === 0 && hasApiKey ? <p className="text-xs text-terminal-text-dim">No live streams available for this region.</p> : null}
        </div>
      </div>
    </section>
  );
}
