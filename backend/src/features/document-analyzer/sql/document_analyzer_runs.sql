create extension if not exists pgcrypto;

create table if not exists public.document_analyzer_runs (
    id uuid primary key default gen_random_uuid(),
    input_type text not null check (input_type in ('document', 'url', 'webpage')),
    analysis_engine text not null,
    model_status text not null,
    source jsonb not null default '{}'::jsonb,
    content_length integer not null default 0,
    content_preview text,
    extraction jsonb not null default '{}'::jsonb,
    claims jsonb not null default '[]'::jsonb,
    esg jsonb,
    ai_analytics jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_document_analyzer_runs_created_at
    on public.document_analyzer_runs (created_at desc);

create index if not exists idx_document_analyzer_runs_input_type
    on public.document_analyzer_runs (input_type);

create index if not exists idx_document_analyzer_runs_analysis_engine
    on public.document_analyzer_runs (analysis_engine);
