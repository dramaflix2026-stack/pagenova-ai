-- Additive: no changes to existing projects, history, users or storage buckets.
create table public.pagenova_cloud_projects (
  user_id uuid not null references auth.users(id),
  project_id text not null check (length(project_id) between 1 and 240),
  revision uuid not null,
  kind text not null check (kind in ('studio','indexeddb')),
  title text not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key(user_id, project_id)
);
create table public.pagenova_project_revisions (
  user_id uuid not null references auth.users(id),
  project_id text not null,
  revision uuid not null,
  parent_revision uuid,
  kind text not null check(kind in ('studio','indexeddb')),
  title text not null,
  payload jsonb not null check(jsonb_typeof(payload)='object' and payload <> '{}'::jsonb),
  conflict boolean not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key(user_id,revision)
);
create index pagenova_revision_project_history on public.pagenova_project_revisions(user_id,project_id,created_at desc,revision desc);
alter table public.pagenova_cloud_projects enable row level security;
alter table public.pagenova_project_revisions enable row level security;
create policy project_backup_read_own on public.pagenova_cloud_projects for select to authenticated using ((select auth.uid())=user_id);
create policy project_revision_read_own on public.pagenova_project_revisions for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.pagenova_cloud_projects,public.pagenova_project_revisions from anon,authenticated;
grant select on public.pagenova_cloud_projects,public.pagenova_project_revisions to authenticated;
-- Writes are only through the bounded CAS procedure. No UPDATE or DELETE grants
-- on revisions, even for their owner. Private definer is necessary to maintain
-- immutable history and atomically move heads without granting direct DML.
create schema if not exists pagenova_backup_private;
revoke all on schema pagenova_backup_private from public;
grant usage on schema pagenova_backup_private to authenticated;
create function pagenova_backup_private.save_project(
  p_project text,p_operation uuid,p_base uuid,p_kind text,p_payload jsonb,p_title text,
  p_archive boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user uuid := auth.uid();
  v_head uuid;
  v_existing public.pagenova_project_revisions%rowtype;
  v_conflict boolean;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_project is null or length(p_project) not between 1 and 240 or p_operation is null
    or p_kind is null or p_kind not in ('studio','indexeddb')
    or p_payload is null or jsonb_typeof(p_payload)<>'object' or p_payload='{}'::jsonb
    or octet_length(p_payload::text)>20000000 then raise exception 'Invalid backup'; end if;
  if p_kind='studio' and (jsonb_typeof(p_payload->'blocks') is distinct from 'array'
    or jsonb_typeof(p_payload->'title') is distinct from 'string'
    or jsonb_typeof(p_payload->'background') is distinct from 'string') then raise exception 'Invalid Studio backup'; end if;
  if p_kind='studio' and jsonb_array_length(p_payload->'blocks')=0 then raise exception 'Empty Studio backup'; end if;
  if p_kind='studio' and (jsonb_array_length(p_payload->'blocks')>2000 or exists(
    select 1 from jsonb_array_elements(p_payload->'blocks') b where jsonb_typeof(b->'type') is distinct from 'string'
  )) then raise exception 'Invalid Studio blocks'; end if;
  if p_kind='indexeddb' and (
    coalesce(jsonb_typeof(p_payload->'html')='string' and length(btrim(p_payload->>'html'))>0,false)
    or coalesce(jsonb_typeof(p_payload->'visualHtml')='string' and length(btrim(p_payload->>'visualHtml'))>0,false)
    or coalesce(jsonb_typeof(p_payload->'generatedHtml')='string' and length(btrim(p_payload->>'generatedHtml'))>0,false)
    or case when jsonb_typeof(p_payload->'blocks')='array' then jsonb_array_length(p_payload->'blocks')>0 else false end
    or (jsonb_typeof(p_payload->'pages') in ('object','array') and p_payload->'pages' not in ('{}'::jsonb,'[]'::jsonb))
    or (p_payload->>'kind'='booking-workspace' and jsonb_typeof(p_payload->'services')='array' and jsonb_typeof(p_payload->'reservations')='array')
  ) is not true then raise exception 'Empty legacy project'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_project,0));
  select * into v_existing from public.pagenova_project_revisions where user_id=v_user and revision=p_operation;
  if found then
    if v_existing.project_id<>p_project or v_existing.payload<>p_payload or v_existing.kind<>p_kind
      then raise exception 'Operation identity reused'; end if;
    return jsonb_build_object('revision',v_existing.revision,'conflict',v_existing.conflict);
  end if;
  select revision into v_head from public.pagenova_cloud_projects where user_id=v_user and project_id=p_project;
  v_conflict := coalesce(p_archive,false) or v_head is distinct from p_base;
  insert into public.pagenova_project_revisions(user_id,project_id,revision,parent_revision,kind,title,payload,conflict)
    values(v_user,p_project,p_operation,p_base,p_kind,left(coalesce(p_title,'Projeto'),240),p_payload,v_conflict);
  if not v_conflict then
    insert into public.pagenova_cloud_projects(user_id,project_id,revision,kind,title)
      values(v_user,p_project,p_operation,p_kind,left(coalesce(p_title,'Projeto'),240))
    on conflict(user_id,project_id) do update set revision=excluded.revision,kind=excluded.kind,title=excluded.title,created_at=clock_timestamp();
  end if;
  return jsonb_build_object('revision',p_operation,'conflict',v_conflict);
end $$;
revoke all on function pagenova_backup_private.save_project(text,uuid,uuid,text,jsonb,text,boolean) from public,anon;
grant execute on function pagenova_backup_private.save_project(text,uuid,uuid,text,jsonb,text,boolean) to authenticated;
create function public.pagenova_save_project(p_project text,p_operation uuid,p_base uuid,p_kind text,p_payload jsonb,p_title text,p_archive boolean default false)
returns jsonb language sql security invoker set search_path='' as $$
  select pagenova_backup_private.save_project(p_project,p_operation,p_base,p_kind,p_payload,p_title,p_archive);
$$;
revoke all on function public.pagenova_save_project(text,uuid,uuid,text,jsonb,text,boolean) from public,anon;
grant execute on function public.pagenova_save_project(text,uuid,uuid,text,jsonb,text,boolean) to authenticated;
