-- Evidence Collection Tables
-- Stores ESG evidence documents, extractions, reviews, claims, and audit trail

-- ── Evidence Documents ─────────────────────────────────────────────────────
create table if not exists public.evidence_documents (
    id text primary key,
    organization_id text not null default 'org_demo',
    facility_id text,
    supplier_id text,
    document_type text not null check (document_type in ('utility_bill', 'fuel_invoice', 'renewable_certificate')),
    source_system text not null default 'manual_upload',
    source_channel text not null default 'manual_upload',
    source_reference text,
    file_name text not null,
    content_type text,
    file_size integer not null default 0,
    sha256 text not null,
    period_start text,
    period_end text,
    region text,
    currency text,
    status text not null default 'ingested' check (status in ('ingested', 'extracted', 'mapped', 'needs_review', 'approved', 'rejected', 'superseded')),
    text_preview text,
    latest_extraction_id text,
    latest_activity_record_id text,
    latest_review_task_id text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidence_docs_org on public.evidence_documents (organization_id);
create index if not exists idx_evidence_docs_status on public.evidence_documents (status);
create index if not exists idx_evidence_docs_type on public.evidence_documents (document_type);

-- ── Extractions ────────────────────────────────────────────────────────────
create table if not exists public.evidence_extractions (
    id text primary key,
    document_id text not null references public.evidence_documents(id) on delete cascade,
    version integer not null default 1,
    model_name text not null,
    confidence_score numeric(4, 2) not null,
    extracted_fields jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidence_extractions_doc on public.evidence_extractions (document_id);

-- ── Activity Records ───────────────────────────────────────────────────────
create table if not exists public.evidence_activity_records (
    id text primary key,
    organization_id text not null default 'org_demo',
    facility_id text,
    supplier_id text,
    period_start text,
    period_end text,
    document_type text not null,
    activity_type text not null,
    quantity numeric(18, 4),
    unit text,
    currency text,
    region text,
    confidence_score numeric(4, 2) not null,
    source_document_id text not null references public.evidence_documents(id) on delete cascade,
    extraction_id text not null references public.evidence_extractions(id) on delete cascade,
    reviewer_status text not null default 'needs_review' check (reviewer_status in ('needs_review', 'approved', 'rejected', 'superseded')),
    lifecycle_status text not null default 'mapped',
    blocked_reasons jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidence_activity_org on public.evidence_activity_records (organization_id);
create index if not exists idx_evidence_activity_status on public.evidence_activity_records (reviewer_status);

-- ── Review Tasks ───────────────────────────────────────────────────────────
create table if not exists public.evidence_review_tasks (
    id text primary key,
    activity_record_id text not null references public.evidence_activity_records(id) on delete cascade,
    status text not null default 'needs_review' check (status in ('needs_review', 'approved', 'rejected', 'superseded')),
    notes text,
    reviewer_id text,
    decision text,
    resolved_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidence_review_status on public.evidence_review_tasks (status);

-- ── Approval Decisions ─────────────────────────────────────────────────────
create table if not exists public.evidence_approval_decisions (
    id text primary key,
    review_task_id text not null references public.evidence_review_tasks(id) on delete cascade,
    activity_record_id text not null references public.evidence_activity_records(id) on delete cascade,
    reviewer_id text not null,
    decision text not null check (decision in ('approved', 'rejected', 'superseded')),
    notes text,
    overrides jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

-- ── Claims ─────────────────────────────────────────────────────────────────
create table if not exists public.evidence_claims (
    id text primary key,
    organization_id text not null default 'org_demo',
    facility_id text,
    claim_type text not null check (claim_type in ('scope1_emissions', 'scope2_emissions', 'renewable_electricity')),
    statement text not null,
    period_start text,
    period_end text,
    evidence_record_ids jsonb not null default '[]'::jsonb,
    sufficiency_status text not null default 'incomplete' check (sufficiency_status in ('complete', 'incomplete')),
    missing_requirements jsonb not null default '[]'::jsonb,
    created_by text not null default 'system',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidence_claims_org on public.evidence_claims (organization_id);

-- ── Audit Events ───────────────────────────────────────────────────────────
create table if not exists public.evidence_audit_events (
    id text primary key,
    event_type text not null,
    actor_id text not null,
    entity_type text not null,
    entity_id text not null,
    payload jsonb not null default '{}'::jsonb,
    timestamp timestamptz not null default timezone('utc', now())
);

create index if not exists idx_evidence_audit_entity on public.evidence_audit_events (entity_id);
create index if not exists idx_evidence_audit_type on public.evidence_audit_events (event_type);

-- ── Google OAuth Connections ───────────────────────────────────────────────
create table if not exists public.evidence_google_connections (
    id text primary key,
    organization_id text not null unique,
    provider text not null default 'google_gmail',
    status text not null default 'connected',
    user_email text,
    auth_source text default 'supabase',
    supabase_user_id text,
    provider_token_present boolean default false,
    provider_refresh_token_present boolean default false,
    granted_scopes jsonb not null default '[]'::jsonb,
    mailbox_label text,
    connected_at timestamptz,
    last_sync_at timestamptz
);

-- ── Email Sync Runs ────────────────────────────────────────────────────────
create table if not exists public.evidence_email_sync_runs (
    id text primary key,
    organization_id text not null,
    provider text not null default 'google_gmail',
    status text not null default 'completed',
    scope text not null,
    query_hint text,
    source text default 'demo_library',
    messages_scanned integer not null default 0,
    matches_found integer not null default 0,
    documents_created integer not null default 0,
    started_at timestamptz not null default timezone('utc', now()),
    completed_at timestamptz
);

-- ── Digital Trail (blockchain registry) ────────────────────────────────────
create table if not exists public.digital_trail_records (
    hash text primary key,
    asset_name text not null,
    asset_type text not null default 'document',
    encrypted_chunk text,
    blockchain_tx text not null,
    registered_at timestamptz not null default timezone('utc', now()),
    last_verified_at timestamptz,
    version integer not null default 1,
    status text not null default 'anchored'
);

create table if not exists public.digital_trail_forensics (
    id bigint generated always as identity primary key,
    original_hash text not null,
    ip text,
    attempted_hash text,
    encrypted_payload bytea,
    timestamp timestamptz not null default timezone('utc', now())
);

create index if not exists idx_forensics_hash on public.digital_trail_forensics (original_hash);

-- ── RLS policies (public read for demo) ────────────────────────────────────
alter table public.evidence_documents enable row level security;
alter table public.evidence_extractions enable row level security;
alter table public.evidence_activity_records enable row level security;
alter table public.evidence_review_tasks enable row level security;
alter table public.evidence_approval_decisions enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.evidence_audit_events enable row level security;
alter table public.evidence_google_connections enable row level security;
alter table public.evidence_email_sync_runs enable row level security;
alter table public.digital_trail_records enable row level security;
alter table public.digital_trail_forensics enable row level security;

-- Allow service role full access (used by backend)
-- For demo: also allow anonymous read
do $$ 
declare
    tbl text;
begin
    for tbl in select unnest(array[
        'evidence_documents', 'evidence_extractions', 'evidence_activity_records',
        'evidence_review_tasks', 'evidence_approval_decisions', 'evidence_claims',
        'evidence_audit_events', 'evidence_google_connections', 'evidence_email_sync_runs',
        'digital_trail_records', 'digital_trail_forensics'
    ]) loop
        execute format('drop policy if exists "Service role full access" on public.%I', tbl);
        execute format('create policy "Service role full access" on public.%I for all using (true) with check (true)', tbl);
    end loop;
end $$;
