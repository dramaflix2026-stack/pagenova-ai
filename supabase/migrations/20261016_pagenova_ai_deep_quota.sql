-- Small daily premium reasoning allowance; remaining conversations use efficient reasoning.
create table if not exists public.pagenova_ai_deep_daily(
 owner_id uuid not null references auth.users(id) on delete cascade,
 utc_day date not null default (now() at time zone 'utc')::date,
 requests integer not null default 0 check(requests>=0),
 primary key(owner_id,utc_day)
);
alter table public.pagenova_ai_deep_daily enable row level security;
revoke all on public.pagenova_ai_deep_daily from public,anon,authenticated;
grant select,insert,update on public.pagenova_ai_deep_daily to service_role;
create or replace function public.pagenova_ai_reserve_deep(p_owner_id uuid,p_limit integer)
returns boolean language plpgsql security definer set search_path=''
as $$
declare n integer;
begin
 if p_owner_id is null or p_limit not between 1 and 20 then return false; end if;
 insert into public.pagenova_ai_deep_daily(owner_id,utc_day,requests)
 values(p_owner_id,(now() at time zone 'utc')::date,0) on conflict do nothing;
 update public.pagenova_ai_deep_daily set requests=requests+1
 where owner_id=p_owner_id and utc_day=(now() at time zone 'utc')::date and requests<p_limit
 returning requests into n;
 return n is not null;
end;$$;
revoke execute on function public.pagenova_ai_reserve_deep(uuid,integer) from public,anon,authenticated;
grant execute on function public.pagenova_ai_reserve_deep(uuid,integer) to service_role;
