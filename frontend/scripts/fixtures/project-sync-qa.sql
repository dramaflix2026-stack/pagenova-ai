-- SYNTHETIC LOCAL QA ONLY. Applied by the isolated GitHub job, never to a linked project.
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product text not null,
  status text not null
);
alter table public.entitlements enable row level security;
revoke all on public.entitlements from anon, authenticated;
grant select, insert on public.entitlements to service_role;
