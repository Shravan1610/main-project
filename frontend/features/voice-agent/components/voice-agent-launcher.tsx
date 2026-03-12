"use client";

import { Globe, Mic, MicOff, Phone, PhoneCall, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { usePhoneCall, useVapiCall } from "../hooks";
import type { VapiCallMode } from "../types";

const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

export function VapiVoiceAgent() {
  const [mode, setMode] = useState<VapiCallMode>("web");
  const [phoneNumber, setPhoneNumber] = useState("");

  const web = useVapiCall(ASSISTANT_ID);
  const phone = usePhoneCall();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [web.messages]);

  const isWebIdle = web.status === "idle";
  const isWebConnecting = web.status === "connecting";
  const isWebActive = web.status === "active";
  const isWebEnding = web.status === "ending";
  const isWebBusy = isWebConnecting || isWebActive || isWebEnding;

  const isPhoneBusy = phone.status === "calling";
  const canSwitchMode = !isWebBusy && !isPhoneBusy && phone.status !== "initiated";
  const isWebConfigured = web.hasKey && Boolean(ASSISTANT_ID);

  const displayStatus =
    mode === "web"
      ? web.status
      : phone.status === "calling"
        ? "calling"
        : phone.status === "initiated"
          ? "initiated"
          : "idle";

  const statusTone =
    displayStatus === "active" || displayStatus === "initiated"
      ? "border-terminal-green/30 bg-terminal-green/10 text-terminal-green"
      : displayStatus === "connecting" || displayStatus === "calling"
        ? "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber"
        : "border-terminal-border bg-terminal-bg/70 text-terminal-text-muted";

  const dotTone =
    displayStatus === "active" || displayStatus === "initiated"
      ? "bg-terminal-green"
      : displayStatus === "connecting" || displayStatus === "calling"
        ? "bg-terminal-amber"
        : "bg-terminal-text-muted";

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-terminal-border bg-terminal-surface">
      <div className="flex items-center justify-between border-b border-terminal-border bg-[#121212] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-terminal-text-muted">voice.console</p>
        <div className="w-12" />
      </div>

      <div className="border-b border-terminal-border px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-terminal-green" />
              <h3 className="text-sm font-semibold tracking-[0.16em] text-terminal-text">VOICE AGENT</h3>
              <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusTone}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dotTone} ${displayStatus !== "idle" ? "animate-pulse" : ""}`} />
                {displayStatus}
              </span>
            </div>
            <p className="max-w-xl text-sm text-terminal-text-dim">Start a browser or phone call.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-terminal-border bg-terminal-surface/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Session Mode</p>
              <p className="mt-1 text-sm text-terminal-text">{mode === "web" ? "Browser" : "Phone"}</p>
            </div>
            <div className="rounded-lg border border-terminal-border bg-terminal-surface/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Transport</p>
              <p className="mt-1 text-sm text-terminal-text">{mode === "web" ? "Mic + transcript" : "Outbound call"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-terminal-border px-4 py-3">
        <div className="inline-flex rounded-lg border border-terminal-border bg-terminal-bg/70 p-1">
          <button
            type="button"
            onClick={() => canSwitchMode && setMode("web")}
            disabled={!canSwitchMode}
            className={`inline-flex min-w-44 items-center justify-center gap-2 rounded-md px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
              mode === "web"
                ? "bg-terminal-green/10 text-terminal-green shadow-[inset_0_-2px_0_rgba(167,243,208,0.5)]"
                : "text-terminal-text-muted hover:text-terminal-text"
            } disabled:opacity-50`}
          >
            <Globe size={12} />
            Web Call
          </button>
          <button
            type="button"
            onClick={() => canSwitchMode && setMode("phone")}
            disabled={!canSwitchMode}
            className={`inline-flex min-w-44 items-center justify-center gap-2 rounded-md px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
              mode === "phone"
                ? "bg-terminal-cyan/10 text-terminal-cyan shadow-[inset_0_-2px_0_rgba(103,232,249,0.5)]"
                : "text-terminal-text-muted hover:text-terminal-text"
            } disabled:opacity-50`}
          >
            <PhoneCall size={12} />
            Phone Call
          </button>
        </div>
      </div>

      {mode === "web" && !isWebConfigured ? (
        <div className="border-b border-terminal-border px-4 py-3">
          <p className="text-xs text-terminal-amber">
            Voice agent is not configured yet. Please set the required API keys in your environment to enable this feature.
          </p>
        </div>
      ) : null}

      {mode === "web" && isWebActive ? (
        <div className="border-b border-terminal-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Input Level</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-terminal-border">
              <div
                className="h-full rounded-full bg-terminal-green transition-all duration-100"
                style={{ width: `${Math.min(web.volumeLevel * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-105 px-4 py-4">
        {mode === "web" ? (
          <div className="flex h-full flex-col">
            {web.messages.length === 0 && isWebIdle ? (
              <div className="flex flex-1">
                <div className="rounded-xl border border-terminal-border bg-terminal-surface/70 p-5">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-terminal-green" />
                    <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Web Session Ready</p>
                  </div>
                  <p className="mt-4 text-2xl leading-tight text-terminal-text">Start a browser call.</p>
                </div>
              </div>
            ) : null}

            {web.messages.length === 0 && isWebConnecting ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-terminal-border bg-terminal-surface/70">
                <p className="animate-pulse text-xs uppercase tracking-[0.18em] text-terminal-amber">
                  Connecting to voice agent...
                </p>
              </div>
            ) : null}

            {web.messages.length > 0 ? (
              <div className="flex-1 rounded-xl border border-terminal-border bg-terminal-bg/55 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Live Transcript</p>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">
                    {web.messages.length} messages
                  </span>
                </div>

                <div className="space-y-2">
                  {web.messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-lg border px-3 py-2 text-xs ${
                          message.role === "user"
                            ? "border-terminal-cyan/30 bg-terminal-cyan/8 text-terminal-cyan"
                            : "border-terminal-green/20 bg-terminal-green/8 text-terminal-text"
                        }`}
                      >
                        <span className="mb-1 block text-[9px] uppercase tracking-[0.18em] opacity-60">
                          {message.role}
                        </span>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid h-full gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-xl border border-terminal-border bg-terminal-surface/70 p-5">
              <div className="flex items-center gap-2">
                <PhoneCall size={18} className="text-terminal-cyan" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Phone Session</p>
              </div>

              <p className="mt-4 text-2xl leading-tight text-terminal-text">Start an outbound call.</p>
              <p className="mt-3 text-sm text-terminal-text-dim">Enter a phone number in E.164 format.</p>

              <div className="mt-5 rounded-lg border border-terminal-border bg-terminal-bg/65 p-4">
                <label className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+1 234 567 8900"
                  className="mt-2 w-full rounded border border-terminal-border bg-terminal-surface px-3 py-2 text-sm text-terminal-text placeholder:text-terminal-text-muted/50 focus:border-terminal-cyan focus:outline-none"
                />
                <p className="mt-2 text-[10px] text-terminal-text-muted">Include country code.</p>
              </div>
            </div>

            <div className="rounded-xl border border-terminal-border bg-terminal-bg/60 p-4">
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                {phone.status === "idle" ? (
                  <>
                    <Phone size={28} className="text-terminal-text-muted" />
                    <p className="text-sm text-terminal-text-dim">Ready.</p>
                  </>
                ) : phone.status === "calling" ? (
                  <>
                    <PhoneCall size={28} className="animate-pulse text-terminal-amber" />
                    <p className="text-sm text-terminal-amber">Initiating call to {phoneNumber}...</p>
                  </>
                ) : (
                  <>
                    <Phone size={28} className="text-terminal-green" />
                    <p className="text-sm text-terminal-green">Call initiated. The destination phone should ring shortly.</p>
                    {phone.callId ? (
                      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">
                        Call ID: <span className="font-mono">{phone.callId}</span>
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {(mode === "web" ? web.error : phone.error) ? (
        <div className="border-t border-terminal-border px-4 py-3">
          <p className="text-xs text-terminal-red">{mode === "web" ? web.error : phone.error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-terminal-border bg-terminal-bg/50 px-4 py-3">
        {mode === "web" ? (
          isWebIdle ? (
            <button
              type="button"
              onClick={() => void web.startCall()}
              disabled={!isWebConfigured}
              className="inline-flex items-center gap-2 rounded-full border border-terminal-green/35 bg-terminal-green/10 px-5 py-2 text-xs uppercase tracking-[0.16em] text-terminal-green transition hover:bg-terminal-green/18 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Globe size={14} />
              Start Web Call
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={web.toggleMute}
                disabled={!isWebActive}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  web.isMuted
                    ? "border-terminal-red/35 bg-terminal-red/10 text-terminal-red"
                    : "border-terminal-border bg-terminal-surface text-terminal-text hover:bg-terminal-border/40"
                }`}
                aria-label={web.isMuted ? "Unmute" : "Mute"}
              >
                {web.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              <button
                type="button"
                onClick={web.endCall}
                disabled={isWebEnding}
                className="inline-flex items-center gap-2 rounded-full border border-terminal-red/35 bg-terminal-red/10 px-5 py-2 text-xs uppercase tracking-[0.16em] text-terminal-red transition hover:bg-terminal-red/18 disabled:opacity-50"
              >
                <PhoneOff size={14} />
                {isWebEnding ? "Ending..." : "End Call"}
              </button>
            </>
          )
        ) : phone.status === "idle" ? (
          <button
            type="button"
            onClick={() => void phone.call(phoneNumber.replace(/\s/g, ""))}
            disabled={!phoneNumber.replace(/\s/g, "").match(/^\+\d{7,15}$/)}
            className="inline-flex items-center gap-2 rounded-full border border-terminal-cyan/35 bg-terminal-cyan/10 px-5 py-2 text-xs uppercase tracking-[0.16em] text-terminal-cyan transition hover:bg-terminal-cyan/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PhoneCall size={14} />
            Call My Phone
          </button>
        ) : phone.status === "calling" ? (
          <span className="animate-pulse text-xs uppercase tracking-[0.16em] text-terminal-amber">Placing call...</span>
        ) : (
          <button
            type="button"
            onClick={phone.reset}
            className="inline-flex items-center gap-2 rounded-full border border-terminal-border bg-terminal-surface px-5 py-2 text-xs uppercase tracking-[0.16em] text-terminal-text transition hover:bg-terminal-border/40"
          >
            New Call
          </button>
        )}
      </div>
    </div>
  );
}
