import { API_BASE_URL } from "@/shared/constants";

import type { DocumentAnalyzerResponse } from "../types";

export async function analyzeDocumentInput(
  inputType: "document" | "url" | "webpage",
  payload: { file?: File | null; url?: string; webpage?: string },
) {
  const form = new FormData();
  form.append("input_type", inputType);

  if (inputType === "document" && payload.file) {
    form.append("document", payload.file);
  }
  if (inputType === "url" && payload.url) {
    form.append("url", payload.url);
  }
  if (inputType === "webpage" && payload.webpage) {
    form.append("webpage", payload.webpage);
  }

  const response = await fetch(`${API_BASE_URL}/document-analyzer/analyze`, {
    method: "POST",
    body: form,
  });

  const data = (await response.json().catch(() => null)) as DocumentAnalyzerResponse | { detail?: string } | null;
  if (!response.ok) {
    const message = (data as { detail?: string } | null)?.detail ?? "Document analyzer request failed";
    throw new Error(message);
  }
  return data as DocumentAnalyzerResponse;
}
