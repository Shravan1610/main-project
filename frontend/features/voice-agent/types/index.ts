export type VapiCallStatus =
  | "idle"
  | "connecting"
  | "active"
  | "ending";

export type VapiCallMode = "web" | "phone";

export type VapiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
};

export type PhoneCallResponse = {
  status: string;
  callId: string | null;
  phoneNumber: string;
};
