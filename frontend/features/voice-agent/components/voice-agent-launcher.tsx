"use client";

import { Globe, Mic, MicOff, Phone, PhoneCall, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useVapiCall, usePhoneCall } from "../hooks";
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

  // Derive display status for header badge
  const displayStatus =
    mode === "web"
      ? web.status
      : phone.status === "calling"
        ? "calling"
        : phone.status === "initiated"
          ? "initiated"
          : "idle";

  const statusColor =
    displayStatus === "active" || displayStatus === "initiated"
      ? "text-terminal-green"
      : displayStatus === "connecting" || displayStatus === "calling"
        ? "text-terminal-amber"
        : "text-terminal-text-muted";

  const dotColor =
    displayStatus === "active" || displayStatus === "initiated"
      ? "bg-terminal-green animate-pulse"
      : displayStatus === "connecting" || displayStatus === "calling"
        ? "bg-terminal-amber animate-pulse"
        : "bg-terminal-text-muted";

  const canSwitchMode = !isWebBusy && !isPhoneBusy && phone.status !== "initiated";

  return (
    <div className="flex h-full flex-col rounded border border-terminal-border bg-terminal-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-terminal-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-terminal-green" />
          <h3 className="text-sm font-semibold tracking-wide text-terminal-text">
            AI VOICE AGENT
          </h3>
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${statusColor}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            {displayStatus}
          </span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex border-b border-terminal-border">
        <button
          type="button"
          onClick={() => canSwitchMode && setMode("web")}
          disabled={!canSwitchMode}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors ${
            mode === "web"
              ? "border-b-2 border-terminal-green bg-terminal-green/5 text-terminal-green"
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
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors ${
            mode === "phone"
              ? "border-b-2 border-terminal-cyan bg-terminal-cyan/5 text-terminal-cyan"
              : "text-terminal-text-muted hover:text-terminal-text"
          } disabled:opacity-50`}
        >
          <PhoneCall size={12} />
          Phone Call
        </button>
      </div>

      {/* Missing config warning */}
      {mode === "web" && !web.hasKey ? (
        <div className="px-4 py-3">
          <p className="text-xs text-terminal-amber">
            Set <code className="rounded bg-terminal-bg px-1 text-[10px]">NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> and{" "}
            <code className="rounded bg-terminal-bg px-1 text-[10px]">NEXT_PUBLIC_VAPI_ASSISTANT_ID</code> in{" "}
            <code className="rounded bg-terminal-bg px-1 text-[10px]">.env.local</code> to enable web calls.
          </p>
        </div>
      ) : null}

      {/* Volume indicator (web mode only) */}
      {mode === "web" && isWebActive ? (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-terminal-text-muted">Vol</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-terminal-border">
              <div
                className="h-full rounded-full bg-terminal-green transition-all duration-100"
                style={{ width: `${Math.min(web.volumeLevel * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {mode === "web" ? (
          /* ─── Web call transcript ─── */
          <>
            {web.messages.length === 0 && isWebIdle ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Globe size={28} className="text-terminal-text-muted" />
                <p className="text-xs text-terminal-text-muted">
                  {web.hasKey
                    ? "Start a browser voice call with the AI financial analyst."
                    : "Configure VAPI keys to begin."}
                </p>
              </div>
            ) : null}

            {web.messages.length === 0 && isWebConnecting ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-terminal-amber animate-pulse">Connecting to voice agent…</p>
              </div>
            ) : null}

            <div className="space-y-2">
              {web.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === "user"
                        ? "bg-terminal-cyan/15 text-terminal-cyan"
                        : "bg-terminal-green/10 text-terminal-text"
                    }`}
                  >
                    <span className="mb-0.5 block text-[9px] uppercase tracking-wider opacity-60">
                      {msg.role}
                    </span>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          /* ─── Phone call UI ─── */
          <div className="flex h-full flex-col items-center justify-center gap-4">
            {phone.status === "idle" ? (
              <>
                <PhoneCall size={28} className="text-terminal-text-muted" />
                <p className="text-center text-xs text-terminal-text-muted">
                  Enter a phone number to receive a call from the AI analyst.
                </p>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full max-w-[260px] rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-center text-sm text-terminal-text placeholder:text-terminal-text-muted/50 focus:border-terminal-cyan focus:outline-none"
                />
                <p className="text-[10px] text-terminal-text-muted">
                  Include country code (e.g. +1, +61, +64)
                </p>
              </>
            ) : phone.status === "calling" ? (
              <>
                <PhoneCall size={28} className="text-terminal-amber animate-pulse" />
                <p className="text-xs text-terminal-amber animate-pulse">
                  Initiating call to {phoneNumber}…
                </p>
              </>
            ) : (
              /* initiated */
              <>
                <Phone size={28} className="text-terminal-green" />
                <p className="text-xs text-terminal-green">
                  Call initiated! Your phone will ring shortly.
                </p>
                {phone.callId ? (
                  <p className="text-[10px] text-terminal-text-muted">
                    Call ID: <span className="font-mono">{phone.callId}</span>
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {(mode === "web" ? web.error : phone.error) ? (
        <div className="border-t border-terminal-border px-4 py-2">
          <p className="text-xs text-terminal-red">{mode === "web" ? web.error : phone.error}</p>
        </div>
      ) : null}

      {/* Call controls */}
      <div className="flex items-center justify-center gap-3 border-t border-terminal-border px-4 py-3">
        {mode === "web" ? (
          /* ─── Web call controls ─── */
          isWebIdle ? (
            <button
              type="button"
              onClick={() => void web.startCall()}
              disabled={!web.hasKey || !ASSISTANT_ID}
              className="inline-flex items-center gap-2 rounded-full border border-terminal-green/40 bg-terminal-green/10 px-5 py-2 text-xs font-medium text-terminal-green transition-colors hover:bg-terminal-green/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  web.isMuted
                    ? "border-terminal-red/40 bg-terminal-red/10 text-terminal-red"
                    : "border-terminal-border bg-terminal-bg/60 text-terminal-text hover:bg-terminal-border/40"
                }`}
                aria-label={web.isMuted ? "Unmute" : "Mute"}
              >
                {web.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              <button
                type="button"
                onClick={web.endCall}
                disabled={isWebEnding}
                className="inline-flex items-center gap-2 rounded-full border border-terminal-red/40 bg-terminal-red/10 px-5 py-2 text-xs font-medium text-terminal-red transition-colors hover:bg-terminal-red/20 disabled:opacity-50"
              >
                <PhoneOff size={14} />
                {isWebEnding ? "Ending…" : "End Call"}
              </button>
            </>
          )
        ) : (
          /* ─── Phone call controls ─── */
          phone.status === "idle" ? (
            <button
              type="button"
              onClick={() => void phone.call(phoneNumber.replace(/\s/g, ""))}
              disabled={!phoneNumber.replace(/\s/g, "").match(/^\+\d{7,15}$/)}
              className="inline-flex items-center gap-2 rounded-full border border-terminal-cyan/40 bg-terminal-cyan/10 px-5 py-2 text-xs font-medium text-terminal-cyan transition-colors hover:bg-terminal-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PhoneCall size={14} />
              Call My Phone
            </button>
          ) : phone.status === "calling" ? (
            <span className="text-xs text-terminal-amber animate-pulse">Placing call…</span>
          ) : (
            <button
              type="button"
              onClick={phone.reset}
              className="inline-flex items-center gap-2 rounded-full border border-terminal-border bg-terminal-bg/60 px-5 py-2 text-xs font-medium text-terminal-text transition-colors hover:bg-terminal-border/40"
            >
              New Call
            </button>
          )
        )}
      </div>
    </div>
  );
}
