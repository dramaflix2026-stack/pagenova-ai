-- PageNova Chat AI: private conversations and atomic monthly token budget.
create table if not exists public.pagenova_chat_threads (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'Nova conversa', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.pagenova_chat_messages (
 id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.pagenova_chat_threads(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, role text not null check(role in ('user','assistant')),
 content text not null, created_at timestamptz not null default now()
);
create table if not exists public.pagenova_chat_budget (
 user_id uuid not null references auth.users(id) on delete cascade, month text not null,
 reserved_units integer not null default 0, spent_units integer not null default 0,
 primary key(user_id,month)
);
create index if not exists pagenova_chat_threads_user_idx on public.pagenova_chat_threads(user_id,updated_at desc);
create index if not exists pagenova_chat_messages_thread_idx on public.pagenova_chat_messages(thread_id,created_at);
alter table public.pagenova_chat_threads enable row level security;
alter table public.pagenova_chat_messages enable row level security;
alter table public.pagenova_chat_budget enable row level security;
create policy chat_threads_owner on public.pagenova_chat_threads for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy chat_messages_owner on public.pagenova_chat_messages for select to authenticated using(user_id=auth.uid());
create policy chat_budget_owner on public.pagenova_chat_budget for select to authenticated using(user_id=auth.uid());
-- Internal units are micro-USD; 5 BRL budget is conservatively 850000 micro-USD.
create or replace function public.pagenova_chat_reserve(p_user uuid,p_month text,p_units integer)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if p_units<1 or p_units>200000 or p_month<>to_char(now() at time zone 'UTC','YYYY-MM') then return false; end if;
 insert into public.pagenova_chat_budget(user_id,month) values(p_user,p_month) on conflict do nothing;
 update public.pagenova_chat_budget set reserved_units=reserved_units+p_units
 where user_id=p_user and month=p_month and reserved_units+spent_units+p_units<=850000;
 return found;
end;$$;
create or replace function public.pagenova_chat_settle(p_user uuid,p_month text,p_reserved integer,p_actual integer)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.pagenova_chat_budget set reserved_units=greatest(0,reserved_units-p_reserved),spent_units=spent_units+greatest(0,p_actual)
 where user_id=p_user and month=p_month;
end;$$;
revoke all on function public.pagenova_chat_reserve(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.pagenova_chat_settle(uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.pagenova_chat_reserve(uuid,text,integer) to service_role;
grant execute on function public.pagenova_chat_settle(uuid,text,integer,integer) to service_role;
