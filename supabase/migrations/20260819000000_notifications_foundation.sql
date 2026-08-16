create type notification_outbox_status as enum ('PENDING', 'SENT', 'FAILED', 'DEAD');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id),
  event_type text not null,
  aggregate_id uuid not null,
  revision integer not null,
  title text not null,
  body text not null,
  target jsonb not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (event_type, aggregate_id, recipient_id, revision)
);

create table notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notifications (id) unique,
  status notification_outbox_status not null default 'PENDING',
  attempt_count integer not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

alter table notifications enable row level security;
alter table notification_outbox enable row level security;
alter table push_subscriptions enable row level security;

create policy notifications_select_own
on notifications
for select
using (auth.uid() = recipient_id);

create policy push_subscriptions_select_own
on push_subscriptions
for select
using (auth.uid() = profile_id);

create function mark_notification_read(target_notification_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications
    set read_at = now()
    where id = target_notification_id
      and recipient_id = auth.uid()
      and read_at is null;
end;
$$;

revoke execute on function mark_notification_read(uuid) from public, anon, authenticated, service_role;
grant execute on function mark_notification_read(uuid) to authenticated;

create function mark_all_notifications_read() returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update notifications
    set read_at = now()
    where recipient_id = auth.uid()
      and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke execute on function mark_all_notifications_read() from public, anon, authenticated, service_role;
grant execute on function mark_all_notifications_read() to authenticated;

create or replace function confirm_schedule(target_schedule_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  target_revision integer;
  target_planned_checkin time;
  ceremony_count int;
  requirement_count int;
  missing_wage_exists boolean;
  understaffed_warnings jsonb;
  no_manager_warnings jsonb;
  warnings jsonb;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status, revision, planned_checkin
    into target_status, target_revision, target_planned_checkin
    from schedules
    where id = target_schedule_id
    for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status in ('CONFIRMED', 'CANCELLED') then
    raise exception '확정할 수 없는 상태예요' using errcode = 'LB029';
  end if;

  select count(*) into ceremony_count
    from ceremonies
    where schedule_id = target_schedule_id;

  if ceremony_count = 0 then
    raise exception '예식을 먼저 만들어 주세요' using errcode = 'LB026';
  end if;

  if target_planned_checkin is null then
    raise exception '예정 출퇴근 시각을 먼저 설정해 주세요' using errcode = 'LB027';
  end if;

  select count(*) into requirement_count
    from schedule_position_requirements
    where schedule_id = target_schedule_id;

  if requirement_count = 0 then
    raise exception '필요 인원 표를 먼저 열어 주세요' using errcode = 'LB028';
  end if;

  missing_wage_exists := (
    exists (
      select 1
        from assignments asg
        join profiles pr on pr.id = asg.profile_id
        where asg.schedule_id = target_schedule_id and pr.hourly_wage is null
    )
    or exists (
      select 1
        from assignment_trainees at
        join profiles pr on pr.id = at.profile_id
        where at.schedule_id = target_schedule_id and pr.hourly_wage is null
    )
  );

  if missing_wage_exists then
    raise exception '시급이 설정되지 않은 근무자가 있어요' using errcode = 'LB030';
  end if;

  with relevant_positions as (
    select position_id from schedule_position_requirements where schedule_id = target_schedule_id
    union
    select position_id from assignment_trainees where schedule_id = target_schedule_id
  ),
  position_counts as (
    select
      rp.position_id,
      p.name as position_name,
      coalesce(r.required_count, 0) as required_count,
      coalesce(ac.assigned_count, 0) as assigned_count,
      coalesce(tc.trainee_count, 0) as trainee_count
    from relevant_positions rp
    join positions p on p.id = rp.position_id
    left join schedule_position_requirements r
      on r.schedule_id = target_schedule_id and r.position_id = rp.position_id
    left join (
      select ap.position_id, count(*)::int as assigned_count
        from assignment_positions ap
        join assignments asg on asg.id = ap.assignment_id
        where asg.schedule_id = target_schedule_id
        group by ap.position_id
    ) ac on ac.position_id = rp.position_id
    left join (
      select at.position_id, count(*)::int as trainee_count
        from assignment_trainees at
        where at.schedule_id = target_schedule_id
        group by at.position_id
    ) tc on tc.position_id = rp.position_id
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'position_id', position_id,
          'position_name', position_name,
          'required_count', required_count,
          'assigned_count', assigned_count
        )
        order by position_name
      ) filter (where required_count > assigned_count),
      '[]'::jsonb
    ),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'position_id', position_id,
          'position_name', position_name,
          'trainee_count', trainee_count
        )
        order by position_name
      ) filter (where assigned_count = 0 and trainee_count >= 1),
      '[]'::jsonb
    )
    into understaffed_warnings, no_manager_warnings
  from position_counts;

  warnings := jsonb_build_object(
    'understaffed', understaffed_warnings,
    'no_manager', no_manager_warnings
  );

  update assignments asg
    set hourly_wage_snapshot = pr.hourly_wage
    from profiles pr
    where pr.id = asg.profile_id and asg.schedule_id = target_schedule_id;

  update assignment_trainees at
    set hourly_wage_snapshot = pr.hourly_wage
    from profiles pr
    where pr.id = at.profile_id and at.schedule_id = target_schedule_id;

  if target_status = 'OPEN' then
    update schedules set status = 'CLOSED' where id = target_schedule_id;

    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
    values (
      'schedule_closed', actor_id, target_schedule_id, jsonb_build_object('trigger', 'confirmation')
    );
  end if;

  if target_status in ('OPEN', 'CLOSED') then
    update schedules set status = 'PREPARING' where id = target_schedule_id;
  end if;

  update schedules set status = 'CONFIRMED' where id = target_schedule_id;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'schedule_confirmed',
    actor_id,
    target_schedule_id,
    jsonb_build_object('revision', target_revision, 'warnings', warnings)
  );

  with recipients as (
    select profile_id from assignments where schedule_id = target_schedule_id
    union
    select profile_id from assignment_trainees where schedule_id = target_schedule_id
  ),
  inserted_notifications as (
    insert into notifications (recipient_id, event_type, aggregate_id, revision, title, body, target)
    select
      recipients.profile_id,
      'schedule_confirmed',
      target_schedule_id,
      target_revision,
      '근무 배정이 확정됐어요',
      to_char(s.work_date, 'FMMM"월 "FMDD"일 근무가 확정됐어요"'),
      jsonb_build_object('screen', 'schedule-detail', 'date', s.work_date)
    from recipients
    join schedules s on s.id = target_schedule_id
    on conflict (event_type, aggregate_id, recipient_id, revision) do nothing
    returning id
  )
  insert into notification_outbox (notification_id)
  select id from inserted_notifications
  on conflict (notification_id) do nothing;

  return jsonb_build_object('revision', target_revision, 'warnings', warnings);
end;
$$;

revoke execute on function confirm_schedule(uuid) from public, anon, authenticated, service_role;
grant execute on function confirm_schedule(uuid) to authenticated;
