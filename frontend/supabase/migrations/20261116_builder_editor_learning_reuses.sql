-- Universal Editor step 3: immutable attribution of reviewed solution reuse.
-- Every reuse row must point to a verified applied new edit and an APPROVED
-- applied source edit with a memory snapshot owned by the same user.
-- No raw user prompts or private media are stored.
create table if not exists public.builder_editor_learning_reuses(
 event_id uuid primary key references public.builder_editor_learning_events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 source_event_id uuid not null references public.builder_editor_solution_memories(event_id) on delete cascade,
 technique text not null check (technique in ('section-background','section-heading-color','block-color','block-copy','block-alignment','section-reorder','section-remove','section-add')),
 created_at timestamptz not null default now(),
 check(event_id<>source_event_id)
);
create index if not exists builder_editor_learning_reuses_user_created_idx
 on public.builder_editor_learning_reuses(user_id,created_at desc);
alter table public.builder_editor_learning_reuses enable row level security;
revoke all on public.builder_editor_learning_reuses from public,anon,authenticated;
grant select,insert on public.builder_editor_learning_reuses to authenticated;
drop policy if exists "Owners can read their solution reuse attribution" on public.builder_editor_learning_reuses;
create policy "Owners can read their solution reuse attribution"
 on public.builder_editor_learning_reuses for select to authenticated
 using ((select auth.uid())=user_id);
drop policy if exists "Owners can attribute verified own learning" on public.builder_editor_learning_reuses;
create policy "Owners can attribute verified own learning"
 on public.builder_editor_learning_reuses for insert to authenticated
 with check(
 (select auth.uid())=user_id
 and exists(
  select 1 from public.builder_editor_learning_events next_event
  where next_event.id=event_id and next_event.user_id=(select auth.uid())
   and next_event.execution_status='applied'
 )
 and exists(
  select 1
  from public.builder_editor_learning_events source_event
  join public.builder_editor_solution_memories memory
   on memory.event_id=source_event.id and memory.user_id=source_event.user_id
  where source_event.id=source_event_id and source_event.user_id=(select auth.uid())
   and source_event.review_status='approved' and source_event.execution_status='applied'
 )
);
