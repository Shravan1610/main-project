import { API_BASE_URL } from "@/shared/constants";
import { apiClient } from "@/shared/api";

import type {
  ClaimCreateRequest,
  ClaimCreateResponse,
  ClaimTraceResponse,
  EmailIngestRequest,
  EvidenceDashboardResponse,
  EvidenceDocumentsResponse,
  EvidenceExtractionResponse,
  EvidenceUploadResponse,
  ReviewTaskDecisionRequest,
  ReviewTaskUpdateResponse,
  EvidenceReviewTasksResponse,
  UploadEvidenceRequest,
} from "../types";

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = (await response.json().catch(() => null)) as { detail?: string } | T | null;
  if (!response.ok) {
    const message = (data as { detail?: string } | null)?.detail ?? fallbackMessage;
    throw new Error(message);
  }
  return data as T;
}

export async function uploadEvidenceDocument(payload: UploadEvidenceRequest): Promise<EvidenceUploadResponse> {
  const form = new FormData();
  form.append("organization_id", payload.organizationId);
  form.append("document_type", payload.documentType);
  form.append("document", payload.file);

  if (payload.facilityId) form.append("facility_id", payload.facilityId);
  if (payload.supplierId) form.append("supplier_id", payload.supplierId);
  if (payload.periodStart) form.append("period_start", payload.periodStart);
  if (payload.periodEnd) form.append("period_end", payload.periodEnd);
  if (payload.region) form.append("region", payload.region);
  if (payload.currency) form.append("currency", payload.currency);
  form.append("actor_id", payload.actorId ?? "uploader_user");

  const response = await fetch(`${API_BASE_URL}/evidence/documents/upload`, {
    method: "POST",
    body: form,
  });

  return parseResponse<EvidenceUploadResponse>(response, "Document upload failed");
}

export async function ingestEmailEvidence(payload: EmailIngestRequest): Promise<EvidenceUploadResponse> {
  return apiClient.post<EvidenceUploadResponse, EmailIngestRequest>("/evidence/documents/email-ingest", payload);
}

export async function listEvidenceDocuments(): Promise<EvidenceDocumentsResponse> {
  return apiClient.get<EvidenceDocumentsResponse>("/evidence/documents");
}

export async function getEvidenceDocument(documentId: string) {
  return apiClient.get(`/evidence/documents/${documentId}`);
}

export async function runEvidenceExtraction(
  documentId: string,
  payload?: { actor_id?: string; overrides?: Record<string, unknown> },
): Promise<EvidenceExtractionResponse> {
  return apiClient.post<EvidenceExtractionResponse, { actor_id: string; overrides?: Record<string, unknown> }>(
    `/evidence/extractions/${documentId}/run`,
    {
      actor_id: payload?.actor_id ?? "extractor_bot",
      overrides: payload?.overrides,
    },
  );
}

export async function listReviewTasks(status?: string): Promise<EvidenceReviewTasksResponse> {
  return apiClient.get<EvidenceReviewTasksResponse>("/evidence/review-tasks", {
    params: status ? { status } : undefined,
  });
}

export async function updateReviewTask(
  taskId: string,
  payload: ReviewTaskDecisionRequest,
): Promise<ReviewTaskUpdateResponse> {
  const response = await fetch(`${API_BASE_URL}/evidence/review-tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<ReviewTaskUpdateResponse>(response, "Review decision failed");
}

export async function createClaim(payload: ClaimCreateRequest): Promise<ClaimCreateResponse> {
  return apiClient.post<ClaimCreateResponse, ClaimCreateRequest>("/evidence/claims", payload);
}

export async function getClaimTrace(claimId: string): Promise<ClaimTraceResponse> {
  return apiClient.get<ClaimTraceResponse>(`/evidence/claims/${claimId}/trace`);
}

export async function getEvidenceDashboardSummary(): Promise<EvidenceDashboardResponse> {
  return apiClient.get<EvidenceDashboardResponse>("/evidence/dashboard/summary");
}
