-- Private, server-managed PageNova conversational history (no project action permissions).
create table if not exists public.pagenova_ai_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pagenova_ai_messages_array check (jsonb_typeof(messages) = 'array'),
  constraint pagenova_ai_thread_title_len check (char_length(title) <= 120)
);
create index if not exists pagenova_ai_threads_owner_recent
  on public.pagenova_ai_threads(owner_id,updated_at desc);
alter table public.pagenova_ai_threads enable row level security;
revoke all on public.pagenova_ai_threads from public,anon,authenticated;
grant select,insert,update,delete on public.pagenova_ai_threads to service_role;
-- Admin-controlled opt-in memory. Only explicit 'lembre' requests can create entries.
create table if not exists public.pagenova_ai_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  note text not null check(char_length(note) between 3 and 350),
  created_at timestamptz not null default now()
);
create index if not exists pagenova_ai_notes_owner_recent
  on public.pagenova_ai_notes(owner_id,created_at desc);
alter table public.pagenova_ai_notes enable row level security;
revoke all on public.pagenova_ai_notes from public,anon,authenticated;
grant select,insert,delete on public.pagenova_ai_notes to service_role;
