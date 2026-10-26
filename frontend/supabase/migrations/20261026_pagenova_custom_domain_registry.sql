-- Already applied through Supabase migration to the live PageNova project.
-- Keep schema versioned in Git for future environments and recoveries.
create table if not exists public.pagenova_site_publications (
 owner_id uuid not null references auth.users(id) on delete cascade,
 project_id text not null check (length(project_id) between 8 and 128),
 slug text not null unique check (slug ~ '^v2-[a-z0-9-]+$'),
 title text not null check (length(title) between 1 and 160),
 published_at timestamptz not null default now(),
 primary key (owner_id,project_id)
);
create index if not exists pagenova_site_publications_owner_recent_idx
 on public.pagenova_site_publications(owner_id,published_at desc);
alter table public.pagenova_site_publications enable row level security;
drop policy if exists "owner_read_site_publications" on public.pagenova_site_publications;
create policy "owner_read_site_publications" on public.pagenova_site_publications
 for select to authenticated using ((select auth.uid())=owner_id);

create table if not exists public.pagenova_custom_domains (
 domain text primary key,
 owner_id uuid not null,
 project_id text not null,
 slug text not null,
 state text not null default 'pending'
   check (state in ('pending','needs_configuration','active','error')),
 verification jsonb not null default '[]'::jsonb,
 dns_instructions jsonb not null default '{}'::jsonb,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key (owner_id,project_id)
   references public.pagenova_site_publications(owner_id,project_id) on delete cascade
);
create index if not exists pagenova_custom_domains_owner_idx
 on public.pagenova_custom_domains(owner_id,updated_at desc);
alter table public.pagenova_custom_domains enable row level security;
drop policy if exists "owner_read_custom_domains" on public.pagenova_custom_domains;
create policy "owner_read_custom_domains" on public.pagenova_custom_domains
 for select to authenticated using ((select auth.uid())=owner_id);
revoke insert,update,delete on public.pagenova_site_publications from anon,authenticated;
revoke insert,update,delete on public.pagenova_custom_domains from anon,authenticated;
grant select on public.pagenova_site_publications to authenticated;
grant select on public.pagenova_custom_domains to authenticated;
