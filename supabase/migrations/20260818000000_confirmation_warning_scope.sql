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

  return jsonb_build_object('revision', target_revision, 'warnings', warnings);
end;
$$;

create or replace function replace_position_assignments(
  target_schedule_id uuid,
  target_position_id uuid,
  profile_ids uuid[],
  trainee_profile_ids uuid[] default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  position_active boolean;
  trainee_touched boolean := trainee_profile_ids is not null;
  candidate_ids uuid[];
  trainee_ids uuid[];
  candidate_id uuid;
  candidate_eligible boolean;
  candidate_ineligible_reason text;
  previous_ids uuid[];
  previous_trainee_ids uuid[];
  added_ids uuid[];
  removed_ids uuid[];
  added_trainee_ids uuid[];
  removed_trainee_ids uuid[];
  added_count int;
  removed_count int;
  new_count int;
  added_trainee_count int := 0;
  removed_trainee_count int := 0;
  new_trainee_count int := 0;
  conflicting_id uuid;
  wageless_id uuid;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status
    from schedules
    where id = target_schedule_id
    for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status = 'CANCELLED' then
    raise exception '확정되었거나 취소된 스케줄의 배정은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  select is_active
    into position_active
    from positions
    where id = target_position_id;

  if not found then
    raise exception '포지션을 찾을 수 없습니다' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct x), array[]::uuid[])
    into candidate_ids
    from unnest(profile_ids) as x
    where x is not null;

  if trainee_touched then
    select coalesce(array_agg(distinct x), array[]::uuid[])
      into trainee_ids
      from unnest(trainee_profile_ids) as x
      where x is not null;

    select x into conflicting_id
      from unnest(candidate_ids) as x
      where x = any(trainee_ids)
      limit 1;

    if conflicting_id is not null then
      raise exception '정식 배정과 교육생을 동시에 선택할 수 없습니다' using errcode = 'LB024';
    end if;
  end if;

  select coalesce(array_agg(asg.profile_id), array[]::uuid[])
    into previous_ids
    from assignments asg
    join assignment_positions ap on ap.assignment_id = asg.id
    where asg.schedule_id = target_schedule_id
      and ap.position_id = target_position_id;

  select coalesce(array_agg(pid), array[]::uuid[]) into added_ids
    from (
      select unnest(candidate_ids) as pid
      except
      select unnest(previous_ids)
    ) as diff;
  select coalesce(array_agg(pid), array[]::uuid[]) into removed_ids
    from (
      select unnest(previous_ids) as pid
      except
      select unnest(candidate_ids)
    ) as diff;

  if trainee_touched then
    select coalesce(array_agg(at.profile_id), array[]::uuid[])
      into previous_trainee_ids
      from assignment_trainees at
      where at.schedule_id = target_schedule_id
        and at.position_id = target_position_id;

    select coalesce(array_agg(pid), array[]::uuid[]) into added_trainee_ids
      from (
        select unnest(trainee_ids) as pid
        except
        select unnest(previous_trainee_ids)
      ) as diff;
    select coalesce(array_agg(pid), array[]::uuid[]) into removed_trainee_ids
      from (
        select unnest(previous_trainee_ids) as pid
        except
        select unnest(trainee_ids)
      ) as diff;
  end if;

  if not position_active
    and (
      coalesce(array_length(added_ids, 1), 0) > 0
      or coalesce(array_length(added_trainee_ids, 1), 0) > 0
    )
  then
    raise exception '비활성 포지션에는 배정할 수 없습니다' using errcode = '22023';
  end if;

  foreach candidate_id in array added_ids loop
    select elig.eligible, elig.ineligible_reason
      into candidate_eligible, candidate_ineligible_reason
      from assignment_eligibility(target_position_id, candidate_id) as elig;

    if not candidate_eligible then
      if candidate_ineligible_reason = 'GENDER_MISMATCH' then
        raise exception '포지션 성별 조건에 맞지 않습니다' using errcode = 'LB023';
      elsif candidate_ineligible_reason = 'NOT_ELIGIBLE' then
        raise exception '가능 포지션으로 등록되지 않았습니다' using errcode = 'LB023';
      else
        raise exception '활성 근무자만 배정할 수 있습니다' using errcode = 'LB023';
      end if;
    end if;
  end loop;

  if trainee_touched then
    foreach candidate_id in array added_trainee_ids loop
      select elig.eligible, elig.ineligible_reason
        into candidate_eligible, candidate_ineligible_reason
        from assignment_eligibility(target_position_id, candidate_id) as elig;

      if not candidate_eligible and candidate_ineligible_reason is distinct from 'NOT_ELIGIBLE' then
        if candidate_ineligible_reason = 'GENDER_MISMATCH' then
          raise exception '포지션 성별 조건에 맞지 않습니다' using errcode = 'LB023';
        else
          raise exception '활성 근무자만 배정할 수 있습니다' using errcode = 'LB023';
        end if;
      end if;
    end loop;
  end if;

  select at.profile_id into conflicting_id
    from assignment_trainees at
    where at.schedule_id = target_schedule_id
      and at.profile_id = any(added_ids)
      and not (trainee_touched and at.profile_id = any(removed_trainee_ids))
    limit 1;

  if conflicting_id is not null then
    raise exception '이미 교육생으로 등록되어 있어 정식 배정할 수 없습니다' using errcode = 'LB024';
  end if;

  if trainee_touched then
    select ap.position_id into conflicting_id
      from assignment_positions ap
      join assignments asg on asg.id = ap.assignment_id
      where asg.schedule_id = target_schedule_id
        and asg.profile_id = any(added_trainee_ids)
        and ap.position_id <> target_position_id
      limit 1;

    if conflicting_id is not null then
      raise exception '이미 다른 포지션에 정식 배정되어 있어 교육생으로 지정할 수 없습니다'
        using errcode = 'LB024';
    end if;

    select at.profile_id into conflicting_id
      from assignment_trainees at
      where at.schedule_id = target_schedule_id
        and at.profile_id = any(added_trainee_ids)
        and at.position_id <> target_position_id
      limit 1;

    if conflicting_id is not null then
      raise exception '이미 다른 포지션의 교육생으로 등록되어 있습니다' using errcode = 'LB025';
    end if;
  end if;

  if target_status = 'CONFIRMED' then
    select pr.id into wageless_id
      from unnest(added_ids) as pid
      join profiles pr on pr.id = pid
      where pr.hourly_wage is null
      limit 1;

    if wageless_id is not null then
      raise exception '시급이 설정되지 않은 근무자가 있어요' using errcode = 'LB030';
    end if;

    if trainee_touched then
      select pr.id into wageless_id
        from unnest(added_trainee_ids) as pid
        join profiles pr on pr.id = pid
        where pr.hourly_wage is null
        limit 1;

      if wageless_id is not null then
        raise exception '시급이 설정되지 않은 근무자가 있어요' using errcode = 'LB030';
      end if;
    end if;
  end if;

  added_count := coalesce(array_length(added_ids, 1), 0);
  removed_count := coalesce(array_length(removed_ids, 1), 0);
  new_count := coalesce(array_length(candidate_ids, 1), 0);

  if trainee_touched then
    added_trainee_count := coalesce(array_length(added_trainee_ids, 1), 0);
    removed_trainee_count := coalesce(array_length(removed_trainee_ids, 1), 0);
    new_trainee_count := coalesce(array_length(trainee_ids, 1), 0);
  end if;

  if added_count = 0 and removed_count = 0 and added_trainee_count = 0 and removed_trainee_count = 0
  then
    if target_status = 'CONFIRMED' then
      perform bump_confirmed_revision(
        target_schedule_id,
        'position_assignments',
        jsonb_build_object(
          'position_id', target_position_id,
          'profile_ids', to_jsonb(candidate_ids),
          'trainee_profile_ids', case when trainee_touched then to_jsonb(trainee_ids) else null end
        ),
        jsonb_build_object(
          'position_id', target_position_id,
          'profile_ids', to_jsonb(candidate_ids),
          'trainee_profile_ids', case when trainee_touched then to_jsonb(trainee_ids) else null end
        )
      );
    end if;
    return jsonb_build_object('assigned_count', new_count, 'changed', false);
  end if;

  if added_count > 0 or removed_count > 0 then
    insert into assignments (schedule_id, profile_id)
    select target_schedule_id, x
      from unnest(added_ids) as x
    on conflict (schedule_id, profile_id) do nothing;

    insert into assignment_positions (assignment_id, position_id)
    select asg.id, target_position_id
      from assignments asg
      where asg.schedule_id = target_schedule_id
        and asg.profile_id = any(added_ids)
    on conflict (assignment_id, position_id) do nothing;

    if target_status = 'CONFIRMED' then
      update assignments asg
        set hourly_wage_snapshot = pr.hourly_wage
        from profiles pr
        where pr.id = asg.profile_id
          and asg.schedule_id = target_schedule_id
          and asg.profile_id = any(added_ids)
          and asg.hourly_wage_snapshot is null;
    end if;

    delete from assignment_positions ap
    using assignments asg
    where ap.assignment_id = asg.id
      and asg.schedule_id = target_schedule_id
      and ap.position_id = target_position_id
      and asg.profile_id = any(removed_ids);

    delete from assignments asg
    where asg.schedule_id = target_schedule_id
      and asg.profile_id = any(removed_ids)
      and not exists (select 1 from assignment_positions ap where ap.assignment_id = asg.id);

    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
    values (
      'assignment_positions_replaced',
      actor_id,
      target_schedule_id,
      jsonb_build_object(
        'position_id', target_position_id,
        'added_count', added_count,
        'removed_count', removed_count,
        'previous_count', coalesce(array_length(previous_ids, 1), 0),
        'new_count', new_count
      )
    );
  end if;

  if added_trainee_count > 0 or removed_trainee_count > 0 then
    delete from assignment_trainees at
    where at.schedule_id = target_schedule_id
      and at.position_id = target_position_id
      and at.profile_id = any(removed_trainee_ids);

    insert into assignment_trainees (schedule_id, position_id, profile_id)
    select target_schedule_id, target_position_id, x
      from unnest(added_trainee_ids) as x
    on conflict (schedule_id, profile_id) do nothing;

    if target_status = 'CONFIRMED' then
      update assignment_trainees at
        set hourly_wage_snapshot = pr.hourly_wage
        from profiles pr
        where pr.id = at.profile_id
          and at.schedule_id = target_schedule_id
          and at.position_id = target_position_id
          and at.profile_id = any(added_trainee_ids)
          and at.hourly_wage_snapshot is null;
    end if;

    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
    values (
      'assignment_trainees_replaced',
      actor_id,
      target_schedule_id,
      jsonb_build_object(
        'position_id', target_position_id,
        'added_count', added_trainee_count,
        'removed_count', removed_trainee_count,
        'previous_count', coalesce(array_length(previous_trainee_ids, 1), 0),
        'new_count', new_trainee_count
      )
    );
  end if;

  if target_status = 'CONFIRMED' then
    perform bump_confirmed_revision(
      target_schedule_id,
      'position_assignments',
      jsonb_build_object(
        'position_id', target_position_id,
        'profile_ids', to_jsonb(previous_ids),
        'trainee_profile_ids', case when trainee_touched then to_jsonb(previous_trainee_ids) else null end
      ),
      jsonb_build_object(
        'position_id', target_position_id,
        'profile_ids', to_jsonb(candidate_ids),
        'trainee_profile_ids', case when trainee_touched then to_jsonb(trainee_ids) else null end
      )
    );
  end if;

  return jsonb_build_object('assigned_count', new_count, 'changed', true);
end;
$$;
