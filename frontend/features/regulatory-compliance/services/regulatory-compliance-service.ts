import { API_BASE_URL } from "@/shared/constants";

import type { ComplianceRiskResponse, DisclosureGapResponse } from "../types";

export async function analyzeDisclosureGaps(
  inputType: "document" | "url" | "webpage",
  payload: { file?: File | null; url?: string; webpage?: string },
  frameworks: string[] = ["GRI", "TCFD"],
): Promise<DisclosureGapResponse> {
  const form = new FormData();
  form.append("input_type", inputType);
  form.append("frameworks", frameworks.join(","));

  if (inputType === "document" && payload.file) {
    form.append("document", payload.file);
  }
  if (inputType === "url" && payload.url) {
    form.append("url", payload.url);
  }
  if (inputType === "webpage" && payload.webpage) {
    form.append("webpage", payload.webpage);
  }

  const response = await fetch(`${API_BASE_URL}/regulatory-compliance/disclosure-gaps`, {
    method: "POST",
    body: form,
  });

  const data = (await response.json().catch(() => null)) as DisclosureGapResponse | { detail?: string } | null;
  if (!response.ok) {
    const message = (data as { detail?: string } | null)?.detail ?? "Disclosure gap analysis failed";
    throw new Error(message);
  }
  return data as DisclosureGapResponse;
}

export async function analyzeComplianceRisk(
  inputType: "document" | "url" | "webpage",
  payload: { file?: File | null; url?: string; webpage?: string },
  frameworks: string[] = ["GRI", "TCFD"],
): Promise<ComplianceRiskResponse> {
  const form = new FormData();
  form.append("input_type", inputType);
  form.append("frameworks", frameworks.join(","));

  if (inputType === "document" && payload.file) {
    form.append("document", payload.file);
  }
  if (inputType === "url" && payload.url) {
    form.append("url", payload.url);
  }
  if (inputType === "webpage" && payload.webpage) {
    form.append("webpage", payload.webpage);
  }

  const response = await fetch(`${API_BASE_URL}/regulatory-compliance/compliance-risk`, {
    method: "POST",
    body: form,
  });

  const data = (await response.json().catch(() => null)) as ComplianceRiskResponse | { detail?: string } | null;
  if (!response.ok) {
    const message = (data as { detail?: string } | null)?.detail ?? "Compliance risk analysis failed";
    throw new Error(message);
  }
  return data as ComplianceRiskResponse;
}
