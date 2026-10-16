-- Public Form and Quiz anti-abuse guard. Not subscription credits.
-- 1000 valid submissions per published resource per UTC day, atomically.
create schema if not exists pagenova_private;
create table if not exists pagenova_private.public_submission_daily (
  kind text not null check (kind in ('form','quiz')),
  resource_id uuid not null,
  usage_day date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (kind,resource_id,usage_day)
);
alter table pagenova_private.public_submission_daily enable row level security;
revoke all on pagenova_private.public_submission_daily from public,anon,authenticated;

create or replace function public.pagenova_public_submission_reserve(
  p_kind text, p_resource_id uuid
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  if p_kind not in ('form','quiz') or p_resource_id is null then return false; end if;
  insert into pagenova_private.public_submission_daily as usage
    (kind,resource_id,usage_day,request_count)
    values (p_kind,p_resource_id,(now() at time zone 'UTC')::date,1)
  on conflict (kind,resource_id,usage_day)
  do update set request_count=usage.request_count+1,updated_at=now()
    where usage.request_count < 1000
  returning request_count into v_count;
  return v_count is not null;
end;
$$;
revoke all on function public.pagenova_public_submission_reserve(text,uuid) from public,anon,authenticated;
grant execute on function public.pagenova_public_submission_reserve(text,uuid) to service_role;
