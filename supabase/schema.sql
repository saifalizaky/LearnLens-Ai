create table if not exists public.documents (
  id text primary key,
  session_id text not null,
  title text not null,
  category text not null default 'Uploaded PDF',
  file_name text not null,
  pages integer not null default 1,
  created_at timestamptz not null default now(),
  status text not null default 'ready',
  source text not null default 'upload',
  summary text not null,
  key_points jsonb not null default '[]'::jsonb,
  technical_terms jsonb not null default '[]'::jsonb,
  extracted_text text not null
);

create index if not exists documents_session_created_idx
  on public.documents (session_id, created_at desc);

create table if not exists public.activities (
  id text primary key,
  session_id text not null,
  type text not null,
  document_id text not null,
  document_title text not null,
  detail text not null,
  created_at timestamptz not null default now(),
  score integer,
  question_count integer
);

create index if not exists activities_session_created_idx
  on public.activities (session_id, created_at desc);

alter table public.documents enable row level security;
alter table public.activities enable row level security;

drop policy if exists "service role manages documents" on public.documents;
create policy "service role manages documents"
  on public.documents
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role manages activities" on public.activities;
create policy "service role manages activities"
  on public.activities
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
