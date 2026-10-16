-- Server-only daily quota for PageNova contextual chat (UTC).
create table if not exists public.pagenova_support_chat_daily(
 owner_id uuid not null,
 utc_day date not null default (now() at time zone 'utc')::date,
 requests integer not null default 0 check(requests>=0),
 updated_at timestamptz not null default now(),
 primary key(owner_id,utc_day)
);
alter table public.pagenova_support_chat_daily enable row level security;
revoke all on public.pagenova_support_chat_daily from public,anon,authenticated;
create or replace function public.pagenova_support_chat_reserve(
 p_owner_id uuid,p_limit integer
) returns boolean language plpgsql security definer set search_path=''
as $$
declare v_requests integer;
begin
 if p_owner_id is null or p_limit not between 1 and 150 then return false;end if;
 insert into public.pagenova_support_chat_daily(owner_id,utc_day,requests)
 values(p_owner_id,(now() at time zone 'utc')::date,0)
 on conflict do nothing;
 update public.pagenova_support_chat_daily
 set requests=requests+1,updated_at=now()
 where owner_id=p_owner_id and utc_day=(now() at time zone 'utc')::date
  and requests<p_limit returning requests into v_requests;
 return v_requests is not null;
end;$$;
revoke execute on function public.pagenova_support_chat_reserve(uuid,integer) from public,anon,authenticated;
grant execute on function public.pagenova_support_chat_reserve(uuid,integer) to service_role;