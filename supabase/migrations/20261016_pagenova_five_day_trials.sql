-- One verified email/owner receives one nonrenewable 120-hour PageNova trial.
-- Trial balance is independent from Kiwify entitlements/commercial credits.
create table if not exists public.pagenova_trials(
 owner_id uuid primary key,email text not null unique,
 started_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '5 days'),
 site_limit integer not null default 2 check(site_limit=2),
 google_limit integer not null default 5 check(google_limit=5),
 sites_used integer not null default 0 check(sites_used between 0 and 2),
 google_used integer not null default 0 check(google_used between 0 and 5),
 updated_at timestamptz not null default now(),
 check(email=lower(btrim(email))),
 check(expires_at=started_at+interval '5 days')
);
create table if not exists public.pagenova_trial_operations(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.pagenova_trials(owner_id),
 kind text not null check(kind in ('site_generation','google_page')),
 operation_key text not null check(length(operation_key) between 8 and 220),
 state text not null default 'reserved' check(state in ('reserved','consumed','refunded')),
 job_id text,
 created_at timestamptz not null default now(),settled_at timestamptz,
 unique(owner_id,kind,operation_key)
);
create unique index if not exists pagenova_trial_unique_job on public.pagenova_trial_operations(job_id) where job_id is not null;
create index if not exists pagenova_trial_operation_owner on public.pagenova_trial_operations(owner_id,created_at desc);
alter table public.pagenova_trials enable row level security;
alter table public.pagenova_trial_operations enable row level security;
revoke all on public.pagenova_trials from public,anon,authenticated;
revoke all on public.pagenova_trial_operations from public,anon,authenticated;
create or replace function public.pagenova_trial_access(p_owner_id uuid,p_email text,p_start boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.pagenova_trials%rowtype;v_email text:=lower(btrim(p_email));
begin
 if p_owner_id is null or v_email is null or v_email='' or length(v_email)>254 then
  return jsonb_build_object('active',false,'reason','invalid_identity');end if;
 perform pg_advisory_xact_lock(pg_catalog.hashtextextended('pagenova_trial:'||v_email,0));
 select * into v from public.pagenova_trials where owner_id=p_owner_id for update;
 if not found then
  if exists(select 1 from public.pagenova_trials where email=v_email) then
   return jsonb_build_object('active',false,'reason','already_claimed');end if;
  if not p_start then return jsonb_build_object('active',false,'reason','not_started');end if;
  insert into public.pagenova_trials(owner_id,email) values(p_owner_id,v_email) returning * into v;
 end if;
 if v.email<>v_email then return jsonb_build_object('active',false,'reason','identity_changed');end if;
 return jsonb_build_object('active',v.expires_at>now(),'startedAt',v.started_at,'expiresAt',v.expires_at,
 'sitesLimit',v.site_limit,'sitesUsed',v.sites_used,'sitesRemaining',v.site_limit-v.sites_used,
 'googleLimit',v.google_limit,'googleUsed',v.google_used,'googleRemaining',v.google_limit-v.google_used,
 'reason',case when v.expires_at>now() then 'active' else 'expired' end);
end;$$;
create or replace function public.pagenova_trial_reserve(p_owner_id uuid,p_kind text,p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.pagenova_trials%rowtype;op public.pagenova_trial_operations%rowtype;
begin
 if p_owner_id is null or p_kind not in ('site_generation','google_page')
 or p_key is null or length(p_key) not between 8 and 220 then
  return jsonb_build_object('allowed',false,'reason','invalid_request');end if;
 select * into v from public.pagenova_trials where owner_id=p_owner_id for update;
 if not found or v.expires_at<=now() then
  return jsonb_build_object('allowed',false,'reason','expired');end if;
 select * into op from public.pagenova_trial_operations
 where owner_id=p_owner_id and kind=p_kind and operation_key=p_key for update;
 if found then
  return jsonb_build_object('allowed',op.state<>'refunded','created',false,
   'operationId',op.id,'state',op.state,'jobId',op.job_id,
   'reason',case when op.state='refunded' then 'refunded' else null end);
 end if;
 if (p_kind='site_generation' and v.sites_used>=v.site_limit)
 or (p_kind='google_page' and v.google_used>=v.google_limit) then
  return jsonb_build_object('allowed',false,'reason',
  case when p_kind='site_generation' then 'site_limit' else 'google_limit' end);end if;
 insert into public.pagenova_trial_operations(owner_id,kind,operation_key)
 values(p_owner_id,p_kind,p_key) returning * into op;
 update public.pagenova_trials set
 sites_used=sites_used+case when p_kind='site_generation' then 1 else 0 end,
 google_used=google_used+case when p_kind='google_page' then 1 else 0 end,
 updated_at=now() where owner_id=p_owner_id;
 return jsonb_build_object('allowed',true,'created',true,'operationId',op.id,'state','reserved');
end;$$;
create or replace function public.pagenova_trial_settle(
 p_owner_id uuid,p_operation_id uuid,p_success boolean,p_job_id text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.pagenova_trials%rowtype;op public.pagenova_trial_operations%rowtype;
begin
 select * into v from public.pagenova_trials where owner_id=p_owner_id for update;
 if not found then return jsonb_build_object('found',false);end if;
 select * into op from public.pagenova_trial_operations
 where id=p_operation_id and owner_id=p_owner_id for update;
 if not found then return jsonb_build_object('found',false);end if;
 if op.state='refunded' then return jsonb_build_object('found',true,'state',op.state);end if;
 if not p_success then
  update public.pagenova_trial_operations set state='refunded',settled_at=now() where id=op.id;
  update public.pagenova_trials set
   sites_used=sites_used-case when op.kind='site_generation' then 1 else 0 end,
   google_used=google_used-case when op.kind='google_page' then 1 else 0 end,
   updated_at=now() where owner_id=p_owner_id;
 elsif op.state='reserved' then
  update public.pagenova_trial_operations set state='consumed',settled_at=now(),
    job_id=coalesce(nullif(p_job_id,''),job_id) where id=op.id;
 end if;
 return jsonb_build_object('found',true,'state',
  case when p_success then 'consumed' else 'refunded' end);
end;$$;
create or replace function public.pagenova_trial_settle_job(p_job_id text,p_success boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare op public.pagenova_trial_operations%rowtype;
begin
 select * into op from public.pagenova_trial_operations where job_id=p_job_id;
 if not found then return jsonb_build_object('found',false);end if;
 return public.pagenova_trial_settle(op.owner_id,op.id,p_success,p_job_id);
end;$$;
revoke execute on function public.pagenova_trial_access(uuid,text,boolean) from public,anon,authenticated;
revoke execute on function public.pagenova_trial_reserve(uuid,text,text) from public,anon,authenticated;
revoke execute on function public.pagenova_trial_settle(uuid,uuid,boolean,text) from public,anon,authenticated;
revoke execute on function public.pagenova_trial_settle_job(text,boolean) from public,anon,authenticated;
grant execute on function public.pagenova_trial_access(uuid,text,boolean) to service_role;
grant execute on function public.pagenova_trial_reserve(uuid,text,text) to service_role;
grant execute on function public.pagenova_trial_settle(uuid,uuid,boolean,text) to service_role;
grant execute on function public.pagenova_trial_settle_job(text,boolean) to service_role;
