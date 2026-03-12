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

  const sessionSummary = mode === "web" ? "Mic + transcript" : "Outbound call";
  const phoneNumberValue = phoneNumber.replace(/\s/g, "");
  const isPhoneNumberValid = /^\+\d{7,15}$/.test(phoneNumberValue);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-terminal-border bg-terminal-surface">
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
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(24rem,0.9fr)] xl:items-start">
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

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-terminal-border bg-terminal-surface/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Session Mode</p>
              <p className="mt-1 text-sm text-terminal-text">{mode === "web" ? "Browser" : "Phone"}</p>
            </div>
            <div className="rounded-lg border border-terminal-border bg-terminal-surface/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Transport</p>
              <p className="mt-1 text-sm text-terminal-text">{sessionSummary}</p>
            </div>
            <div className="rounded-lg border border-terminal-border bg-terminal-surface/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-terminal-text-muted">Dock</p>
              <p className="mt-1 text-sm text-terminal-text">Bottom-right fixed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-terminal-border px-4 py-3">
        <div className="grid rounded-lg border border-terminal-border bg-terminal-bg/70 p-1 sm:inline-flex sm:grid-cols-none">
          <button
            type="button"
            onClick={() => canSwitchMode && setMode("web")}
            disabled={!canSwitchMode}
            className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors sm:min-w-44 ${
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
            className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors sm:min-w-44 ${
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

      <div className="min-h-0 flex-1 px-4 py-4">
        {mode === "web" ? (
          <div className="grid h-full gap-4 xl:grid-cols-[minmax(19rem,0.9fr)_minmax(0,1.3fr)]">
            <div className="flex min-h-[18rem] flex-col rounded-xl border border-terminal-border bg-terminal-surface/70 p-5">
              {web.messages.length === 0 && isWebIdle ? (
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-terminal-green/20 bg-terminal-green/5 px-3 py-1">
                      <Globe size={16} className="text-terminal-green" />
                      <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Web Session Ready</p>
                    </div>
                    <p className="mt-5 max-w-sm text-3xl leading-tight text-terminal-text">Start a browser call and stream the transcript live.</p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-terminal-text-dim">
                      Use your mic in-browser, talk naturally, and monitor both sides of the conversation without leaving the dashboard.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-terminal-border bg-terminal-bg/50 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Input</p>
                      <p className="mt-2 text-sm text-terminal-text">Browser mic</p>
                    </div>
                    <div className="rounded-lg border border-terminal-border bg-terminal-bg/50 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">View</p>
                      <p className="mt-2 text-sm text-terminal-text">Live transcript</p>
                    </div>
                    <div className="rounded-lg border border-terminal-border bg-terminal-bg/50 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Latency</p>
                      <p className="mt-2 text-sm text-terminal-text">Realtime session</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {web.messages.length === 0 && isWebConnecting ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-terminal-amber/30 bg-terminal-amber/10">
                    <PhoneCall size={20} className="animate-pulse text-terminal-amber" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Establishing session</p>
                    <p className="mt-2 animate-pulse text-sm uppercase tracking-[0.18em] text-terminal-amber">Connecting to voice agent...</p>
                  </div>
                </div>
              ) : null}

              {web.messages.length > 0 ? (
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-terminal-green/20 bg-terminal-green/5 px-3 py-1">
                      <Globe size={16} className="text-terminal-green" />
                      <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Web Session Live</p>
                    </div>
                    <p className="mt-5 text-3xl leading-tight text-terminal-text">Voice agent connected.</p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-terminal-text-dim">
                      Keep speaking naturally while the transcript stream updates in real time.
                    </p>
                  </div>

                  <div className="rounded-lg border border-terminal-border bg-terminal-bg/50 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Conversation State</p>
                    <p className="mt-2 text-sm text-terminal-text">Live transcript active. Use mute or end call from the control bar below.</p>
                  </div>
                </div>
              ) : null}
            </div>

            {web.messages.length > 0 ? (
              <div className="flex min-h-[18rem] flex-col rounded-xl border border-terminal-border bg-terminal-bg/55 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Live Transcript</p>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">
                    {web.messages.length} messages
                  </span>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1">
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
            ) : (
              <div className="flex min-h-[18rem] flex-col justify-between rounded-xl border border-terminal-border bg-terminal-bg/55 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Live Transcript</p>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Awaiting session</span>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-terminal-border bg-terminal-surface/70">
                    <Mic size={18} className={isWebConnecting ? "text-terminal-amber" : "text-terminal-text-muted"} />
                  </div>
                  <p className="mt-5 text-lg text-terminal-text">
                    {isWebConnecting ? "Connecting session..." : "Transcript panel is standing by."}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-terminal-text-dim">
                    {isWebConnecting
                      ? "The browser session is being established. Transcript messages will appear here as soon as audio is flowing."
                      : "Start the web call to see the conversation, speaker turns, and status updates here."}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
            <div className="rounded-xl border border-terminal-border bg-terminal-surface/70 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-terminal-cyan/20 bg-terminal-cyan/5 px-3 py-1">
                <PhoneCall size={16} className="text-terminal-cyan" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Phone Session</p>
              </div>

              <p className="mt-5 text-3xl leading-tight text-terminal-text">Start an outbound call.</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-terminal-text-dim">
                Enter a phone number in E.164 format and trigger the Vapi assistant from this panel.
              </p>

              <div className="mt-6 rounded-lg border border-terminal-border bg-terminal-bg/65 p-4">
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

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-terminal-border bg-terminal-bg/50 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Validation</p>
                  <p className={`mt-2 text-sm ${isPhoneNumberValid ? "text-terminal-cyan" : "text-terminal-text-dim"}`}>
                    {isPhoneNumberValid ? "E.164 format looks valid" : "Enter `+` and country code"}
                  </p>
                </div>
                <div className="rounded-lg border border-terminal-border bg-terminal-bg/50 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Call Route</p>
                  <p className="mt-2 text-sm text-terminal-text">Vapi outbound phone</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-terminal-border bg-terminal-bg/60 p-4">
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-terminal-text-muted">Call Status</p>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      phone.status === "initiated"
                        ? "border-terminal-green/30 bg-terminal-green/10 text-terminal-green"
                        : phone.status === "calling"
                          ? "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber"
                          : "border-terminal-border bg-terminal-surface/70 text-terminal-text-muted"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        phone.status === "initiated"
                          ? "bg-terminal-green"
                          : phone.status === "calling"
                            ? "bg-terminal-amber"
                            : "bg-terminal-text-muted"
                      }`}
                    />
                    {phone.status}
                  </span>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-terminal-border bg-terminal-surface/40 px-4 text-center">
                {phone.status === "idle" ? (
                  <>
                    <Phone size={28} className="text-terminal-text-muted" />
                    <p className="text-sm text-terminal-text-dim">Ready to place an outbound call.</p>
                  </>
                ) : phone.status === "calling" ? (
                  <>
                    <PhoneCall size={28} className="animate-pulse text-terminal-amber" />
                    <p className="text-sm text-terminal-amber">Initiating call to {phoneNumberValue}...</p>
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

                <div className="rounded-lg border border-terminal-border bg-terminal-bg/45 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-text-muted">Note</p>
                  <p className="mt-2 text-sm leading-6 text-terminal-text-dim">
                    This flow triggers the backend endpoint, which then creates the outbound Vapi phone call.
                  </p>
                </div>
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
            onClick={() => void phone.call(phoneNumberValue)}
            disabled={!isPhoneNumberValid}
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
