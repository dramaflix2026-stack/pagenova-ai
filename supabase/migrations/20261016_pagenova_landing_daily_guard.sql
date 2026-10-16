-- PageNova public landing leads. Apply to the PageNova Supabase project.
-- No client writes: service_role only. 100 submissions per published slug per UTC day.
create schema if not exists pagenova_private;
create table if not exists pagenova_private.landing_daily_submissions (
  slug text not null,
  usage_day date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (slug, usage_day)
);
alter table pagenova_private.landing_daily_submissions enable row level security;
revoke all on schema pagenova_private from public, anon, authenticated;
revoke all on table pagenova_private.landing_daily_submissions from public, anon, authenticated;

create or replace function public.pagenova_landing_lead_reserve(p_slug text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  if p_slug !~ '^lp-[a-f0-9]{32}$' then return false; end if;
  insert into pagenova_private.landing_daily_submissions as usage
      (slug, usage_day, request_count)
    values (p_slug, (now() at time zone 'UTC')::date, 1)
  on conflict (slug, usage_day)
    do update set request_count = usage.request_count + 1, updated_at = now()
      where usage.request_count < 100
  returning request_count into v_count;
  return v_count is not null;
end;
$$;
revoke execute on function public.pagenova_landing_lead_reserve(text) from public, anon, authenticated;
grant execute on function public.pagenova_landing_lead_reserve(text) to service_role;
