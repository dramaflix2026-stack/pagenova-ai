-- PageNova AI: individual subscription credit cycles.
-- This migration MUST be applied to the Supabase instance used by
-- NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY, not the FORMA database.
-- Never run billing changes against an unrelated Supabase project.
--
-- Contract: R$147/month; 40 new site generation jobs and 150 Google
-- text-search PAGES per subscriber/cycle. AI revisions and history are free.
-- All writes use service-role-only SECURITY DEFINER RPCs with row locks.
-- Kiwify paid renewal starts a new cycle once; duplicate webhooks are idempotent.

create table if not exists public.pagenova_credit_cycles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  owner_id uuid null,
  provider_order_id text not null unique,
  started_at timestamptz not null default now(),
  status text not null default 'active'
    check (status in ('active','superseded','refunded','chargeback')),
  site_limit integer not null default 40 check (site_limit=40),
  google_limit integer not null default 150 check (google_limit=150),
  sites_used integer not null default 0 check (sites_used between 0 and 40),
  google_used integer not null default 0 check (google_used between 0 and 150),
  updated_at timestamptz not null default now(),
  check (email=lower(btrim(email)))
);
create unique index if not exists pagenova_credit_one_active_cycle
  on public.pagenova_credit_cycles(email) where status='active';
create index if not exists pagenova_credit_owner_cycle
  on public.pagenova_credit_cycles(owner_id,started_at desc);

create table if not exists public.pagenova_credit_operations (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.pagenova_credit_cycles(id),
  owner_id uuid not null,
  kind text not null check (kind in ('site_generation','google_page')),
  operation_key text not null,
  state text not null default 'reserved'
    check (state in ('reserved','consumed','refunded')),
  job_id text null,
  created_at timestamptz not null default now(),
  settled_at timestamptz null,
  unique(cycle_id,kind,operation_key),
  check (length(operation_key) between 8 and 220)
);
create index if not exists pagenova_credit_operations_job
  on public.pagenova_credit_operations(owner_id,job_id)
  where job_id is not null;
create unique index if not exists pagenova_credit_unique_job
  on public.pagenova_credit_operations(job_id)
  where job_id is not null;

alter table public.pagenova_credit_cycles enable row level security;
alter table public.pagenova_credit_operations enable row level security;
revoke all on public.pagenova_credit_cycles from public,anon,authenticated;
revoke all on public.pagenova_credit_operations from public,anon,authenticated;

-- Lock across cycle creation, renewal, revocation and reservation.
create or replace function public.pagenova_credits_activate(
  p_email text,p_order_id text,p_started_at timestamptz default now()
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_email text:=lower(btrim(p_email));v_cycle public.pagenova_credit_cycles%rowtype;
begin
  if v_email is null or v_email='' or p_order_id is null or length(btrim(p_order_id))<3
    then raise exception 'invalid subscription identity';end if;
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||v_email,0));
  select * into v_cycle from public.pagenova_credit_cycles where provider_order_id=p_order_id for update;
  if found then
    -- Repeated order_approved is NEVER allowed to refill an already used cycle.
    return jsonb_build_object('cycleId',v_cycle.id,'created',false,'status',v_cycle.status);
  end if;
  if exists(select 1 from public.pagenova_credit_cycles
    where email=v_email and status='active' and started_at>coalesce(p_started_at,now())) then
    return jsonb_build_object('created',false,'status','ignored_older_order');
  end if;
  update public.pagenova_credit_cycles set status='superseded',updated_at=now()
    where email=v_email and status='active';
  insert into public.pagenova_credit_cycles(email,provider_order_id,started_at)
    values(v_email,p_order_id,coalesce(p_started_at,now())) returning * into v_cycle;
  return jsonb_build_object('cycleId',v_cycle.id,'created',true,'status','active');
end;$$;

create or replace function public.pagenova_credits_revoke(
  p_order_id text,p_status text
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_cycle public.pagenova_credit_cycles%rowtype;
begin
  if p_status not in ('refunded','chargeback') then raise exception 'invalid revocation status';end if;
  select * into v_cycle from public.pagenova_credit_cycles where provider_order_id=p_order_id;
  if not found then return jsonb_build_object('found',false);end if;
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||v_cycle.email,0));
  update public.pagenova_credit_cycles set status=p_status,updated_at=now()
    where id=v_cycle.id and status in ('active','superseded');
  return jsonb_build_object('found',true,'cycleId',v_cycle.id);
end;$$;

-- Bootstrap legacy subscribers who purchased before the migration.
-- Only entitlement rows already marked active can seed a new cycle.
create or replace function public.pagenova_credits_bootstrap(
  p_email text
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_email text:=lower(btrim(p_email));v_order text;v_started timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||v_email,0));
  if exists(select 1 from public.pagenova_credit_cycles where email=v_email and status='active') then
    return jsonb_build_object('existing',true);
  end if;
  select coalesce(provider_order_id,'manual:'||id::text),coalesce(purchased_at,now()) into v_order,v_started
    from public.entitlements
    where lower(email)=v_email and product='pagenova-ai' and status='active'
    order by purchased_at desc nulls last,updated_at desc
    limit 1;
  if v_order is null then return jsonb_build_object('existing',false,'error','no_active_order');end if;
  -- A refunded/superseded order must never be reactivated by a delayed callback.
  if exists(select 1 from public.pagenova_credit_cycles where provider_order_id=v_order) then
    return jsonb_build_object('existing',false,'error','order_already_closed');
  end if;
  return public.pagenova_credits_activate(v_email,v_order,v_started);
end;$$;

create or replace function public.pagenova_credits_balance(
  p_email text,p_owner_id uuid
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_email text:=lower(btrim(p_email));v public.pagenova_credit_cycles%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||v_email,0));
  select * into v from public.pagenova_credit_cycles
    where email=v_email and status='active' for update;
  if not found then return jsonb_build_object('active',false,'sitesRemaining',0,'googleRemaining',0);end if;
  if v.owner_id is not null and v.owner_id<>p_owner_id then raise exception 'credit account owner mismatch';end if;
  if v.owner_id is null then
    update public.pagenova_credit_cycles set owner_id=p_owner_id where id=v.id;
  end if;
  return jsonb_build_object('active',true,'cycleId',v.id,
    'sitesUsed',v.sites_used,'sitesLimit',40,'sitesRemaining',40-v.sites_used,
    'googleUsed',v.google_used,'googleLimit',150,'googleRemaining',150-v.google_used,
    'startedAt',v.started_at);
end;$$;

create or replace function public.pagenova_credits_reserve(
  p_email text,p_owner_id uuid,p_kind text,p_key text
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_email text:=lower(btrim(p_email));v public.pagenova_credit_cycles%rowtype;
        v_op public.pagenova_credit_operations%rowtype;
begin
  if p_kind not in ('site_generation','google_page') or length(p_key) not between 8 and 220
    then raise exception 'invalid credit operation';end if;
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||v_email,0));
  select * into v from public.pagenova_credit_cycles
    where email=v_email and status='active' for update;
  if not found then return jsonb_build_object('allowed',false,'reason','no_active_cycle');end if;
  if v.owner_id is not null and v.owner_id<>p_owner_id then raise exception 'credit owner mismatch';end if;
  if v.owner_id is null then
    update public.pagenova_credit_cycles set owner_id=p_owner_id where id=v.id;
  end if;
  select * into v_op from public.pagenova_credit_operations
    where cycle_id=v.id and kind=p_kind and operation_key=p_key for update;
  if found then
    return jsonb_build_object('allowed',true,'created',false,'operationId',v_op.id,
      'state',v_op.state,'jobId',v_op.job_id);
  end if;
  if (p_kind='site_generation' and v.sites_used>=v.site_limit)
    or (p_kind='google_page' and v.google_used>=v.google_limit) then
    return jsonb_build_object('allowed',false,
      'reason',case when p_kind='site_generation' then 'site_limit' else 'google_limit' end);
  end if;
  insert into public.pagenova_credit_operations(cycle_id,owner_id,kind,operation_key)
    values(v.id,p_owner_id,p_kind,p_key) returning * into v_op;
  update public.pagenova_credit_cycles
    set sites_used=sites_used+case when p_kind='site_generation' then 1 else 0 end,
        google_used=google_used+case when p_kind='google_page' then 1 else 0 end,
        updated_at=now() where id=v.id;
  return jsonb_build_object('allowed',true,'created',true,
    'operationId',v_op.id,'state','reserved');
end;$$;

-- Includes reversal of completed jobs that later FAILED or CANCELLED.
-- A refund can only happen ONCE; repeated callbacks are safe.
create or replace function public.pagenova_credits_settle(
  p_owner_id uuid,p_operation_id uuid,p_success boolean,p_job_id text default null
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_op public.pagenova_credit_operations%rowtype;
begin
  select * into v_op from public.pagenova_credit_operations
    where id=p_operation_id and owner_id=p_owner_id;
  if not found then raise exception 'credit operation not found';end if;
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||
    (select email from public.pagenova_credit_cycles where id=v_op.cycle_id),0));
  select * into v_op from public.pagenova_credit_operations
    where id=p_operation_id and owner_id=p_owner_id for update;
  if v_op.state='refunded' then return jsonb_build_object('status','refunded','changed',false);end if;
  if p_success then
    update public.pagenova_credit_operations
      set state='consumed',job_id=coalesce(nullif(p_job_id,''),job_id),settled_at=now()
      where id=p_operation_id;
    return jsonb_build_object('status','consumed','changed',v_op.state<>'consumed');
  end if;
  update public.pagenova_credit_operations set state='refunded',settled_at=now()
    where id=p_operation_id;
  update public.pagenova_credit_cycles
    set sites_used=sites_used-case when v_op.kind='site_generation' then 1 else 0 end,
        google_used=google_used-case when v_op.kind='google_page' then 1 else 0 end,
        updated_at=now() where id=v_op.cycle_id;
  return jsonb_build_object('status','refunded','changed',true);
end;$$;

create or replace function public.pagenova_credits_settle_job(
  p_owner_id uuid,p_job_id text,p_success boolean
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_op public.pagenova_credit_operations%rowtype;
begin
  select * into v_op from public.pagenova_credit_operations
    where owner_id=p_owner_id and job_id=p_job_id and kind='site_generation'
    order by created_at desc limit 1;
  if not found then return jsonb_build_object('found',false);end if;
  return public.pagenova_credits_settle(p_owner_id,v_op.id,p_success,p_job_id);
end;$$;

-- Backfill from verified prior CRM activity BEFORE enabling the gate.
-- One-time only: refuses to overwrite an account with ledger operations.
create or replace function public.pagenova_credits_backfill(
  p_email text,p_order_id text,p_sites_used integer,p_google_used integer
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $
declare v_cycle public.pagenova_credit_cycles%rowtype;
begin
  if p_sites_used not between 0 and 40 or p_google_used not between 0 and 150
    then raise exception 'invalid historical usage';end if;
  perform pg_advisory_xact_lock(hashtextextended('pagenova_credit:'||lower(btrim(p_email)),0));
  select * into v_cycle from public.pagenova_credit_cycles
    where email=lower(btrim(p_email)) and provider_order_id=p_order_id for update;
  if not found then raise exception 'subscription cycle missing';end if;
  if exists(select 1 from public.pagenova_credit_operations where cycle_id=v_cycle.id) then
    raise exception 'cannot backfill a cycle with recorded operations';
  end if;
  update public.pagenova_credit_cycles
    set sites_used=p_sites_used,google_used=p_google_used,updated_at=now()
    where id=v_cycle.id;
  return jsonb_build_object('ok',true,'cycleId',v_cycle.id,
    'sitesUsed',p_sites_used,'googleUsed',p_google_used);
end;$;

-- Dedicated server-to-server terminal callback from Railway's worker.
-- The public HTTP endpoint checks an HMAC before invoking this service-role
-- function; clients can never call it using their browser Supabase token.
create or replace function public.pagenova_credits_settle_job_callback(
  p_job_id text,p_success boolean
) returns jsonb language plpgsql security definer
set search_path=public,pg_temp as $
declare v_op public.pagenova_credit_operations%rowtype;
begin
  select * into v_op from public.pagenova_credit_operations
    where job_id=p_job_id and kind='site_generation';
  if not found then return jsonb_build_object('found',false);end if;
  return public.pagenova_credits_settle(v_op.owner_id,v_op.id,p_success,p_job_id);
end;$;

revoke all on function public.pagenova_credits_activate(text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.pagenova_credits_revoke(text,text) from public,anon,authenticated;
revoke all on function public.pagenova_credits_bootstrap(text) from public,anon,authenticated;
revoke all on function public.pagenova_credits_balance(text,uuid) from public,anon,authenticated;
revoke all on function public.pagenova_credits_reserve(text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.pagenova_credits_settle(uuid,uuid,boolean,text) from public,anon,authenticated;
revoke all on function public.pagenova_credits_settle_job(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.pagenova_credits_activate(text,text,timestamptz) to service_role;
grant execute on function public.pagenova_credits_revoke(text,text) to service_role;
grant execute on function public.pagenova_credits_bootstrap(text) to service_role;
grant execute on function public.pagenova_credits_balance(text,uuid) to service_role;
grant execute on function public.pagenova_credits_reserve(text,uuid,text,text) to service_role;
grant execute on function public.pagenova_credits_settle(uuid,uuid,boolean,text) to service_role;
grant execute on function public.pagenova_credits_settle_job(uuid,text,boolean) to service_role;
revoke all on function public.pagenova_credits_backfill(text,text,integer,integer) from public,anon,authenticated;
revoke all on function public.pagenova_credits_settle_job_callback(text,boolean) from public,anon,authenticated;
grant execute on function public.pagenova_credits_backfill(text,text,integer,integer) to service_role;
grant execute on function public.pagenova_credits_settle_job_callback(text,boolean) to service_role;
grant select,insert,update,delete on public.pagenova_credit_cycles,public.pagenova_credit_operations to service_role;
