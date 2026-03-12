"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import type { VapiCallStatus, VapiMessage } from "../types";
import { initiatePhoneCall } from "../services";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";

export function useVapiCall(assistantId: string) {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<VapiCallStatus>("idle");
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize Vapi instance once
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) return;
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("active");
      setError(null);
    });

    vapi.on("call-end", () => {
      setStatus("idle");
      setVolumeLevel(0);
    });

    vapi.on("message", (msg: Record<string, unknown>) => {
      if (msg.type === "transcript" && typeof msg.transcript === "string") {
        const role = msg.role === "assistant" ? "assistant" : "user";
        setMessages((prev) => [
          ...prev,
          {
            role,
            content: msg.transcript as string,
            timestamp: Date.now(),
          },
        ]);
      }

      if (msg.type === "conversation-update" && Array.isArray(msg.conversation)) {
        const conversation = msg.conversation as Array<{ role: string; content: string }>;
        setMessages(
          conversation
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: Date.now(),
            })),
        );
      }
    });

    vapi.on("volume-level", (level: number) => {
      setVolumeLevel(level);
    });

    vapi.on("error", (err: { message?: string }) => {
      setError(err?.message ?? "Voice call error");
      setStatus("idle");
    });

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!VAPI_PUBLIC_KEY) {
      setError("VAPI public key not configured (NEXT_PUBLIC_VAPI_PUBLIC_KEY).");
      return;
    }
    if (!assistantId) {
      setError("No assistant ID provided.");
      return;
    }
    if (!vapiRef.current || status === "connecting" || status === "active") return;

    setStatus("connecting");
    setError(null);
    setMessages([]);

    try {
      await vapiRef.current.start(assistantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call");
      setStatus("idle");
    }
  }, [assistantId, status]);

  const endCall = useCallback(() => {
    if (!vapiRef.current) return;
    setStatus("ending");
    vapiRef.current.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  return {
    status,
    messages,
    isMuted,
    volumeLevel,
    error,
    startCall,
    endCall,
    toggleMute,
    hasKey: Boolean(VAPI_PUBLIC_KEY),
  };
}

export function usePhoneCall() {
  const [status, setStatus] = useState<"idle" | "calling" | "initiated">("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (phoneNumber: string) => {
    setStatus("calling");
    setError(null);
    setCallId(null);

    try {
      const result = await initiatePhoneCall(phoneNumber);
      setCallId(result.callId);
      setStatus("initiated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phone call failed");
      setStatus("idle");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setCallId(null);
    setError(null);
  }, []);

  return { status, callId, error, call, reset };
}
