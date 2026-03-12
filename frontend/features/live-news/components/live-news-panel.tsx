"use client";

import { useState } from "react";
import { MacWindow } from "@/shared/components/mac-window";

import { useLiveNews } from "../hooks";
import type { LiveNewsChannel } from "../types";

/** Hardcoded fallback so the panel renders immediately before API responds */
const FALLBACK_CHANNELS: LiveNewsChannel[] = [
  { id: "bloomberg", label: "Bloomberg", channelId: "UCIALMKvObZNtJ6AmdCLP7Lg", channelTitle: "Bloomberg Television", videoId: null, liveUrl: "https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live" },
  { id: "skynews", label: "SkyNews", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", channelTitle: "Sky News", videoId: null, liveUrl: "https://www.youtube.com/channel/UCoMdktPbSTixAyNGwb-UYkQ/live" },
  { id: "euronews", label: "Euronews", channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q", channelTitle: "euronews", videoId: null, liveUrl: "https://www.youtube.com/channel/UCSrZ3UV4jOidv8ppoVuvW9Q/live" },
  { id: "dw", label: "DW", channelId: "UCknLrEdhRCp1aegoMqRaCZg", channelTitle: "DW News", videoId: null, liveUrl: "https://www.youtube.com/channel/UCknLrEdhRCp1aegoMqRaCZg/live" },
  { id: "cnbc", label: "CNBC", channelId: "UCrp_UI8XtuYfpiqluWLD7Lw", channelTitle: "CNBC Television", videoId: null, liveUrl: "https://www.youtube.com/channel/UCrp_UI8XtuYfpiqluWLD7Lw/live" },
  { id: "cnn", label: "CNN", channelId: "UCupvZG-5ko_eiXAupbDfxWw", channelTitle: "CNN", videoId: null, liveUrl: "https://www.youtube.com/channel/UCupvZG-5ko_eiXAupbDfxWw/live" },
  { id: "france24", label: "France 24", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", channelTitle: "FRANCE 24 English", videoId: null, liveUrl: "https://www.youtube.com/channel/UCQfwfsi5VrQ8yKZ-UWmAEFg/live" },
  { id: "alarabiya", label: "AlArabiya", channelId: "UCLmAUr6t2ScKbXMRIFnfkfQ", channelTitle: "Al Arabiya English", videoId: null, liveUrl: "https://www.youtube.com/channel/UCLmAUr6t2ScKbXMRIFnfkfQ/live" },
  { id: "aljazeera", label: "AlJazeera", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", channelTitle: "Al Jazeera English", videoId: null, liveUrl: "https://www.youtube.com/channel/UCNye-wNBqNL5ZzHSJj3l8Bg/live" },
];

function buildVideoEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function buildChannelLiveEmbedUrl(channelId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  });

  return `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&${params.toString()}`;
}

export function LiveNewsPanel() {
  const { data, loading } = useLiveNews();
  const channels: LiveNewsChannel[] =
    data && data.channels.length > 0 ? data.channels : FALLBACK_CHANNELS;

  const [activeChannelId, setActiveChannelId] = useState(channels[0]?.id ?? "bloomberg");
  const activeChannel =
    channels.find((ch) => ch.id === activeChannelId) ?? channels[0];
  const activeStreamUrl = activeChannel?.videoId
    ? buildVideoEmbedUrl(activeChannel.videoId)
    : activeChannel?.channelId
      ? buildChannelLiveEmbedUrl(activeChannel.channelId)
      : null;

  return (
    <MacWindow
      title="Live News"
      className="h-full flex flex-col"
      bodyClassName="flex min-h-0 flex-col"
      rightSlot={<span className="text-terminal-red/80">Live</span>}
    >
      <div className="flex flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 min-h-0 items-center justify-center bg-black">
            <p className="text-xs text-terminal-text-dim">Resolving live streams…</p>
          </div>
        ) : activeStreamUrl ? (
          <div className="relative flex-1 min-h-0 bg-black">
            <iframe
              key={activeStreamUrl}
              className="absolute inset-0 h-full w-full"
              src={activeStreamUrl}
              title={`${activeChannel.channelTitle} live stream`}
              loading="eager"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col justify-between bg-terminal-bg/70 p-4">
            <div>
              <p className="text-base font-semibold tracking-wide text-terminal-text">
                {activeChannel?.channelTitle ?? "Live Stream"}
              </p>
              <p className="mt-2 max-w-md text-sm text-terminal-text-dim">
                This channel is not streaming live right now.
              </p>
            </div>
            <a
              href={activeChannel?.liveUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center rounded-md border border-terminal-border px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-terminal-text transition-colors hover:bg-terminal-border/35"
            >
              Open on YouTube
            </a>
          </div>
        )}

        <div className="shrink-0 overflow-x-auto border-t border-terminal-border bg-terminal-bg/80 px-2.5 py-2">
          <div className="flex min-w-max gap-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
                className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                  activeChannel?.id === channel.id
                    ? "border-terminal-red/35 bg-terminal-red/8 text-terminal-red ring-1 ring-terminal-red/10"
                    : "border-terminal-border bg-terminal-surface/60 text-terminal-text-dim hover:bg-terminal-border/35 hover:text-terminal-text"
                }`}
              >
                {channel.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </MacWindow>
  );
}
