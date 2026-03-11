"use client";

import { useState } from "react";

import { useLiveWebcams } from "../hooks";
import type { LiveWebcamFeed, WebcamRegion } from "../types";

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

const FALLBACK_FEEDS: Record<WebcamRegion, LiveWebcamFeed[]> = {
  iran: [
    {
      id: "aljazeera-iran",
      city: "Jerusalem",
      country: "Middle East",
      region: "iran",
      videoId: "",
      channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
      title: "Middle East Live Coverage",
      channelTitle: "Al Jazeera English",
      score: 100,
      url: "https://www.youtube.com/@aljazeeraenglish/live",
    },
    {
      id: "skynews-iran",
      city: "Tel Aviv",
      country: "UK",
      region: "iran",
      videoId: "",
      channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
      title: "Breaking Live Coverage",
      channelTitle: "Sky News",
      score: 95,
      url: "https://www.youtube.com/@SkyNews/live",
    },
    {
      id: "france24-iran",
      city: "Global Desk",
      country: "France",
      region: "iran",
      videoId: "",
      channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
      title: "International Live News",
      channelTitle: "FRANCE 24 English",
      score: 90,
      url: "https://www.youtube.com/@France24_en/live",
    },
  ],
  all: [
    {
      id: "bloomberg-all",
      city: "Markets",
      country: "USA",
      region: "all",
      videoId: "",
      channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
      title: "Bloomberg Television Live",
      channelTitle: "Bloomberg Television",
      score: 100,
      url: "https://www.youtube.com/@markets/live",
    },
    {
      id: "skynews-all",
      city: "Global",
      country: "UK",
      region: "all",
      videoId: "",
      channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
      title: "Sky News Live",
      channelTitle: "Sky News",
      score: 98,
      url: "https://www.youtube.com/@SkyNews/live",
    },
    {
      id: "dw-all",
      city: "Berlin",
      country: "Germany",
      region: "all",
      videoId: "",
      channelId: "UCknLrEdhRCp1aegoMqRaCZg",
      title: "DW Live",
      channelTitle: "DW News",
      score: 96,
      url: "https://www.youtube.com/@dwnews/live",
    },
    {
      id: "iss-all",
      city: "ISS Earth View",
      country: "Space",
      region: "all",
      videoId: "",
      channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
      title: "NASA Live",
      channelTitle: "NASA",
      score: 94,
      url: "https://www.youtube.com/@NASA/live",
    },
  ],
  "middle-east": [
    {
      id: "aljazeera-me",
      city: "Jerusalem",
      country: "Middle East",
      region: "middle-east",
      videoId: "",
      channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
      title: "Middle East Live Coverage",
      channelTitle: "Al Jazeera English",
      score: 100,
      url: "https://www.youtube.com/@aljazeeraenglish/live",
    },
    {
      id: "skynews-me",
      city: "Tel Aviv",
      country: "UK",
      region: "middle-east",
      videoId: "",
      channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
      title: "Breaking Live Coverage",
      channelTitle: "Sky News",
      score: 96,
      url: "https://www.youtube.com/@SkyNews/live",
    },
    {
      id: "france24-me",
      city: "Global Desk",
      country: "France",
      region: "middle-east",
      videoId: "",
      channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
      title: "International Live News",
      channelTitle: "FRANCE 24 English",
      score: 92,
      url: "https://www.youtube.com/@France24_en/live",
    },
  ],
  europe: [
    {
      id: "euronews-eu",
      city: "Europe",
      country: "EU",
      region: "europe",
      videoId: "",
      channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q",
      title: "euronews Live",
      channelTitle: "euronews",
      score: 100,
      url: "https://www.youtube.com/@euronews/live",
    },
    {
      id: "skynews-eu",
      city: "London",
      country: "UK",
      region: "europe",
      videoId: "",
      channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
      title: "Sky News Live",
      channelTitle: "Sky News",
      score: 96,
      url: "https://www.youtube.com/@SkyNews/live",
    },
    {
      id: "dw-eu",
      city: "Berlin",
      country: "Germany",
      region: "europe",
      videoId: "",
      channelId: "UCknLrEdhRCp1aegoMqRaCZg",
      title: "DW Live",
      channelTitle: "DW News",
      score: 94,
      url: "https://www.youtube.com/@dwnews/live",
    },
    {
      id: "france24-eu",
      city: "Paris",
      country: "France",
      region: "europe",
      videoId: "",
      channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
      title: "FRANCE 24 Live",
      channelTitle: "FRANCE 24 English",
      score: 92,
      url: "https://www.youtube.com/@France24_en/live",
    },
  ],
  americas: [
    {
      id: "bloomberg-us",
      city: "New York",
      country: "USA",
      region: "americas",
      videoId: "",
      channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
      title: "Bloomberg Television Live",
      channelTitle: "Bloomberg Television",
      score: 100,
      url: "https://www.youtube.com/@markets/live",
    },
    {
      id: "cnbc-us",
      city: "Markets",
      country: "USA",
      region: "americas",
      videoId: "",
      channelId: "UCrp_UI8XtuYfpiqluWLD7Lw",
      title: "CNBC Television Live",
      channelTitle: "CNBC Television",
      score: 96,
      url: "https://www.youtube.com/@CNBCTelevision/live",
    },
    {
      id: "cnn-us",
      city: "Atlanta",
      country: "USA",
      region: "americas",
      videoId: "",
      channelId: "UCupvZG-5ko_eiXAupbDfxWw",
      title: "CNN Live",
      channelTitle: "CNN",
      score: 94,
      url: "https://www.youtube.com/@CNN/live",
    },
    {
      id: "abc-us",
      city: "New York",
      country: "USA",
      region: "americas",
      videoId: "",
      channelId: "UCBi2mrWuNuyYy4gbM6fU18Q",
      title: "ABC News Live",
      channelTitle: "ABC News",
      score: 92,
      url: "https://www.youtube.com/@ABCNews/live",
    },
  ],
  asia: [
    {
      id: "cna-asia",
      city: "Singapore",
      country: "Singapore",
      region: "asia",
      videoId: "",
      channelId: "UC83jt4dlz1Gjl58fzQrrKZg",
      title: "Channel NewsAsia Live",
      channelTitle: "Channel NewsAsia",
      score: 100,
      url: "https://www.youtube.com/@channelnewsasia/live",
    },
    {
      id: "nhk-asia",
      city: "Tokyo",
      country: "Japan",
      region: "asia",
      videoId: "",
      channelId: "UCSPEjw8b0zF6xH8uC5I6B7A",
      title: "NHK WORLD-JAPAN Live",
      channelTitle: "NHK WORLD-JAPAN",
      score: 96,
      url: "https://www.youtube.com/@NHKWORLDJAPAN/live",
    },
    {
      id: "cnbc-int-asia",
      city: "Asia Markets",
      country: "Global",
      region: "asia",
      videoId: "",
      channelId: "UCmhFM1gfC6J0gbArGScsbsQ",
      title: "CNBC International Live",
      channelTitle: "CNBC International Live",
      score: 94,
      url: "https://www.youtube.com/@CNBCInternationalLive/live",
    },
    {
      id: "bloomberg-asia",
      city: "Asia Markets",
      country: "Global",
      region: "asia",
      videoId: "",
      channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
      title: "Bloomberg Television Live",
      channelTitle: "Bloomberg Television",
      score: 92,
      url: "https://www.youtube.com/@markets/live",
    },
  ],
  space: [
    {
      id: "iss-space",
      city: "ISS Earth View",
      country: "Space",
      region: "space",
      videoId: "iYmvCUonukw",
      title: "Live Video from the ISS",
      channelTitle: "NASA",
      score: 100,
      url: "https://www.youtube.com/live/iYmvCUonukw",
    },
    {
      id: "nasa-space",
      city: "NASA Live",
      country: "Space",
      region: "space",
      videoId: "",
      channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
      title: "NASA Live",
      channelTitle: "NASA",
      score: 96,
      url: "https://www.youtube.com/@NASA/live",
    },
    {
      id: "nasa-plus-space",
      city: "NASA+",
      country: "Space",
      region: "space",
      videoId: "",
      channelId: "UCtI0Hodo5o5dUb67FeUjDeA",
      title: "SpaceX Streams",
      channelTitle: "SpaceX",
      score: 92,
      url: "https://www.youtube.com/@SpaceX/live",
    },
  ],
};

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

function buildYoutubeChannelLiveEmbedUrl(channelId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  return `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&${params.toString()}`;
}

export function LiveWebcamsDashboard() {
  const [region, setRegion] = useState<WebcamRegion>("space");
  const { data, loading, error } = useLiveWebcams(region, 4);

  const feeds = data?.feeds ?? [];
  const fallbackFeeds = FALLBACK_FEEDS[region] ?? FALLBACK_FEEDS.all;
  const visibleFeeds = feeds.length > 0 ? feeds : fallbackFeeds.slice(0, 4);
  const usingFallback = !loading && feeds.length === 0 && fallbackFeeds.length > 0;
  const hasApiKey = data?.resolver?.hasApiKey ?? true;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-terminal-text">
          Live Webcams
        </h3>
        <p className="text-xs uppercase tracking-[0.18em] text-terminal-red/80">
          {visibleFeeds.length} Available
        </p>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="-mx-0.5 mb-2 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2 px-0.5">
          {REGION_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                region === item
                  ? "border-terminal-red/35 bg-terminal-red/8 text-terminal-red ring-1 ring-terminal-red/10"
                  : "border-terminal-border bg-terminal-surface/60 text-terminal-text-dim hover:bg-terminal-border/35 hover:text-terminal-text"
              }`}
            >
              {REGION_LABELS[item]}
            </button>
          ))}
          </div>
        </div>

        {loading ? (
          <p className="mb-2 text-xs text-terminal-text-dim">
            Resolving live streams...
          </p>
        ) : null}
        {error ? (
          <p className="mb-2 text-xs text-terminal-red">
            Failed to resolve live streams.
          </p>
        ) : null}
        {!hasApiKey ? (
          <p className="mb-2 text-xs text-terminal-text-dim">
            Set `YOUTUBE_API_KEY` to enable live webcam resolver.
          </p>
        ) : null}
        {usingFallback ? (
          <p className="mb-2 text-xs leading-relaxed text-terminal-text-dim">
            Live embeds are unavailable right now. Showing curated YouTube live backups for this region.
          </p>
        ) : null}

        <div className="-mx-0.5 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3 px-0.5 snap-x snap-mandatory">
          {visibleFeeds.map((feed) => (
            <article
              key={`${feed.id}-${feed.videoId}`}
              className="w-[85vw] max-w-[26rem] flex-none snap-start overflow-hidden rounded-lg border border-terminal-border bg-terminal-surface md:w-[calc(50%-0.375rem)]"
            >
              <header className="flex items-start justify-between border-b border-terminal-border px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terminal-text">
                  {feed.city}
                </p>
                <span className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">
                  {feed.country}
                </span>
              </header>
              {feed.videoId || feed.channelId ? (
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={
                      feed.videoId
                        ? buildYoutubeEmbedUrl(feed.videoId)
                        : buildYoutubeChannelLiveEmbedUrl(feed.channelId!)
                    }
                    title={`${feed.city} live webcam`}
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex aspect-video flex-col justify-between bg-terminal-bg/70 p-3">
                  <div>
                    <p className="text-sm font-medium leading-snug text-terminal-text">
                      {feed.title}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-terminal-text-muted">
                      {feed.channelTitle}
                    </p>
                  </div>
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center rounded-md border border-terminal-border px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-terminal-text transition-colors hover:bg-terminal-border/35"
                  >
                    Open YouTube Live
                  </a>
                </div>
              )}
            </article>
          ))}
          {!loading && visibleFeeds.length === 0 && hasApiKey ? (
            <p className="text-xs text-terminal-text-dim">
              No live streams available for this region.
            </p>
          ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
