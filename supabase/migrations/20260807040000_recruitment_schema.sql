create type schedule_status as enum ('OPEN', 'CLOSED', 'PREPARING', 'CONFIRMED', 'CANCELLED');
create type application_status as enum ('applied', 'withdrawn');

create table schedules (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  application_deadline date not null,
  status schedule_status not null default 'OPEN',
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_deadline_not_after_work_date check (application_deadline <= work_date)
);

create trigger schedules_set_updated_at
before update on schedules
for each row execute function set_updated_at();

create unique index schedules_work_date_active_unique
on schedules (work_date)
where status <> 'CANCELLED';

create function reject_past_schedule_dates() returns trigger
language plpgsql
as $$
begin
  if new.work_date < (now() at time zone 'Asia/Seoul')::date then
    raise exception '근무일은 오늘(KST) 이전일 수 없습니다' using errcode = 'LB021';
  end if;

  if new.application_deadline < (now() at time zone 'Asia/Seoul')::date then
    raise exception '신청 마감일은 오늘(KST) 이전일 수 없습니다' using errcode = 'LB021';
  end if;

  return new;
end;
$$;

create trigger schedules_reject_past_dates
before insert on schedules
for each row execute function reject_past_schedule_dates();

create function enforce_schedule_status_transition() returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if (old.status = 'OPEN' and new.status = 'CLOSED')
    or (old.status = 'CLOSED' and new.status = 'OPEN')
    or (old.status = 'CLOSED' and new.status = 'PREPARING')
    or (old.status = 'PREPARING' and new.status = 'CONFIRMED')
    or (old.status = 'OPEN' and new.status = 'CANCELLED')
    or (old.status = 'CLOSED' and new.status = 'CANCELLED')
    or (old.status = 'PREPARING' and new.status = 'CANCELLED')
  then
    return new;
  end if;

  raise exception '스케줄 상태 전이 %→%는 허용되지 않습니다', old.status, new.status
    using errcode = 'LB020';
end;
$$;

create trigger schedules_enforce_status_transition
before update on schedules
for each row execute function enforce_schedule_status_transition();

create function reject_append_only_mutation() returns trigger
language plpgsql
as $$
begin
  raise exception '% 테이블은 append-only이며 %는 허용되지 않습니다', tg_table_name, tg_op
    using errcode = 'LB022';
end;
$$;

create trigger schedules_reject_delete
before delete on schedules
for each row execute function reject_append_only_mutation();

create table applications (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules (id),
  profile_id uuid not null references profiles (id),
  status application_status not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, profile_id)
);

create trigger applications_set_updated_at
before update on applications
for each row execute function set_updated_at();

create trigger applications_reject_delete
before delete on applications
for each row execute function reject_append_only_mutation();

create table scheduling_audit_logs (
  seq bigint generated always as identity primary key,
  event text not null
    constraint scheduling_audit_logs_event_not_blank check (length(btrim(event)) > 0),
  actor_profile_id uuid references profiles (id),
  schedule_id uuid references schedules (id),
  application_id uuid references applications (id),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger scheduling_audit_logs_reject_mutation
before update or delete on scheduling_audit_logs
for each row execute function reject_append_only_mutation();

alter table schedules enable row level security;
alter table applications enable row level security;
alter table scheduling_audit_logs enable row level security;

create policy schedules_select_active_worker
on schedules
for select
using (is_active_worker(auth.uid()) or is_admin(auth.uid()));

create policy applications_select_own_or_admin
on applications
for select
using (auth.uid() = profile_id or is_admin(auth.uid()));
