"use client";

import { Mic, Square, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useVoiceTools } from "../hooks";
import { transcribeVoiceAudio } from "../services";

export function VoiceAgentLauncher() {
  const { data, loading, error } = useVoiceTools(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [suggestedTools, setSuggestedTools] = useState<string[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!data?.tools?.length) {
      return;
    }
    if (activeTools.length > 0) {
      return;
    }
    setActiveTools(data.tools.map((tool) => tool.id));
  }, [activeTools.length, data?.tools]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const suggestionsText = useMemo(() => {
    if (suggestedTools.length === 0) {
      return "";
    }
    return suggestedTools.join(", ");
  }, [suggestedTools]);

  function toggleTool(toolId: string) {
    setActiveTools((previous) =>
      previous.includes(toolId)
        ? previous.filter((item) => item !== toolId)
        : [...previous, toolId],
    );
  }

  async function startRecording() {
    setRequestError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to access microphone";
      setRequestError(message);
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    setIsRecording(false);
    setIsSubmitting(true);
    setRequestError(null);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];

    try {
      const response = await transcribeVoiceAudio(audioBlob, activeTools);
      setTranscript(response.transcript || "");
      setSuggestedTools(response.toolSuggestions ?? []);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Voice request failed";
      setRequestError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-terminal-border bg-terminal-bg/70 text-terminal-text transition-colors hover:bg-terminal-border/30"
        aria-label="Open voice agent"
      >
        <Volume2 size={16} />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 p-3 md:p-6">
          <section className="w-full max-w-md rounded-xl border border-terminal-border bg-terminal-surface p-4 shadow-glow">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-terminal-text">Voice Agent</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded border border-terminal-border p-1 text-terminal-text-dim hover:bg-terminal-border/30"
                aria-label="Close voice agent"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-1 text-xs text-terminal-text-muted">
              Deepgram STT with tool suggestions from your selected toolset.
            </p>

            <div className="mt-3 rounded border border-terminal-border bg-terminal-bg/55 p-2">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-terminal-text-muted">Tools</p>
              {loading ? <p className="text-xs text-terminal-text-dim">Loading tools…</p> : null}
              {error ? <p className="text-xs text-terminal-red">Failed to load tools.</p> : null}
              <div className="grid grid-cols-1 gap-2">
                {(data?.tools ?? []).map((tool) => (
                  <label key={tool.id} className="flex cursor-pointer items-start gap-2 text-xs text-terminal-text-dim">
                    <input
                      type="checkbox"
                      checked={activeTools.includes(tool.id)}
                      onChange={() => toggleTool(tool.id)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-terminal-text">{tool.label}</span>
                      <span>{tool.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={() => void startRecording()}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 rounded border border-emerald-500/45 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 disabled:opacity-70"
                >
                  <Mic size={14} />
                  Start
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void stopRecording()}
                  className="inline-flex items-center gap-1 rounded border border-rose-500/45 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200"
                >
                  <Square size={14} />
                  Stop
                </button>
              )}
              {isSubmitting ? <span className="text-xs text-terminal-text-dim">Transcribing…</span> : null}
            </div>

            {requestError ? <p className="mt-2 text-xs text-terminal-red">{requestError}</p> : null}

            <div className="mt-3 rounded border border-terminal-border bg-terminal-bg/60 p-2">
              <p className="text-[11px] uppercase tracking-wide text-terminal-text-muted">Transcript</p>
              <p className="mt-1 min-h-12 text-xs text-terminal-text">
                {transcript || "Record a short command to transcribe and infer tool actions."}
              </p>
              {suggestionsText ? (
                <p className="mt-1 text-xs text-cyan-300">Suggested tools: {suggestionsText}</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
