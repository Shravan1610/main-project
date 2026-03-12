"use client";

import { useState } from "react";
import { MacWindow } from "@/shared/components/mac-window";

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
const PLAYABLE_CHANNELS = CHANNELS.filter((channel) => channel.channelId);

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
  const [activeChannelId, setActiveChannelId] = useState(PLAYABLE_CHANNELS[0].id);
  const activeChannel =
    PLAYABLE_CHANNELS.find((channel) => channel.id === activeChannelId) ?? PLAYABLE_CHANNELS[0];

  return (
    <MacWindow
      title="Live News"
      rightSlot={<span className="text-terminal-red/80">Live</span>}
    >
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

        <div className="overflow-x-auto border-t border-terminal-border bg-terminal-bg/80 px-2.5 py-2">
          <div className="flex min-w-max gap-2">
            {PLAYABLE_CHANNELS.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
                className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                  activeChannel.id === channel.id
                    ? "border-terminal-red/35 bg-terminal-red/8 text-terminal-red ring-1 ring-terminal-red/10"
                    : "border-terminal-border bg-terminal-surface/60 text-terminal-text-dim hover:bg-terminal-border/35 hover:text-terminal-text"
                }`}
              >
                {channel.label}
              </button>
            ))}
          </div>
        </div>
    </MacWindow>
  );
}
