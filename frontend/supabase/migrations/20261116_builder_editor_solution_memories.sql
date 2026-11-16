-- PageNova AI — Universal Editor Step 2/9: persistent, owner-isolated solution memory.
-- Only explicitly verified deterministic edits are stored as candidates.
-- A record is usable for learning only after its linked feedback event is approved.
-- No historical events are backfilled; fabricated memories are forbidden.
create table if not exists public.builder_editor_solution_memories(
 event_id uuid primary key references public.builder_editor_learning_events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 schema_version integer not null default 2 check(schema_version=2),
 verification text not null check(verification in ('model','visual')),
 context jsonb not null check(jsonb_typeof(context)='object' and octet_length(context::text)<=1000),
 changed_ids jsonb not null check(jsonb_typeof(changed_ids)='array' and jsonb_array_length(changed_ids) between 1 and 50),
 deltas jsonb not null check(jsonb_typeof(deltas)='array' and jsonb_array_length(deltas) between 1 and 50 and octet_length(deltas::text)<=18000),
 created_at timestamptz not null default now()
);
create index if not exists builder_editor_solution_memories_user_created_idx
 on public.builder_editor_solution_memories(user_id,created_at desc);
alter table public.builder_editor_solution_memories enable row level security;
revoke all on table public.builder_editor_solution_memories from public,anon,authenticated;
grant select,insert on table public.builder_editor_solution_memories to authenticated;
drop policy if exists "Users can read own verified editor solution candidates" on public.builder_editor_solution_memories;
create policy "Users can read own verified editor solution candidates"
 on public.builder_editor_solution_memories for select to authenticated
 using ((select auth.uid())=user_id);
drop policy if exists "Users can record own applied editor solutions" on public.builder_editor_solution_memories;
create policy "Users can record own applied editor solutions"
 on public.builder_editor_solution_memories for insert to authenticated
 with check (
  (select auth.uid())=user_id
  and exists(
   select 1 from public.builder_editor_learning_events event
   where event.id=event_id and event.user_id=(select auth.uid())
    and event.execution_status='applied'
  )
 );
-- No UPDATE or DELETE API rights; immutable snapshots remain tied to the event verdict.
