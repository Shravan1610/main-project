import { apiClient } from "@/shared/api";
import { API_BASE_URL } from "@/shared/constants";

import type { VoiceToolsResponse, VoiceTranscribeResponse } from "../types";

export async function getVoiceTools() {
  return apiClient.get<VoiceToolsResponse>("/voice-agent/tools");
}

export async function transcribeVoiceAudio(audio: Blob, selectedTools: string[]) {
  const form = new FormData();
  form.append("audio", audio, "voice-input.webm");
  form.append("tools", JSON.stringify(selectedTools));

  const response = await fetch(`${API_BASE_URL}/voice-agent/transcribe`, {
    method: "POST",
    body: form,
  });

  const payload = (await response.json().catch(() => null)) as VoiceTranscribeResponse | { detail?: string } | null;
  if (!response.ok) {
    const message = (payload as { detail?: string } | null)?.detail ?? "Voice transcription failed";
    throw new Error(message);
  }

  return payload as VoiceTranscribeResponse;
}
