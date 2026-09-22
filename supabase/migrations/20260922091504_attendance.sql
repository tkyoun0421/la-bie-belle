create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  checked_at timestamptz not null,
  reported_at timestamptz not null,
  received_at timestamptz not null,
  method text not null check (method in ('location', 'qr')),
  unique (day_id, profile_id)
);

create table public.excuses (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  body text not null,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id),
  decision text check (decision in ('approved', 'rejected')),
  decision_reason text
);

create table public.hall_secrets (
  hall_id uuid primary key references public.halls (id) on delete cascade,
  qr_code text not null unique,
  rotated_at timestamptz not null default now()
);

create view public.excuse_status
  with (security_invoker = false)
as
select
  excuses.day_id,
  excuses.profile_id,
  excuses.submitted_at,
  excuses.decided_at,
  excuses.decision
from public.excuses
where public.is_approved();

alter table public.check_ins enable row level security;
alter table public.excuses enable row level security;
alter table public.hall_secrets enable row level security;

create policy check_ins_select
  on public.check_ins
  for select
  to authenticated
  using (public.is_approved());

create policy excuses_select
  on public.excuses
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id = excuses.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

create policy hall_secrets_select
  on public.hall_secrets
  for select
  to authenticated
  using (public.is_admin());

revoke all on public.check_ins from anon, authenticated;
revoke all on public.excuses from anon, authenticated;
revoke all on public.hall_secrets from anon, authenticated;
revoke all on public.excuse_status from anon, authenticated;

grant select on public.check_ins to authenticated;
grant select on public.excuses to authenticated;
grant select on public.hall_secrets to authenticated;
grant select on public.excuse_status to authenticated;
