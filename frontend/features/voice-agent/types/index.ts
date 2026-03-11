export type VoiceTool = {
  id: string;
  label: string;
  description: string;
};

export type VoiceToolsResponse = {
  tools: VoiceTool[];
};

export type VoiceTranscribeResponse = {
  transcript: string;
  toolSuggestions: string[];
  selectedTools: string[];
};
