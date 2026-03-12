"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { MacWindow } from "@/shared/components/mac-window";
import { getSupabaseBrowserClient } from "@/shared/lib";

import {
  connectGoogleMailbox,
  createClaim,
  getClaimTrace,
  getEvidenceDashboardSummary,
  ingestEmailEvidence,
  listEvidenceDocuments,
  listReviewTasks,
  runEvidenceExtraction,
  syncGoogleMailbox,
  updateReviewTask,
  uploadEvidenceDocument,
} from "../services";
import type {
  ClaimTraceResponse,
  ClaimType,
  EmailEvidenceSuggestion,
  EvidenceDashboardResponse,
  EvidenceDocument,
  EvidenceDocumentType,
  ReviewTask,
  SyncScope,
} from "../types";

const DOCUMENT_TYPES: EvidenceDocumentType[] = ["utility_bill", "fuel_invoice", "renewable_certificate"];
const CLAIM_TYPES: ClaimType[] = ["scope1_emissions", "scope2_emissions", "renewable_electricity"];
const SYNC_SCOPES: SyncScope[] = ["last_90_days", "last_180_days", "all_mail"];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMetric(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${value}${suffix}`;
}

function statusTone(status: string) {
  if (status === "approved" || status === "connected" || status === "complete") return "text-terminal-green border-terminal-green/30 bg-terminal-green/10";
  if (status === "rejected") return "text-terminal-red border-terminal-red/30 bg-terminal-red/10";
  if (status === "mapped") return "text-terminal-cyan border-terminal-cyan/30 bg-terminal-cyan/10";
  return "text-terminal-amber border-terminal-amber/30 bg-terminal-amber/10";
}

function TerminalCard({
  title,
  children,
  eyebrow,
}: {
  title: string;
  children: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="rounded-2xl border border-terminal-border bg-terminal-surface/90 p-4 shadow-[0_18px_45px_rgba(3,9,18,0.24)]">
      {eyebrow ? <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-terminal-text-muted">{eyebrow}</p> : null}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-terminal-text">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function EvidenceCollectionPanel() {
  const [organizationId, setOrganizationId] = useState("org_demo");
  const [facilityId, setFacilityId] = useState("facility_a");
  const [documentType, setDocumentType] = useState<EvidenceDocumentType>("utility_bill");
  const [periodStart, setPeriodStart] = useState("2026-01-01");
  const [periodEnd, setPeriodEnd] = useState("2026-01-31");
  const [file, setFile] = useState<File | null>(null);

  const [googleEmail, setGoogleEmail] = useState("ops@greentrust.demo");
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [syncScope, setSyncScope] = useState<SyncScope>("last_180_days");
  const [queryHint, setQueryHint] = useState("bill");
  const [emailFrom, setEmailFrom] = useState("supplier@example.com");
  const [emailSubject, setEmailSubject] = useState("Monthly utility bill");
  const [emailBody, setEmailBody] = useState("Facility A consumed 12400 kWh for Jan 2026.");

  const [claimType, setClaimType] = useState<ClaimType>("scope2_emissions");
  const [claimStatement, setClaimStatement] = useState("Facility A reported Scope 2 electricity usage for Jan 2026.");
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [claimIdForTrace, setClaimIdForTrace] = useState("");

  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [dashboard, setDashboard] = useState<EvidenceDashboardResponse | null>(null);
  const [trace, setTrace] = useState<ClaimTraceResponse | null>(null);
  const [suggestions, setSuggestions] = useState<EmailEvidenceSuggestion[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const [documentsResponse, reviewTasksResponse, dashboardResponse] = await Promise.all([
      listEvidenceDocuments(),
      listReviewTasks("needs_review"),
      getEvidenceDashboardSummary(),
    ]);

    setDocuments(documentsResponse.documents);
    setReviewTasks(reviewTasksResponse.review_tasks);
    setDashboard(dashboardResponse);
  }, []);

  const registerSupabaseSession = useCallback(
    async (session: Session) => {
      const userEmail = session.user.email;
      if (!userEmail) {
        throw new Error("Supabase session is missing the user email.");
      }

      await connectGoogleMailbox({
        organization_id: organizationId,
        actor_id: "workspace_owner",
        user_email: userEmail,
        supabase_user_id: session.user.id,
        provider_token: session.provider_token ?? undefined,
        provider_refresh_token: session.provider_refresh_token ?? undefined,
        granted_scopes: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/gmail.readonly",
        ],
      });

      setGoogleEmail(userEmail);
      setSupabaseConnected(true);
    },
    [organizationId],
  );

  useEffect(() => {
    void (async () => {
      try {
        await refreshData();
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Failed to load evidence workspace.";
        setActionError(message);
      }
    })();
  }, [refreshData]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        try {
          await registerSupabaseSession(session);
          await refreshData();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Failed to register Supabase session.");
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSupabaseConnected(false);
        return;
      }

      void (async () => {
        try {
          await registerSupabaseSession(session);
          await refreshData();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Failed to register Supabase session.");
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData, registerSupabaseSession]);

  const selectableEvidenceIds = useMemo(
    () =>
      documents
        .filter((item) => item.latest_activity_record_id)
        .map((item) => ({
          fileName: item.file_name,
          recordId: item.latest_activity_record_id as string,
        })),
    [documents],
  );

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

  const toggleEvidenceId = (recordId: string) => {
    setSelectedEvidenceIds((previous) =>
      previous.includes(recordId) ? previous.filter((item) => item !== recordId) : [...previous, recordId],
    );
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

  const handleManualEmailIngest = async () => {
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
      setActionMessage(`Forwarded email captured as ${response.document.id}`);
      await refreshData();
    });
  };

  const handleConnectGoogle = async () => {
    await withActionState(async () => {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true",
          },
        },
      });

      if (error) {
        throw error;
      }

      setActionMessage("Redirecting to Supabase Google sign-in...");
    });
  };

  const handleSyncGoogle = async () => {
    await withActionState(async () => {
      const response = await syncGoogleMailbox({
        organization_id: organizationId,
        actor_id: "workspace_owner",
        scope: syncScope,
        query_hint: queryHint,
      });
      setSuggestions(response.suggestions);
      setActionMessage(`Mailbox sync complete: ${response.sync_run.matches_found} evidence matches found.`);
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
        notes: decision === "approved" ? "Validated against source evidence." : "Needs a cleaner source document.",
      });
      setActionMessage(`Review ${response.review_task.id} marked ${response.review_task.status}`);
      await refreshData();
    });
  };

  const handleCreateClaim = async () => {
    if (selectedEvidenceIds.length === 0) {
      setActionError("Select at least one evidence record before creating a claim.");
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
      setClaimIdForTrace(response.claim.id);
      setActionMessage(`Claim created: ${response.claim.id} (${response.claim.sufficiency_status})`);
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
    <div className="bg-[radial-gradient(circle_at_top,rgba(75,117,98,0.18),transparent_32%)] px-4 py-6 text-terminal-text sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <MacWindow
          title="automated-evidence-collection-system"
          rightSlot={<span>{dashboard?.product.status ?? "booting"}</span>}
          className="border-terminal-border/30 bg-terminal-surface/90 shadow-(--terminal-surface-shadow)"
          bodyClassName="bg-transparent"
        >
          <section className="grid gap-6 px-5 py-5 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-terminal-text sm:text-4xl">
                    Automated evidence discovery for ESG claims, including Gmail history through Supabase Google Auth.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-terminal-text-dim">
                    {dashboard?.product.tagline ??
                      "Subtle terminal workspace for upload, mailbox search, extraction, review, and traceable claim assembly."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Documents", value: dashboard?.metrics.total_documents, caption: "in workspace", color: "terminal-cyan" },
                  { label: "Email matches", value: dashboard?.metrics.email_evidence_matches, caption: "from Gmail sync", color: "terminal-green" },
                  { label: "Ready claims", value: dashboard?.metrics.ready_for_claims, caption: "approved evidence", color: "terminal-green" },
                  { label: "Traceable ratio", value: dashboard?.metrics.traceable_claim_ratio, caption: "claim completeness", color: "terminal-cyan" },
                ].map((item, idx) => (
                  <div key={item.label} className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4 backdrop-blur transition-all duration-300 hover:border-terminal-border/40 hover:bg-terminal-surface/60" style={{ animationDelay: `${idx * 80}ms` }}>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-text-muted">{item.label}</p>
                    {dashboard ? (
                      <p className={`mt-3 text-3xl font-semibold text-terminal-text`}>{formatMetric(item.value)}</p>
                    ) : (
                      <div className="mt-3 h-9 w-16 animate-pulse rounded bg-terminal-border/30" />
                    )}
                    <p className="mt-1 text-xs text-terminal-text-dim">{item.caption}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <TerminalCard title="Supabase Google Auth" eyebrow="Past Email Access">
                  <div className="space-y-3 text-xs text-terminal-text-dim">
                    <div className={`inline-flex rounded-full border px-2.5 py-1 ${statusTone(dashboard?.google_integration.status ?? "not_connected")}`}>
                      {dashboard?.google_integration.status === "connected" ? "connected" : "not connected"}
                    </div>
                    <p>{dashboard?.google_integration.user_email ?? "No Google mailbox connected yet."}</p>
                    <p>Indexed messages: {dashboard?.google_integration.messages_indexed ?? 0}</p>
                    <p>Client session: {supabaseConnected ? "active in browser" : "not detected"}</p>
                  </div>
                </TerminalCard>

                <TerminalCard title="Pipeline Health" eyebrow="Live Counters">
                  <div className="space-y-2.5">
                    {[
                      { label: "ingested", value: dashboard?.pipeline.ingested ?? 0, color: "bg-terminal-cyan" },
                      { label: "mapped", value: dashboard?.pipeline.mapped ?? 0, color: "bg-terminal-amber" },
                      { label: "needs review", value: dashboard?.pipeline.needs_review ?? 0, color: "bg-terminal-amber" },
                      { label: "approved", value: dashboard?.pipeline.approved ?? 0, color: "bg-terminal-green" },
                      { label: "rejected", value: dashboard?.pipeline.rejected ?? 0, color: "bg-terminal-red" },
                    ].map((stage) => {
                      const total = (dashboard?.metrics.total_documents ?? 1) || 1;
                      const pct = Math.min(100, Math.round((stage.value / total) * 100));
                      return (
                        <div key={stage.label} className="space-y-1">
                          <div className="flex justify-between text-xs text-terminal-text-dim">
                            <span>{stage.label}</span>
                            <span className="text-terminal-text">{stage.value}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-terminal-border/20 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stage.color} transition-all duration-700 ease-out`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TerminalCard>
              </div>
            </div>

            <TerminalCard title="Operator Log" eyebrow="Workspace Status">
              <div className="space-y-3 text-xs text-terminal-text-dim">
                <p>
                  Organization: <span className="text-terminal-text">{organizationId}</span>
                </p>
                <p>
                  Facility focus: <span className="text-terminal-text">{facilityId}</span>
                </p>
                <p>
                  Review turnaround:{" "}
                  <span className="text-terminal-text">
                    {formatMetric(dashboard?.metrics.average_review_turnaround_minutes, " min")}
                  </span>
                </p>
                <p>
                  Coverage gaps: <span className="text-terminal-text">{dashboard?.metrics.coverage_gap_count ?? 0}</span>
                </p>
                {actionMessage ? <p className="rounded-xl border border-terminal-green/20 bg-terminal-green/10 px-3 py-2 text-terminal-green">{actionMessage}</p> : null}
                {actionError ? <p className="rounded-xl border border-terminal-red/20 bg-terminal-red/10 px-3 py-2 text-terminal-red">{actionError}</p> : null}
                <button
                  type="button"
                  onClick={() => void refreshData()}
                  disabled={loading}
                  className="w-full rounded-xl border border-terminal-border/30 bg-terminal-surface/50 px-3 py-2 text-left text-terminal-text transition hover:bg-terminal-surface/80 disabled:opacity-60"
                >
                  Refresh workspace snapshot
                </button>
              </div>
            </TerminalCard>
          </section>
        </MacWindow>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <TerminalCard title="Google Mail Evidence Search" eyebrow="Supabase Auth + Retroactive Discovery">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                  placeholder="organization id"
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none transition focus:border-terminal-cyan/50"
                />
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(event) => setGoogleEmail(event.target.value)}
                  placeholder="filled from Supabase session"
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none transition focus:border-terminal-cyan/50"
                  readOnly
                />
                <select
                  value={syncScope}
                  onChange={(event) => setSyncScope(event.target.value as SyncScope)}
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                >
                  {SYNC_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
                <input
                  value={queryHint}
                  onChange={(event) => setQueryHint(event.target.value)}
                  placeholder="query hint, e.g. bill"
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none transition focus:border-terminal-cyan/50"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleConnectGoogle()}
                  disabled={loading}
                  className="rounded-xl border border-terminal-cyan/30 bg-terminal-cyan/10 px-4 py-2 text-sm text-terminal-cyan transition hover:bg-terminal-cyan/15 disabled:opacity-60"
                >
                  Connect with Supabase Google
                </button>
                <button
                  type="button"
                  onClick={() => void handleSyncGoogle()}
                  disabled={loading}
                  className="rounded-xl border border-terminal-green/30 bg-terminal-green/10 px-4 py-2 text-sm text-terminal-green transition hover:bg-terminal-green/15 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-terminal-green" />
                      Scanning Gmail...
                    </span>
                  ) : (
                    "Search past email for evidence"
                  )}
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {suggestions.length === 0 ? (
                  <p className="text-sm text-terminal-text-dim">
                    {supabaseConnected
                      ? "Click \"Search past email for evidence\" to scan your Gmail for utility bills, fuel invoices, and renewable certificates."
                      : "Connect with Supabase Google to scan historical Gmail threads and convert matching evidence into reviewable records."}
                  </p>
                ) : (
                  suggestions.map((suggestion) => (
                    <div key={suggestion.message_id} className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4 animate-fade-in-up" style={{ animationDelay: `${suggestions.indexOf(suggestion) * 100}ms`, animationFillMode: 'backwards' }}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-terminal-text">{suggestion.subject}</p>
                        <span className="rounded-full border border-terminal-green/25 bg-terminal-green/10 px-2 py-1 text-[11px] text-terminal-green">
                          {Math.round(suggestion.confidence_score * 100)}% confidence
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-terminal-text-dim">
                        {suggestion.from_email} · {formatDateTime(suggestion.received_at)} · {suggestion.document_type}
                      </p>
                      <p className="mt-2 text-sm text-terminal-text-dim">{suggestion.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </TerminalCard>

            <TerminalCard title="Manual Intake" eyebrow="Uploads + Forwarded Email">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={facilityId}
                  onChange={(event) => setFacilityId(event.target.value)}
                  placeholder="facility id"
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                />
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value as EvidenceDocumentType)}
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
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
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                />
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                  className="rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-terminal-text-muted">File Evidence</p>
                  <input
                    type="file"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text"
                  />
                  <button
                    type="button"
                    onClick={() => void handleUpload()}
                    disabled={loading}
                    className="mt-3 rounded-xl border border-terminal-cyan/30 bg-terminal-cyan/10 px-4 py-2 text-sm text-terminal-cyan disabled:opacity-60"
                  >
                    Upload evidence file
                  </button>
                </div>

                <div className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4">
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-terminal-text-muted">Forwarded Email</p>
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={emailFrom}
                      onChange={(event) => setEmailFrom(event.target.value)}
                      placeholder="supplier@domain.com"
                      className="w-full rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                    />
                    <input
                      value={emailSubject}
                      onChange={(event) => setEmailSubject(event.target.value)}
                      placeholder="email subject"
                      className="w-full rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                    />
                    <textarea
                      rows={4}
                      value={emailBody}
                      onChange={(event) => setEmailBody(event.target.value)}
                      placeholder="email body"
                      className="w-full rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleManualEmailIngest()}
                    disabled={loading}
                    className="mt-3 rounded-xl border border-terminal-green/30 bg-terminal-green/10 px-4 py-2 text-sm text-terminal-green disabled:opacity-60"
                  >
                    Capture forwarded email
                  </button>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard title="Review Queue" eyebrow="Human-in-the-loop">
              <div className="space-y-3">
                {reviewTasks.length === 0 ? <p className="text-sm text-terminal-text-dim">No pending reviews.</p> : null}
                {reviewTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-terminal-text">{task.id}</p>
                        <p className="text-xs text-terminal-text-dim">Record {task.activity_record_id}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(task.status)}`}>{task.status}</span>
                    </div>
                    {task.notes ? <p className="mt-2 text-sm text-terminal-text-dim">{task.notes}</p> : null}
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleReviewDecision(task.id, "approved")}
                        disabled={loading}
                        className="rounded-xl border border-terminal-green/30 bg-terminal-green/10 px-3 py-2 text-sm text-terminal-green disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReviewDecision(task.id, "rejected")}
                        disabled={loading}
                        className="rounded-xl border border-terminal-red/30 bg-terminal-red/10 px-3 py-2 text-sm text-terminal-red disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalCard>
          </div>

          <div className="space-y-6">
            <TerminalCard title="Document Pipeline" eyebrow="Latest Evidence">
              <div className="space-y-3">
                {documents.length === 0 ? <p className="text-sm text-terminal-text-dim">No evidence documents yet.</p> : null}
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-terminal-text">{doc.file_name}</p>
                        <p className="text-xs text-terminal-text-dim">
                          {doc.document_type} · {doc.source_channel} · {formatDateTime(doc.created_at)}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(doc.status)}`}>{doc.status}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRunExtraction(doc.id)}
                        disabled={loading}
                        className="rounded-xl border border-terminal-border/30 bg-terminal-surface/50 px-3 py-2 text-sm text-terminal-text disabled:opacity-60"
                      >
                        Run extract + map
                      </button>
                      {doc.latest_activity_record_id ? (
                        <button
                          type="button"
                          onClick={() => toggleEvidenceId(doc.latest_activity_record_id as string)}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            selectedEvidenceIds.includes(doc.latest_activity_record_id as string)
                              ? "border-terminal-green/30 bg-terminal-green/10 text-terminal-green"
                              : "border-terminal-border/30 bg-terminal-surface/50 text-terminal-text"
                          }`}
                        >
                          {selectedEvidenceIds.includes(doc.latest_activity_record_id as string) ? "Selected for claim" : "Select for claim"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </TerminalCard>

            <TerminalCard title="Claim Builder" eyebrow="Traceable Output">
              <div className="space-y-3">
                <select
                  value={claimType}
                  onChange={(event) => setClaimType(event.target.value as ClaimType)}
                  className="w-full rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                >
                  {CLAIM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={claimStatement}
                  onChange={(event) => setClaimStatement(event.target.value)}
                  className="w-full rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                />
                <div className="rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-terminal-text-muted">Selectable evidence records</p>
                  <div className="mt-3 space-y-2">
                    {selectableEvidenceIds.length === 0 ? <p className="text-sm text-terminal-text-dim">No extracted evidence records available.</p> : null}
                    {selectableEvidenceIds.map((item) => (
                      <label key={item.recordId} className="flex items-center justify-between gap-3 rounded-xl border border-terminal-border/20 bg-terminal-bg px-3 py-2 text-sm text-terminal-text">
                        <div>
                          <p>{item.fileName}</p>
                          <p className="text-xs text-terminal-text-dim">{item.recordId}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedEvidenceIds.includes(item.recordId)}
                          onChange={() => toggleEvidenceId(item.recordId)}
                          className="h-4 w-4 accent-[rgb(var(--terminal-green))]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreateClaim()}
                  disabled={loading}
                  className="rounded-xl border border-terminal-green/30 bg-terminal-green/10 px-4 py-2 text-sm text-terminal-green disabled:opacity-60"
                >
                  Create claim package
                </button>
              </div>
            </TerminalCard>

            <TerminalCard title="Claim Trace" eyebrow="Audit Trail">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={claimIdForTrace}
                    onChange={(event) => setClaimIdForTrace(event.target.value)}
                    placeholder="claim id"
                    className="flex-1 rounded-xl border border-terminal-border/30 bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleLoadTrace()}
                    disabled={loading}
                    className="rounded-xl border border-terminal-cyan/30 bg-terminal-cyan/10 px-4 py-2 text-sm text-terminal-cyan disabled:opacity-60"
                  >
                    Load trace
                  </button>
                </div>
                {trace ? (
                  <div className="space-y-3 rounded-2xl border border-terminal-border/20 bg-terminal-surface/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-terminal-text">{trace.claim.statement}</p>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${statusTone(trace.claim.sufficiency_status)}`}>
                        {trace.claim.sufficiency_status}
                      </span>
                    </div>
                    <p className="text-xs text-terminal-text-dim">Evidence records linked: {trace.evidence_records.length}</p>
                    <p className="text-xs text-terminal-text-dim">Audit events captured: {trace.audit_events.length}</p>
                    {trace.claim.missing_requirements.length > 0 ? (
                      <p className="text-xs text-terminal-red">Missing: {trace.claim.missing_requirements.join(", ")}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-terminal-text-dim">Load a claim to inspect its trace chain.</p>
                )}
              </div>
            </TerminalCard>
          </div>
        </section>
      </div>
    </div>
  );
}
