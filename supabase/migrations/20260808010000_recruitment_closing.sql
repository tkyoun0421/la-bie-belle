create function close_due_recruitment_schedules() returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  today_kst date := (now() at time zone 'Asia/Seoul')::date;
  closed_ids uuid[];
  closed_count int;
begin
  with due as (
    select id
    from schedules
    where status = 'OPEN' and application_deadline < today_kst
    order by id
    for update
  ),
  updated as (
    update schedules
    set status = 'CLOSED'
    where id in (select id from due)
    returning id
  )
  select coalesce(array_agg(id), array[]::uuid[]) into closed_ids from updated;

  closed_count := coalesce(array_length(closed_ids, 1), 0);

  if closed_count > 0 then
    insert into scheduling_audit_logs (event, schedule_id, detail)
    select 'schedule_closed', id, jsonb_build_object('trigger', 'cron')
    from unnest(closed_ids) as id;
  end if;

  return jsonb_build_object('closed_count', closed_count);
end;
$$;

revoke execute on function close_due_recruitment_schedules() from public, anon, authenticated, service_role;
grant execute on function close_due_recruitment_schedules() to service_role;

create function extend_recruitment_deadline(target_schedule_id uuid, new_deadline date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  target_work_date date;
  previous_deadline date;
  today_kst date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status, work_date, application_deadline
    into target_status, target_work_date, previous_deadline
    from schedules
    where id = target_schedule_id
    for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status <> 'OPEN' then
    raise exception '연장은 OPEN 상태에서만 가능합니다' using errcode = '22023';
  end if;

  if new_deadline < today_kst or target_work_date < today_kst then
    raise exception '마감일은 오늘(KST) 이전일 수 없습니다' using errcode = 'LB021';
  end if;

  update schedules
    set application_deadline = new_deadline
    where id = target_schedule_id;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'deadline_extended',
    actor_id,
    target_schedule_id,
    jsonb_build_object('previous_deadline', previous_deadline, 'new_deadline', new_deadline)
  );
end;
$$;

revoke execute on function extend_recruitment_deadline(uuid, date)
  from public, anon, authenticated, service_role;
grant execute on function extend_recruitment_deadline(uuid, date) to authenticated;

create function reopen_recruitment_schedule(target_schedule_id uuid, new_deadline date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  target_work_date date;
  today_kst date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status, work_date
    into target_status, target_work_date
    from schedules
    where id = target_schedule_id
    for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status <> 'CLOSED' then
    raise exception '재오픈은 CLOSED 상태에서만 가능합니다' using errcode = '22023';
  end if;

  if new_deadline < today_kst or target_work_date < today_kst then
    raise exception '마감일은 오늘(KST) 이전일 수 없습니다' using errcode = 'LB021';
  end if;

  update schedules
    set status = 'OPEN', application_deadline = new_deadline
    where id = target_schedule_id;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'schedule_reopened',
    actor_id,
    target_schedule_id,
    jsonb_build_object('new_deadline', new_deadline)
  );
end;
$$;

revoke execute on function reopen_recruitment_schedule(uuid, date)
  from public, anon, authenticated, service_role;
grant execute on function reopen_recruitment_schedule(uuid, date) to authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'close-due-recruitments',
  '5 15 * * *',
  $$select close_due_recruitment_schedules()$$
);
