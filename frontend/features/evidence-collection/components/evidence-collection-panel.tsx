"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createClaim,
  getClaimTrace,
  getEvidenceDashboardSummary,
  ingestEmailEvidence,
  listEvidenceDocuments,
  listReviewTasks,
  runEvidenceExtraction,
  updateReviewTask,
  uploadEvidenceDocument,
} from "../services";
import type {
  ClaimType,
  EvidenceDashboardResponse,
  EvidenceDocument,
  EvidenceDocumentType,
  ReviewTask,
  ClaimTraceResponse,
} from "../types";

const DOCUMENT_TYPES: EvidenceDocumentType[] = ["utility_bill", "fuel_invoice", "renewable_certificate"];
const CLAIM_TYPES: ClaimType[] = ["scope1_emissions", "scope2_emissions", "renewable_electricity"];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function EvidenceCollectionPanel() {
  const [organizationId, setOrganizationId] = useState("org_demo");
  const [facilityId, setFacilityId] = useState("facility_a");
  const [documentType, setDocumentType] = useState<EvidenceDocumentType>("utility_bill");
  const [periodStart, setPeriodStart] = useState("2026-01-01");
  const [periodEnd, setPeriodEnd] = useState("2026-01-31");
  const [file, setFile] = useState<File | null>(null);

  const [emailFrom, setEmailFrom] = useState("supplier@example.com");
  const [emailSubject, setEmailSubject] = useState("Monthly utility bill");
  const [emailBody, setEmailBody] = useState("Facility A consumed 12400 kWh for Jan 2026.");

  const [claimType, setClaimType] = useState<ClaimType>("scope2_emissions");
  const [claimStatement, setClaimStatement] = useState("Facility A reported Scope 2 electricity usage for Jan 2026");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [claimIdForTrace, setClaimIdForTrace] = useState("");

  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [dashboard, setDashboard] = useState<EvidenceDashboardResponse | null>(null);
  const [trace, setTrace] = useState<ClaimTraceResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [documentsResponse, reviewTasksResponse, dashboardResponse] = await Promise.all([
        listEvidenceDocuments(),
        listReviewTasks("needs_review"),
        getEvidenceDashboardSummary(),
      ]);

      setDocuments(documentsResponse.documents);
      setReviewTasks(reviewTasksResponse.review_tasks);
      setDashboard(dashboardResponse);
      setActionError(null);
    } catch (error) {
      console.error("Failed to refresh evidence collection data", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to load evidence collection data. Please try again.";
      setActionError(message);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const approvedActivityRecordIds = useMemo(
    () =>
      documents
        .filter((item) => item.status === "approved")
        .map((item) => item.latest_activity_record_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    [documents],
  );

  const toggleEvidenceId = (recordId: string) => {
    setSelectedEvidenceIds((previous) =>
      previous.includes(recordId) ? previous.filter((item) => item !== recordId) : [...previous, recordId],
    );
  };

  const withActionState = async (work: () => Promise<void>) => {
    setLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await work();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unexpected evidence action failure");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setActionError("Choose a file before upload.");
      return;
    }

    await withActionState(async () => {
      const response = await uploadEvidenceDocument({
        organizationId,
        facilityId,
        documentType,
        periodStart,
        periodEnd,
        file,
      });
      setActionMessage(`Document ingested: ${response.document.id}`);
      setFile(null);
      await refreshData();
    });
  };

  const handleEmailIngest = async () => {
    await withActionState(async () => {
      const response = await ingestEmailEvidence({
        organization_id: organizationId,
        facility_id: facilityId,
        document_type: documentType,
        period_start: periodStart,
        period_end: periodEnd,
        from_email: emailFrom,
        subject: emailSubject,
        body: emailBody,
      });
      setActionMessage(`Email evidence ingested: ${response.document.id}`);
      await refreshData();
    });
  };

  const handleRunExtraction = async (documentId: string) => {
    await withActionState(async () => {
      const response = await runEvidenceExtraction(documentId, { actor_id: "extractor_bot" });
      setActionMessage(`Extraction complete: ${response.extraction.id}`);
      await refreshData();
    });
  };

  const handleReviewDecision = async (taskId: string, decision: "approved" | "rejected") => {
    await withActionState(async () => {
      const response = await updateReviewTask(taskId, {
        reviewer_id: "reviewer_lead",
        decision,
        notes: decision === "approved" ? "Validated against source document." : "Insufficient supporting data.",
      });
      setActionMessage(`Review ${response.review_task.id} marked ${response.review_task.status}`);
      await refreshData();
    });
  };

  const handleCreateClaim = async () => {
    if (selectedEvidenceIds.length === 0) {
      setActionError("Select at least one evidence record ID before creating a claim.");
      return;
    }

    await withActionState(async () => {
      const response = await createClaim({
        organization_id: organizationId,
        facility_id: facilityId,
        claim_type: claimType,
        statement: claimStatement,
        period_start: periodStart,
        period_end: periodEnd,
        evidence_record_ids: selectedEvidenceIds,
        created_by: "claim_owner",
      });
      setActionMessage(`Claim created: ${response.claim.id} (${response.claim.sufficiency_status})`);
      setClaimIdForTrace(response.claim.id);
      await refreshData();
    });
  };

  const handleLoadTrace = async () => {
    if (!claimIdForTrace.trim()) {
      setActionError("Enter a claim ID to load trace.");
      return;
    }

    await withActionState(async () => {
      const payload = await getClaimTrace(claimIdForTrace.trim());
      setTrace(payload);
      setActionMessage(`Loaded trace for claim ${payload.claim.id}`);
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-terminal-text">Automated Evidence Collection System</h3>
        <p className="text-xs text-terminal-text-muted">Scope 1/2 evidence, review workflow, and claim traceability</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
          <p className="text-xs uppercase tracking-wide text-terminal-text-muted">Ingestion</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              placeholder="organization id"
              className="rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            />
            <input
              value={facilityId}
              onChange={(event) => setFacilityId(event.target.value)}
              placeholder="facility id"
              className="rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as EvidenceDocumentType)}
              className="rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            />
            <input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
            />
          </div>

          <div className="rounded border border-terminal-border bg-terminal-surface p-2">
            <p className="mb-2 text-xs text-terminal-text-muted">Upload CSV/PDF evidence</p>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded border border-terminal-border bg-terminal-bg/40 px-2 py-2 text-xs text-terminal-text"
            />
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={loading}
              className="mt-2 rounded border border-terminal-cyan/35 bg-terminal-cyan/8 px-3 py-1.5 text-xs text-terminal-cyan disabled:opacity-60"
            >
              {loading ? "Processing..." : "Ingest Upload"}
            </button>
          </div>

          <div className="rounded border border-terminal-border bg-terminal-surface p-2">
            <p className="mb-2 text-xs text-terminal-text-muted">Email-forwarded evidence</p>
            <div className="grid gap-2">
              <input
                type="email"
                value={emailFrom}
                onChange={(event) => setEmailFrom(event.target.value)}
                placeholder="supplier@domain.com"
                className="rounded border border-terminal-border bg-terminal-bg/40 px-2 py-2 text-xs text-terminal-text"
              />
              <input
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
                placeholder="email subject"
                className="rounded border border-terminal-border bg-terminal-bg/40 px-2 py-2 text-xs text-terminal-text"
              />
              <textarea
                rows={3}
                value={emailBody}
                onChange={(event) => setEmailBody(event.target.value)}
                placeholder="email body"
                className="rounded border border-terminal-border bg-terminal-bg/40 px-2 py-2 text-xs text-terminal-text"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleEmailIngest()}
              disabled={loading}
              className="mt-2 rounded border border-terminal-green/35 bg-terminal-green/8 px-3 py-1.5 text-xs text-terminal-green disabled:opacity-60"
            >
              {loading ? "Processing..." : "Ingest Email Evidence"}
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
          <p className="text-xs uppercase tracking-wide text-terminal-text-muted">Pipeline Queue</p>
          <div className="max-h-[340px] space-y-2 overflow-y-auto rounded border border-terminal-border bg-terminal-surface p-2">
            {documents.length === 0 ? <p className="text-xs text-terminal-text-dim">No evidence documents yet.</p> : null}
            {documents.map((doc) => (
              <article key={doc.id} className="rounded border border-terminal-border bg-terminal-bg/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-terminal-text">{doc.file_name}</p>
                  <span className="text-[10px] uppercase text-terminal-text-muted">{doc.status}</span>
                </div>
                <p className="mt-1 text-[11px] text-terminal-text-muted">{doc.document_type} · {formatDateTime(doc.created_at)}</p>
                <p className="mt-1 truncate text-[11px] text-terminal-text-dim">{doc.id}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRunExtraction(doc.id)}
                    disabled={loading}
                    className="rounded border border-terminal-border px-2 py-1 text-[11px] text-terminal-text disabled:opacity-50"
                  >
                    Run extract + map
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="text-xs uppercase tracking-wide text-terminal-text-muted">Review Queue</p>
          <div className="max-h-[220px] space-y-2 overflow-y-auto rounded border border-terminal-border bg-terminal-surface p-2">
            {reviewTasks.length === 0 ? <p className="text-xs text-terminal-text-dim">No pending review tasks.</p> : null}
            {reviewTasks.map((task) => (
              <article key={task.id} className="rounded border border-terminal-border bg-terminal-bg/40 p-2">
                <p className="text-xs text-terminal-text">Task: {task.id}</p>
                <p className="mt-1 text-[11px] text-terminal-text-muted">Record: {task.activity_record_id}</p>
                {task.notes ? <p className="mt-1 text-[11px] text-terminal-text-dim">{task.notes}</p> : null}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleReviewDecision(task.id, "approved")}
                    disabled={loading}
                    className="rounded border border-terminal-green/35 px-2 py-1 text-[11px] text-terminal-green disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReviewDecision(task.id, "rejected")}
                    disabled={loading}
                    className="rounded border border-terminal-red/35 px-2 py-1 text-[11px] text-terminal-red disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
          <p className="text-xs uppercase tracking-wide text-terminal-text-muted">Claim Linkage</p>
          <select
            value={claimType}
            onChange={(event) => setClaimType(event.target.value as ClaimType)}
            className="w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
          >
            {CLAIM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            value={claimStatement}
            onChange={(event) => setClaimStatement(event.target.value)}
            className="w-full rounded border border-terminal-border bg-terminal-surface px-2 py-2 text-xs text-terminal-text"
          />

          <div className="rounded border border-terminal-border bg-terminal-surface p-2">
            <p className="mb-2 text-xs text-terminal-text-muted">Select evidence record IDs</p>
            <div className="max-h-[120px] space-y-1 overflow-y-auto">
              {approvedActivityRecordIds.length === 0 ? (
                <p className="text-xs text-terminal-text-dim">Run extraction and approve records to enable claims.</p>
              ) : (
                approvedActivityRecordIds.map((recordId) => (
                  <label key={recordId} className="flex items-center gap-2 text-xs text-terminal-text">
                    <input
                      type="checkbox"
                      checked={selectedEvidenceIds.includes(recordId)}
                      onChange={() => toggleEvidenceId(recordId)}
                    />
                    <span>{recordId}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleCreateClaim()}
            disabled={loading}
            className="rounded border border-terminal-cyan/35 bg-terminal-cyan/8 px-3 py-1.5 text-xs text-terminal-cyan disabled:opacity-60"
          >
            Create Claim
          </button>

          <div className="rounded border border-terminal-border bg-terminal-surface p-2">
            <p className="mb-2 text-xs text-terminal-text-muted">Load claim trace</p>
            <div className="flex gap-2">
              <input
                value={claimIdForTrace}
                onChange={(event) => setClaimIdForTrace(event.target.value)}
                placeholder="claim_xxxxx"
                className="flex-1 rounded border border-terminal-border bg-terminal-bg/40 px-2 py-2 text-xs text-terminal-text"
              />
              <button
                type="button"
                onClick={() => void handleLoadTrace()}
                disabled={loading}
                className="rounded border border-terminal-border px-3 py-2 text-xs text-terminal-text disabled:opacity-50"
              >
                Trace
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-terminal-border bg-terminal-bg/50 p-3">
          <p className="text-xs uppercase tracking-wide text-terminal-text-muted">Evidence Dashboard</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-terminal-border bg-terminal-surface p-2 text-terminal-text">
              Documents: {dashboard?.metrics.total_documents ?? 0}
            </div>
            <div className="rounded border border-terminal-border bg-terminal-surface p-2 text-terminal-text">
              Records: {dashboard?.metrics.total_activity_records ?? 0}
            </div>
            <div className="rounded border border-terminal-border bg-terminal-surface p-2 text-terminal-text">
              Pending Reviews: {dashboard?.metrics.pending_review_tasks ?? 0}
            </div>
            <div className="rounded border border-terminal-border bg-terminal-surface p-2 text-terminal-text">
              Traceable Claims: {dashboard?.metrics.traceable_claim_ratio ?? 0}%
            </div>
          </div>

          {trace ? (
            <div className="rounded border border-terminal-border bg-terminal-surface p-2 text-xs text-terminal-text">
              <p className="font-semibold">Claim: {trace.claim.id}</p>
              <p className="mt-1">Status: {trace.claim.sufficiency_status}</p>
              <p className="mt-1">Evidence linked: {trace.evidence_records.length}</p>
              <p className="mt-1">Documents: {trace.documents.map((item) => item.file_name).join(", ") || "-"}</p>
              <p className="mt-1">Approvals: {trace.approval_decisions.length}</p>
              <p className="mt-1">Audit events: {trace.audit_events.length}</p>
            </div>
          ) : (
            <p className="text-xs text-terminal-text-dim">Load a claim trace to view provenance chain.</p>
          )}
        </div>
      </div>

      {actionMessage ? <p className="text-xs text-terminal-green">{actionMessage}</p> : null}
      {actionError ? <p className="text-xs text-terminal-red">{actionError}</p> : null}
    </section>
  );
}
