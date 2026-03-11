export type EvidenceDocumentType = "utility_bill" | "fuel_invoice" | "renewable_certificate";
export type ClaimType = "scope1_emissions" | "scope2_emissions" | "renewable_electricity";
export type ReviewDecision = "approved" | "rejected" | "superseded";

export type AuditEvent = {
  id: string;
  event_type: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  payload?: Record<string, unknown>;
  timestamp: string;
};

export type EvidenceDocument = {
  id: string;
  organization_id: string;
  facility_id: string | null;
  supplier_id: string | null;
  document_type: EvidenceDocumentType;
  source_system: string;
  source_channel: string;
  source_reference: string | null;
  file_name: string;
  content_type: string | null;
  file_size: number;
  sha256: string;
  period_start: string | null;
  period_end: string | null;
  region: string | null;
  currency: string | null;
  status: "ingested" | "extracted" | "mapped" | "needs_review" | "approved" | "rejected" | "superseded";
  created_at: string;
  updated_at: string;
  latest_extraction_id?: string | null;
  latest_activity_record_id?: string | null;
  latest_review_task_id?: string | null;
};

export type Extraction = {
  id: string;
  document_id: string;
  version: number;
  model_name: string;
  confidence_score: number;
  extracted_fields: Record<string, unknown>;
  created_at: string;
};

export type ActivityRecord = {
  id: string;
  organization_id: string;
  facility_id: string | null;
  supplier_id: string | null;
  period_start: string | null;
  period_end: string | null;
  document_type: EvidenceDocumentType;
  activity_type: string;
  quantity: number | null;
  unit: string | null;
  currency: string | null;
  region: string | null;
  confidence_score: number;
  source_document_id: string;
  extraction_id: string;
  reviewer_status: "needs_review" | "approved" | "rejected" | "superseded";
  lifecycle_status: string;
  blocked_reasons: string[];
  created_at: string;
  updated_at: string;
};

export type ReviewTask = {
  id: string;
  activity_record_id: string;
  status: "needs_review" | "approved" | "rejected" | "superseded";
  notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reviewer_id: string | null;
  decision: ReviewDecision | null;
};

export type ApprovalDecision = {
  id: string;
  review_task_id: string;
  activity_record_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  notes: string | null;
  overrides: Record<string, unknown>;
  created_at: string;
};

export type ClaimRecord = {
  id: string;
  organization_id: string;
  facility_id: string | null;
  claim_type: ClaimType;
  statement: string;
  period_start: string | null;
  period_end: string | null;
  evidence_record_ids: string[];
  sufficiency_status: "complete" | "incomplete";
  missing_requirements: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type EvidenceUploadResponse = {
  document: EvidenceDocument;
  audit_event: AuditEvent;
};

export type EvidenceExtractionResponse = {
  document: EvidenceDocument;
  extraction: Extraction;
  activity_record: ActivityRecord;
  review_task: ReviewTask;
  audit_event: AuditEvent;
};

export type ReviewTaskUpdateResponse = {
  review_task: ReviewTask;
  activity_record: ActivityRecord;
  approval_decision: ApprovalDecision;
  audit_event: AuditEvent;
};

export type ClaimCreateResponse = {
  claim: ClaimRecord;
  evidence_records: ActivityRecord[];
  audit_event: AuditEvent;
};

export type ClaimTraceResponse = {
  claim: ClaimRecord;
  documents: EvidenceDocument[];
  evidence_records: ActivityRecord[];
  extractions: Extraction[];
  review_tasks: ReviewTask[];
  approval_decisions: ApprovalDecision[];
  audit_events: AuditEvent[];
};

export type EvidenceDocumentsResponse = {
  documents: EvidenceDocument[];
  total: number;
};

export type EvidenceReviewTasksResponse = {
  review_tasks: ReviewTask[];
  total: number;
};

export type EvidenceDashboardResponse = {
  metrics: {
    total_documents: number;
    total_activity_records: number;
    pending_review_tasks: number;
    approved_records: number;
    rejected_records: number;
    traceable_claim_ratio: number;
    average_review_turnaround_minutes: number | null;
  };
  recent_documents: EvidenceDocument[];
  recent_review_tasks: ReviewTask[];
  recent_claims: ClaimRecord[];
};

export type UploadEvidenceRequest = {
  organizationId: string;
  facilityId?: string;
  supplierId?: string;
  documentType: EvidenceDocumentType;
  periodStart?: string;
  periodEnd?: string;
  region?: string;
  currency?: string;
  actorId?: string;
  file: File;
};

export type EmailIngestRequest = {
  organization_id: string;
  facility_id?: string;
  supplier_id?: string;
  document_type: EvidenceDocumentType;
  period_start?: string;
  period_end?: string;
  region?: string;
  currency?: string;
  actor_id?: string;
  from_email: string;
  subject: string;
  body: string;
};

export type ReviewTaskDecisionRequest = {
  reviewer_id: string;
  decision: ReviewDecision;
  notes?: string;
  overrides?: Record<string, unknown>;
};

export type ClaimCreateRequest = {
  organization_id: string;
  facility_id?: string;
  claim_type: ClaimType;
  statement: string;
  period_start?: string;
  period_end?: string;
  evidence_record_ids: string[];
  created_by?: string;
};
