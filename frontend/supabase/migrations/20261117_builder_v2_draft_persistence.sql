-- Delivery 07: user-scoped cloud drafts with optimistic revision control.
create table if not exists public.pagenova_builder_drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  title text not null,
  site jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint pagenova_builder_drafts_pkey primary key (user_id, project_id),
  constraint pagenova_builder_drafts_project_check check
    (length(project_id) between 12 and 80 and project_id ~ '^[a-zA-Z0-9_-]+$'),
  constraint pagenova_builder_drafts_title_check check (length(title) between 1 and 160),
  constraint pagenova_builder_drafts_site_check check
    (jsonb_typeof(site)='object' and jsonb_typeof(site->'blocks')='array'
     and site->>'id'=project_id and jsonb_array_length(site->'blocks') between 1 and 160
     and octet_length(site::text)<=1800000),
  constraint pagenova_builder_drafts_revision_check check (revision>=1)
);
alter table public.pagenova_builder_drafts enable row level security;
revoke all on table public.pagenova_builder_drafts from public, anon;
grant select,insert,update,delete on public.pagenova_builder_drafts to authenticated;
create policy "drafts_select_owner" on public.pagenova_builder_drafts for select to authenticated
 using ((select auth.uid())=user_id);
create policy "drafts_insert_owner" on public.pagenova_builder_drafts for insert to authenticated
 with check ((select auth.uid())=user_id);
create policy "drafts_update_owner" on public.pagenova_builder_drafts for update to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "drafts_delete_owner" on public.pagenova_builder_drafts for delete to authenticated
 using ((select auth.uid())=user_id);
create index if not exists pagenova_builder_drafts_latest_idx
 on public.pagenova_builder_drafts(user_id,updated_at desc);
