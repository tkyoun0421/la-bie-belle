create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'manager', 'member');
create type public.membership_request_status as enum ('pending', 'approved', 'rejected');
create type public.member_position_status as enum ('qualified', 'training');
create type public.event_status as enum (
  'draft',
  'recruiting',
  'staffed',
  'in_progress',
  'completed',
  'cancelled'
);
create type public.application_status as enum ('applied', 'cancelled');
create type public.assignment_kind as enum ('regular', 'training');
create type public.assignment_status as enum (
  'assigned',
  'confirmed',
  'cancel_requested',
  'cancelled',
  'checked_in'
);
create type public.replacement_request_status as enum (
  'open',
  'pending_manager_approval',
  'approved',
  'closed'
);
create type public.checkin_status as enum (
  'checked_in',
  'exception_requested',
  'exception_approved'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.create_event_template(
  p_name text,
  p_first_service_at time,
  p_last_service_end_at time,
  p_slot_defaults jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_template_id uuid;
begin
  insert into public.event_templates (
    name,
    time_label,
    first_service_at,
    last_service_end_at,
    created_by
  )
  values (
    trim(p_name),
    to_char(p_first_service_at, 'HH24:MI') || ' - ' || to_char(p_last_service_end_at, 'HH24:MI'),
    p_first_service_at,
    p_last_service_end_at,
    p_created_by
  )
  returning id into v_template_id;

  insert into public.event_template_position_slots (
    template_id,
    position_id,
    required_count,
    training_count
  )
  select
    v_template_id,
    (slot ->> 'position_id')::uuid,
    greatest(((slot ->> 'required_count')::integer), 1),
    greatest(coalesce((slot ->> 'training_count')::integer, 0), 0)
  from jsonb_array_elements(p_slot_defaults) as slot;

  return v_template_id;
end;
$$;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  google_sub text unique,
  role public.app_role not null default 'member',
  name text not null,
  phone text,
  hourly_wage numeric(10, 2) not null default 0,
  venue_lat numeric(10, 7),
  venue_lng numeric(10, 7),
  checkin_radius_m integer not null default 150,
  install_confirmed_at timestamptz,
  onboarding_completed_at timestamptz,
  push_enabled boolean not null default false,
  push_subscribed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status public.membership_request_status not null default 'pending',
  requested_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index membership_requests_active_user_idx
  on public.membership_requests (user_id)
  where status = 'pending';

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index push_subscriptions_user_revoked_idx
  on public.push_subscriptions (user_id, revoked_at);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.member_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  status public.member_position_status not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, position_id)
);

create index member_positions_position_status_user_idx
  on public.member_positions (position_id, status, user_id);

create table public.event_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  time_label text not null,
  first_service_at time not null,
  last_service_end_at time not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint event_templates_service_time_check
    check (first_service_at < last_service_end_at)
);

create table public.event_template_position_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.event_templates(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  required_count integer not null default 1,
  training_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (template_id, position_id),
  constraint event_template_position_slots_required_count_check
    check (required_count > 0),
  constraint event_template_position_slots_training_count_check
    check (training_count >= 0)
);

create index event_template_position_slots_template_id_idx
  on public.event_template_position_slots (template_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.event_templates(id) on delete set null,
  title text not null,
  time_label text not null,
  event_date date not null,
  first_service_at time not null,
  last_service_end_at time not null,
  status public.event_status not null default 'draft',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_service_time_check
    check (first_service_at < last_service_end_at)
);

create index events_event_date_status_idx
  on public.events (event_date, status);

create table public.event_position_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  required_count integer not null default 1,
  training_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (event_id, position_id),
  constraint event_position_slots_required_count_check
    check (required_count > 0),
  constraint event_position_slots_training_count_check
    check (training_count >= 0)
);

create index event_position_slots_event_id_idx
  on public.event_position_slots (event_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.application_status not null default 'applied',
  applied_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create index applications_event_user_status_idx
  on public.applications (event_id, user_id, status);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  assignment_kind public.assignment_kind not null default 'regular',
  status public.assignment_status not null default 'assigned',
  assigned_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index assignments_active_event_position_user_idx
  on public.assignments (event_id, position_id, user_id)
  where status in ('assigned', 'confirmed', 'cancel_requested', 'checked_in');

create index assignments_event_position_user_status_idx
  on public.assignments (event_id, position_id, user_id, status);

create table public.replacement_requests (
  id uuid primary key default gen_random_uuid(),
  cancelled_assignment_id uuid not null unique references public.assignments(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete restrict,
  status public.replacement_request_status not null default 'open',
  approved_assignment_id uuid references public.assignments(id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index replacement_requests_cancelled_assignment_status_idx
  on public.replacement_requests (cancelled_assignment_id, status);

create table public.replacement_applications (
  id uuid primary key default gen_random_uuid(),
  replacement_request_id uuid not null references public.replacement_requests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  applied_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (replacement_request_id, user_id)
);

create index replacement_applications_request_user_idx
  on public.replacement_applications (replacement_request_id, user_id);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.checkin_status not null,
  checked_in_at timestamptz,
  lat numeric(10, 7),
  lng numeric(10, 7),
  accuracy_m numeric(10, 2),
  within_radius boolean,
  exception_request_reason text,
  exception_requested_at timestamptz,
  exception_approved_by uuid references public.users(id) on delete set null,
  exception_approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.payroll_overrides (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  overridden_amount numeric(10, 2) not null,
  override_reason text not null,
  overridden_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  before_json jsonb,
  after_json jsonb,
  reason text,
  actor_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_entity_created_at_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_membership_requests_updated_at
before update on public.membership_requests
for each row execute function public.set_updated_at();

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

create trigger set_positions_updated_at
before update on public.positions
for each row execute function public.set_updated_at();

create trigger set_member_positions_updated_at
before update on public.member_positions
for each row execute function public.set_updated_at();

create trigger set_event_templates_updated_at
before update on public.event_templates
for each row execute function public.set_updated_at();

create trigger set_event_template_position_slots_updated_at
before update on public.event_template_position_slots
for each row execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger set_event_position_slots_updated_at
before update on public.event_position_slots
for each row execute function public.set_updated_at();

create trigger set_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create trigger set_assignments_updated_at
before update on public.assignments
for each row execute function public.set_updated_at();

create trigger set_replacement_requests_updated_at
before update on public.replacement_requests
for each row execute function public.set_updated_at();

create trigger set_replacement_applications_updated_at
before update on public.replacement_applications
for each row execute function public.set_updated_at();

create trigger set_checkins_updated_at
before update on public.checkins
for each row execute function public.set_updated_at();
