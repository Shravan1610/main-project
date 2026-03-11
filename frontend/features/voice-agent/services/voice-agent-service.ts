import { apiClient } from "@/shared/api";
import type { PhoneCallResponse } from "../types";

export async function initiatePhoneCall(phoneNumber: string): Promise<PhoneCallResponse> {
  return apiClient.post<PhoneCallResponse>("/voice-agent/phone-call", {
    phone_number: phoneNumber,
  });
}
