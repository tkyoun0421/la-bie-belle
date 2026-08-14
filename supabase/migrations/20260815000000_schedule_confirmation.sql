alter table assignments
  add column hourly_wage_snapshot integer
    constraint assignments_hourly_wage_snapshot_positive check (hourly_wage_snapshot > 0);

alter table assignment_trainees
  add column hourly_wage_snapshot integer
    constraint assignment_trainees_hourly_wage_snapshot_positive check (hourly_wage_snapshot > 0);

create function confirm_schedule(target_schedule_id uuid) returns jsonb
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

  with position_counts as (
    select
      r.position_id,
      p.name as position_name,
      r.required_count,
      coalesce(ac.assigned_count, 0) as assigned_count,
      coalesce(tc.trainee_count, 0) as trainee_count
    from schedule_position_requirements r
    join positions p on p.id = r.position_id
    left join (
      select ap.position_id, count(*)::int as assigned_count
        from assignment_positions ap
        join assignments asg on asg.id = ap.assignment_id
        where asg.schedule_id = target_schedule_id
        group by ap.position_id
    ) ac on ac.position_id = r.position_id
    left join (
      select at.position_id, count(*)::int as trainee_count
        from assignment_trainees at
        where at.schedule_id = target_schedule_id
        group by at.position_id
    ) tc on tc.position_id = r.position_id
    where r.schedule_id = target_schedule_id
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

  return jsonb_build_object('revision', target_revision, 'warnings', warnings);
end;
$$;

revoke execute on function confirm_schedule(uuid) from public, anon, authenticated, service_role;
grant execute on function confirm_schedule(uuid) to authenticated;
