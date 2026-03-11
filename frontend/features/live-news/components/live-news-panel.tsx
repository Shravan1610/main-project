"use client";

import { useState } from "react";

type LiveNewsChannel = {
  id: string;
  label: string;
  channelTitle: string;
  channelId?: string;
  liveUrl: string;
};

const CHANNELS: LiveNewsChannel[] = [
  {
    id: "bloomberg",
    label: "Bloomberg",
    channelTitle: "Bloomberg Television",
    channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
    liveUrl: "https://www.youtube.com/@markets/live",
  },
  {
    id: "skynews",
    label: "SkyNews",
    channelTitle: "Sky News",
    channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
    liveUrl: "https://www.youtube.com/@SkyNews/live",
  },
  {
    id: "euronews",
    label: "Euronews",
    channelTitle: "euronews",
    channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q",
    liveUrl: "https://www.youtube.com/@euronews/live",
  },
  {
    id: "dw",
    label: "DW",
    channelTitle: "DW News",
    channelId: "UCknLrEdhRCp1aegoMqRaCZg",
    liveUrl: "https://www.youtube.com/@dwnews/live",
  },
  {
    id: "cnbc",
    label: "CNBC",
    channelTitle: "CNBC Television",
    channelId: "UCrp_UI8XtuYfpiqluWLD7Lw",
    liveUrl: "https://www.youtube.com/@CNBCTelevision/live",
  },
  {
    id: "cnn",
    label: "CNN",
    channelTitle: "CNN",
    channelId: "UCupvZG-5ko_eiXAupbDfxWw",
    liveUrl: "https://www.youtube.com/@CNN/live",
  },
  {
    id: "france24",
    label: "France 24",
    channelTitle: "FRANCE 24 English",
    channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
    liveUrl: "https://www.youtube.com/@France24_en/live",
  },
  {
    id: "alarabiya",
    label: "AlArabiya",
    channelTitle: "Al Arabiya English",
    liveUrl: "https://www.youtube.com/@AlArabiyaEnglish/live",
  },
  {
    id: "aljazeera",
    label: "AlJazeera",
    channelTitle: "Al Jazeera English",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    liveUrl: "https://www.youtube.com/@aljazeeraenglish/live",
  },
];

function buildLiveEmbedUrl(channelId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });

  return `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&${params.toString()}`;
}

export function LiveNewsPanel() {
  const [activeChannelId, setActiveChannelId] = useState(CHANNELS[0].id);
  const activeChannel =
    CHANNELS.find((channel) => channel.id === activeChannelId) ?? CHANNELS[0];

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-terminal-text">
          Live News
        </h3>
        <p className="text-xs uppercase tracking-[0.18em] text-terminal-red/80">
          YouTube Live
        </p>
      </div>

      <div className="rounded-xl border border-terminal-border bg-terminal-bg/50 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="mb-2 flex flex-wrap gap-2">
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => setActiveChannelId(channel.id)}
              className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                activeChannel.id === channel.id
                  ? "border-terminal-red/35 bg-terminal-red/8 text-terminal-red ring-1 ring-terminal-red/10"
                  : "border-terminal-border bg-terminal-surface/60 text-terminal-text-dim hover:bg-terminal-border/35 hover:text-terminal-text"
              }`}
            >
              {channel.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-terminal-border bg-terminal-surface">
          {activeChannel.channelId ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={buildLiveEmbedUrl(activeChannel.channelId)}
                title={`${activeChannel.channelTitle} live stream`}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col justify-between bg-terminal-bg/70 p-4">
              <div>
                <p className="text-base font-semibold tracking-wide text-terminal-text">
                  {activeChannel.channelTitle}
                </p>
                <p className="mt-2 max-w-md text-sm text-terminal-text-dim">
                  Official YouTube live stream.
                </p>
              </div>
              <a
                href={activeChannel.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-md border border-terminal-border px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-terminal-text transition-colors hover:bg-terminal-border/35"
              >
                Open on YouTube
              </a>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-terminal-border bg-terminal-bg/80 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-muted">
                Active Channel
              </p>
              <p className="mt-0.5 text-xs text-terminal-text">
                {activeChannel.channelTitle}
              </p>
            </div>
            <a
              href={activeChannel.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] uppercase tracking-[0.16em] text-terminal-text-dim transition-colors hover:text-terminal-text"
            >
              Open Source
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
