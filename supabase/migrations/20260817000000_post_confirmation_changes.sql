create or replace function enforce_schedule_status_transition() returns trigger
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
    or (old.status = 'CONFIRMED' and new.status = 'CANCELLED')
  then
    return new;
  end if;

  raise exception '스케줄 상태 전이 %→%는 허용되지 않습니다', old.status, new.status
    using errcode = 'LB020';
end;
$$;

create function bump_confirmed_revision(
  target_schedule_id uuid, section text, before_detail jsonb, after_detail jsonb
) returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  new_revision integer;
begin
  update schedules
    set revision = revision + 1
    where id = target_schedule_id
    returning revision into new_revision;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'schedule_revised',
    actor_id,
    target_schedule_id,
    jsonb_build_object(
      'section', section, 'before', before_detail, 'after', after_detail, 'revision', new_revision
    )
  );

  return new_revision;
end;
$$;

revoke execute on function bump_confirmed_revision(uuid, text, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create or replace function replace_schedule_ceremonies(target_schedule_id uuid, ceremony_times time[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  ceremony_count int;
  distinct_count int;
  sorted_times time[];
  previous_times time[];
  did_change boolean := false;
  previous_times_json jsonb;
  new_times_json jsonb;
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
    raise exception '확정되었거나 취소된 스케줄의 예식은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  ceremony_count := coalesce(array_length(ceremony_times, 1), 0);

  if target_status = 'CONFIRMED' and ceremony_count = 0 then
    raise exception '확정된 스케줄에는 예식이 하나 이상 필요해요' using errcode = 'LB033';
  end if;

  if ceremony_count < 1 or ceremony_count > 12 then
    raise exception '예식 개수는 1개 이상 12개 이하여야 합니다' using errcode = '22023';
  end if;

  select count(distinct t) into distinct_count from unnest(ceremony_times) as t;
  if distinct_count <> ceremony_count then
    raise exception '같은 시각의 예식을 중복으로 등록할 수 없습니다' using errcode = '22023';
  end if;

  select array_agg(t order by t) into sorted_times from unnest(ceremony_times) as t;

  select coalesce(array_agg(starts_at order by starts_at), array[]::time[])
    into previous_times
    from ceremonies
    where schedule_id = target_schedule_id;

  if previous_times is distinct from sorted_times then
    delete from ceremonies where schedule_id = target_schedule_id;

    insert into ceremonies (schedule_id, starts_at)
    select target_schedule_id, t from unnest(sorted_times) as t;

    did_change := true;

    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
    values (
      'ceremonies_replaced',
      actor_id,
      target_schedule_id,
      jsonb_build_object(
        'previous_ceremony_times',
        (select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb) from unnest(previous_times) as t),
        'new_ceremony_times',
        (select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb) from unnest(sorted_times) as t)
      )
    );
  end if;

  if target_status = 'CONFIRMED' then
    previous_times_json := (
      select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb)
        from unnest(previous_times) as t
    );
    new_times_json := (
      select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb)
        from unnest(sorted_times) as t
    );

    perform bump_confirmed_revision(
      target_schedule_id,
      'ceremonies',
      jsonb_build_object('ceremony_times', previous_times_json),
      jsonb_build_object('ceremony_times', new_times_json)
    );
  end if;

  return jsonb_build_object(
    'ceremony_times',
    (select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb) from unnest(sorted_times) as t),
    'changed',
    did_change
  );
end;
$$;

create or replace function set_schedule_planned_times(target_schedule_id uuid, checkin time, checkout time)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  previous_checkin time;
  previous_checkout time;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status, planned_checkin, planned_checkout
    into target_status, previous_checkin, previous_checkout
    from schedules
    where id = target_schedule_id
    for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status = 'CANCELLED' then
    raise exception '확정되었거나 취소된 스케줄의 예정 시각은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  if checkin is null or checkout is null then
    raise exception '출근·퇴근 시각을 모두 입력해야 합니다' using errcode = '22023';
  end if;

  if checkin >= checkout then
    raise exception '출근 시간은 퇴근 시간보다 이전이어야 합니다' using errcode = '22023';
  end if;

  if previous_checkin is not distinct from checkin and previous_checkout is not distinct from checkout then
    if target_status = 'CONFIRMED' then
      perform bump_confirmed_revision(
        target_schedule_id,
        'planned_times',
        jsonb_build_object(
          'checkin', to_char(previous_checkin, 'HH24:MI'), 'checkout', to_char(previous_checkout, 'HH24:MI')
        ),
        jsonb_build_object('checkin', to_char(checkin, 'HH24:MI'), 'checkout', to_char(checkout, 'HH24:MI'))
      );
    end if;
    return;
  end if;

  update schedules
    set planned_checkin = checkin, planned_checkout = checkout
    where id = target_schedule_id;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'planned_times_set',
    actor_id,
    target_schedule_id,
    jsonb_build_object(
      'previous_checkin', to_char(previous_checkin, 'HH24:MI'),
      'previous_checkout', to_char(previous_checkout, 'HH24:MI'),
      'new_checkin', to_char(checkin, 'HH24:MI'),
      'new_checkout', to_char(checkout, 'HH24:MI')
    )
  );

  if target_status = 'CONFIRMED' then
    perform bump_confirmed_revision(
      target_schedule_id,
      'planned_times',
      jsonb_build_object(
        'checkin', to_char(previous_checkin, 'HH24:MI'), 'checkout', to_char(previous_checkout, 'HH24:MI')
      ),
      jsonb_build_object('checkin', to_char(checkin, 'HH24:MI'), 'checkout', to_char(checkout, 'HH24:MI'))
    );
  end if;
end;
$$;

create or replace function set_position_requirement(
  target_schedule_id uuid, target_position_id uuid, new_count int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  position_active boolean;
  existing_count int;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status from schedules where id = target_schedule_id for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status = 'CANCELLED' then
    raise exception '확정되었거나 취소된 스케줄의 필요 인원은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  if new_count is null or new_count < 0 then
    raise exception '필요 인원은 0 이상이어야 합니다' using errcode = '22023';
  end if;

  select required_count into existing_count
    from schedule_position_requirements
    where schedule_id = target_schedule_id and position_id = target_position_id;

  if not found then
    select is_active into position_active from positions where id = target_position_id;

    if position_active is distinct from true then
      raise exception '비활성 포지션은 새 필요 인원으로 추가할 수 없습니다' using errcode = '22023';
    end if;

    insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (target_schedule_id, target_position_id, new_count);

    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
    values (
      'requirement_set',
      actor_id,
      target_schedule_id,
      jsonb_build_object(
        'position_id', target_position_id, 'previous_count', null, 'new_count', new_count
      )
    );

    if target_status = 'CONFIRMED' then
      perform bump_confirmed_revision(
        target_schedule_id,
        'position_requirement',
        jsonb_build_object('position_id', target_position_id, 'required_count', null),
        jsonb_build_object('position_id', target_position_id, 'required_count', new_count)
      );
    end if;
    return;
  end if;

  if existing_count = new_count then
    if target_status = 'CONFIRMED' then
      perform bump_confirmed_revision(
        target_schedule_id,
        'position_requirement',
        jsonb_build_object('position_id', target_position_id, 'required_count', existing_count),
        jsonb_build_object('position_id', target_position_id, 'required_count', new_count)
      );
    end if;
    return;
  end if;

  update schedule_position_requirements
    set required_count = new_count
    where schedule_id = target_schedule_id and position_id = target_position_id;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'requirement_set',
    actor_id,
    target_schedule_id,
    jsonb_build_object(
      'position_id', target_position_id, 'previous_count', existing_count, 'new_count', new_count
    )
  );

  if target_status = 'CONFIRMED' then
    perform bump_confirmed_revision(
      target_schedule_id,
      'position_requirement',
      jsonb_build_object('position_id', target_position_id, 'required_count', existing_count),
      jsonb_build_object('position_id', target_position_id, 'required_count', new_count)
    );
  end if;
end;
$$;

create or replace function remove_position_requirement(target_schedule_id uuid, target_position_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  existing_count int;
  deleted_count int;
  remaining_rows int;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status from schedules where id = target_schedule_id for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status = 'CANCELLED' then
    raise exception '확정되었거나 취소된 스케줄의 필요 인원은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  select required_count into existing_count
    from schedule_position_requirements
    where schedule_id = target_schedule_id and position_id = target_position_id;

  if not found then
    return;
  end if;

  if target_status = 'CONFIRMED' then
    select count(*) into remaining_rows
      from schedule_position_requirements
      where schedule_id = target_schedule_id;

    if remaining_rows <= 1 then
      raise exception '확정된 스케줄에는 필요 인원 표가 필요해요' using errcode = 'LB034';
    end if;
  end if;

  delete from schedule_position_requirements
    where schedule_id = target_schedule_id and position_id = target_position_id;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    return;
  end if;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'requirement_removed',
    actor_id,
    target_schedule_id,
    jsonb_build_object(
      'position_id', target_position_id, 'previous_count', existing_count, 'new_count', null
    )
  );

  if target_status = 'CONFIRMED' then
    perform bump_confirmed_revision(
      target_schedule_id,
      'position_requirement',
      jsonb_build_object('position_id', target_position_id, 'required_count', existing_count),
      jsonb_build_object('position_id', target_position_id, 'required_count', null)
    );
  end if;
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

  if not position_active then
    raise exception '비활성 포지션에는 배정할 수 없습니다' using errcode = '22023';
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

create function cancel_confirmed_schedule(target_schedule_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  target_revision integer;
  assignment_count integer;
  trainee_count integer;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status, revision into target_status, target_revision
    from schedules
    where id = target_schedule_id
    for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status <> 'CONFIRMED' then
    raise exception '취소할 수 없는 상태예요' using errcode = 'LB032';
  end if;

  select count(distinct profile_id)::int into assignment_count
    from assignments
    where schedule_id = target_schedule_id;

  select count(*)::int into trainee_count
    from assignment_trainees
    where schedule_id = target_schedule_id;

  update schedules set status = 'CANCELLED' where id = target_schedule_id;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'schedule_cancelled',
    actor_id,
    target_schedule_id,
    jsonb_build_object(
      'revision', target_revision, 'assigned_count', assignment_count, 'trainee_count', trainee_count
    )
  );

  return jsonb_build_object('revision', target_revision);
end;
$$;

revoke execute on function cancel_confirmed_schedule(uuid)
  from public, anon, authenticated, service_role;
grant execute on function cancel_confirmed_schedule(uuid) to authenticated;

create or replace function get_confirmed_roster(target_schedule_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  target_revision integer;
  target_planned_checkin time;
  target_planned_checkout time;
  ceremony_times jsonb;
  roster_rows jsonb;
  confirmed_at timestamptz;
  revised_at timestamptz;
begin
  if not (is_active_worker(actor_id) or is_admin(actor_id)) then
    raise exception '승인된 근무자만 열람할 수 있습니다' using errcode = '42501';
  end if;

  select status, revision, planned_checkin, planned_checkout
    into target_status, target_revision, target_planned_checkin, target_planned_checkout
    from schedules
    where id = target_schedule_id;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status <> 'CONFIRMED' then
    raise exception '아직 확정되지 않은 스케줄이에요' using errcode = 'LB031';
  end if;

  select coalesce(jsonb_agg(to_char(starts_at, 'HH24:MI') order by starts_at), '[]'::jsonb)
    into ceremony_times
    from ceremonies
    where schedule_id = target_schedule_id;

  select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name', row_name,
          'position_name', row_position_name,
          'sort_order', row_sort_order,
          'is_trainee', row_is_trainee,
          'is_self', row_is_self
        )
        order by row_sort_order, row_position_name, row_name
      ),
      '[]'::jsonb
    )
    into roster_rows
    from (
      select
        pr.name as row_name,
        p.name as row_position_name,
        p.sort_order as row_sort_order,
        false as row_is_trainee,
        (a.profile_id = actor_id) as row_is_self
      from assignments a
      join assignment_positions ap on ap.assignment_id = a.id
      join positions p on p.id = ap.position_id
      join profiles pr on pr.id = a.profile_id
      where a.schedule_id = target_schedule_id
      union all
      select
        pr.name,
        p.name,
        p.sort_order,
        true,
        (at.profile_id = actor_id)
      from assignment_trainees at
      join positions p on p.id = at.position_id
      join profiles pr on pr.id = at.profile_id
      where at.schedule_id = target_schedule_id
    ) combined;

  select max(created_at) into revised_at
    from scheduling_audit_logs
    where schedule_id = target_schedule_id and event = 'schedule_revised';

  if revised_at is null then
    select created_at into confirmed_at
      from scheduling_audit_logs
      where schedule_id = target_schedule_id and event = 'schedule_confirmed'
      order by seq desc
      limit 1;

    revised_at := confirmed_at;
  end if;

  return jsonb_build_object(
    'planned_checkin', to_char(target_planned_checkin, 'HH24:MI'),
    'planned_checkout', to_char(target_planned_checkout, 'HH24:MI'),
    'ceremonies', ceremony_times,
    'roster', roster_rows,
    'revision', target_revision,
    'revised_at', revised_at
  );
end;
$$;
