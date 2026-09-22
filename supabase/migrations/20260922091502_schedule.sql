create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  month date not null unique check (month = date_trunc('month', month)::date),
  application_deadline date,
  confirmed_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.days (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  work_date date not null unique,
  starts_at time not null,
  ends_at time not null,
  ceremony_at time,
  opened_at timestamptz not null default now(),
  opened_by uuid not null references public.profiles (id)
);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  positions text[] not null check (cardinality(positions) >= 1),
  ended_at timestamptz,
  ended_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  slot_id uuid references public.slots (id) on delete cascade,
  position text not null,
  profile_id uuid not null references public.profiles (id),
  kind text not null check (kind in ('regular', 'training')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text,
  ended_by uuid references public.profiles (id),
  check (
    (kind = 'regular' and slot_id is not null)
    or (kind = 'training' and slot_id is null)
  )
);

create unique index assignments_live_regular_per_slot
  on public.assignments (slot_id)
  where ended_at is null and kind = 'regular';

create unique index assignments_live_regular_per_day_profile
  on public.assignments (day_id, profile_id)
  where ended_at is null and kind = 'regular';

create table public.position_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  position text not null,
  granted_by uuid not null references public.profiles (id),
  granted_at timestamptz not null default now(),
  unique (profile_id, position)
);

create table public.availabilities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  created_at timestamptz not null default now(),
  unique (profile_id, work_date)
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('work', 'swap')),
  slot_id uuid references public.slots (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  expires_at timestamptz not null,
  closed_at timestamptz,
  approved_candidate_id uuid,
  created_at timestamptz not null default now(),
  check (
    (kind = 'work' and slot_id is not null)
    or (kind = 'swap' and assignment_id is not null)
  )
);

create table public.request_candidates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  expires_at timestamptz not null,
  unique (request_id, profile_id)
);

create table public.cancel_requests (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id),
  decision text check (decision in ('approved', 'rejected')),
  decision_reason text
);

create view public.open_slots
  with (security_invoker = true)
as
select
  slots.id as slot_id,
  slots.day_id,
  days.work_date,
  slots.positions
from public.slots
join public.days on days.id = slots.day_id
where slots.ended_at is null
  and not exists (
    select 1
    from public.assignments
    where assignments.slot_id = slots.id
      and assignments.ended_at is null
      and assignments.kind = 'regular'
  );

alter table public.schedules enable row level security;
alter table public.days enable row level security;
alter table public.slots enable row level security;
alter table public.assignments enable row level security;
alter table public.position_grants enable row level security;
alter table public.availabilities enable row level security;
alter table public.requests enable row level security;
alter table public.request_candidates enable row level security;
alter table public.cancel_requests enable row level security;

create policy schedules_select
  on public.schedules
  for select
  to authenticated
  using (public.is_approved());

create policy days_select
  on public.days
  for select
  to authenticated
  using (public.is_approved());

create policy slots_select
  on public.slots
  for select
  to authenticated
  using (public.is_approved());

create policy assignments_select
  on public.assignments
  for select
  to authenticated
  using (public.is_approved());

create policy position_grants_select
  on public.position_grants
  for select
  to authenticated
  using (public.is_approved());

create policy requests_select
  on public.requests
  for select
  to authenticated
  using (public.is_approved());

create policy request_candidates_select
  on public.request_candidates
  for select
  to authenticated
  using (public.is_approved());

create policy availabilities_select
  on public.availabilities
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id = availabilities.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

create policy cancel_requests_select
  on public.cancel_requests
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id = cancel_requests.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

revoke all on public.schedules from anon, authenticated;
revoke all on public.days from anon, authenticated;
revoke all on public.slots from anon, authenticated;
revoke all on public.assignments from anon, authenticated;
revoke all on public.position_grants from anon, authenticated;
revoke all on public.availabilities from anon, authenticated;
revoke all on public.requests from anon, authenticated;
revoke all on public.request_candidates from anon, authenticated;
revoke all on public.cancel_requests from anon, authenticated;
revoke all on public.open_slots from anon, authenticated;

grant select on public.schedules to authenticated;
grant select on public.days to authenticated;
grant select on public.slots to authenticated;
grant select on public.assignments to authenticated;
grant select on public.position_grants to authenticated;
grant select on public.availabilities to authenticated;
grant select on public.requests to authenticated;
grant select on public.request_candidates to authenticated;
grant select on public.cancel_requests to authenticated;
grant select on public.open_slots to authenticated;
