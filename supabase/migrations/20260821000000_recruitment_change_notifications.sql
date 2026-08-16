create function notify_schedule_recipients(
  p_event_type text,
  p_aggregate_id uuid,
  p_revision integer,
  p_recipient_ids uuid[],
  p_title text,
  p_body text,
  p_target jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  with recipients as (
    select distinct pid
    from unnest(p_recipient_ids) as pid
    where pid is not null
  ),
  inserted_notifications as (
    insert into notifications (recipient_id, event_type, aggregate_id, revision, title, body, target)
    select recipients.pid, p_event_type, p_aggregate_id, p_revision, p_title, p_body, p_target
    from recipients
    on conflict (event_type, aggregate_id, recipient_id, revision) do nothing
    returning id
  )
  insert into notification_outbox (notification_id)
  select id from inserted_notifications
  on conflict (notification_id) do nothing;
end;
$$;

revoke execute on function notify_schedule_recipients(text, uuid, integer, uuid[], text, text, jsonb)
  from public, anon, authenticated, service_role;

create or replace function open_recruitment_schedules(work_dates date[], application_deadline date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  clean_dates date[];
  conflict_dates date[];
  batch_size int;
  aggregate_schedule_id uuid;
  recipient_ids uuid[];
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  if work_dates is null or array_length(work_dates, 1) is null then
    raise exception '근무일 목록이 비어 있습니다' using errcode = '22023';
  end if;

  if exists (select 1 from unnest(work_dates) as wd where wd is null) then
    raise exception '근무일 목록에 빈 값이 있습니다' using errcode = '22023';
  end if;

  select array_agg(distinct wd order by wd) into clean_dates from unnest(work_dates) as wd;

  select array_agg(s.work_date order by s.work_date)
    into conflict_dates
    from schedules s
    where s.work_date = any(clean_dates) and s.status <> 'CANCELLED';

  if conflict_dates is not null and array_length(conflict_dates, 1) > 0 then
    return jsonb_build_object('created_count', 0, 'conflict_dates', to_jsonb(conflict_dates));
  end if;

  batch_size := array_length(clean_dates, 1);

  with inserted as (
    insert into schedules (work_date, application_deadline)
    select wd, application_deadline
    from unnest(clean_dates) as wd
    returning id
  )
  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  select 'schedule_opened', actor_id, id, jsonb_build_object('batch_size', batch_size)
  from inserted;

  select id into aggregate_schedule_id
    from schedules
    where work_date = clean_dates[1] and status <> 'CANCELLED';

  select coalesce(array_agg(id), array[]::uuid[])
    into recipient_ids
    from profiles
    where is_active_worker(id);

  perform notify_schedule_recipients(
    'recruitment_opened',
    aggregate_schedule_id,
    1,
    recipient_ids,
    '새 근무 모집이 열렸어요',
    to_char(clean_dates[1], 'FMMM"월 "FMDD"일"') || '~' ||
      to_char(clean_dates[array_length(clean_dates, 1)], 'FMMM"월 "FMDD"일"') || ' 근무 모집이 열렸어요',
    jsonb_build_object('screen', 'schedule', 'month', to_char(clean_dates[1], 'YYYY-MM'))
  );

  return jsonb_build_object('created_count', batch_size, 'conflict_dates', '[]'::jsonb);
end;
$$;

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
  new_confirmed_revision integer;
  notify_work_date date;
  notify_recipient_ids uuid[];
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

    select bump_confirmed_revision(
      target_schedule_id,
      'ceremonies',
      jsonb_build_object('ceremony_times', previous_times_json),
      jsonb_build_object('ceremony_times', new_times_json)
    ) into new_confirmed_revision;

    select work_date into notify_work_date from schedules where id = target_schedule_id;

    select coalesce(array_agg(distinct pid), array[]::uuid[])
      into notify_recipient_ids
      from (
        select profile_id as pid from assignments where schedule_id = target_schedule_id
        union
        select profile_id as pid from assignment_trainees where schedule_id = target_schedule_id
      ) recipients;

    perform notify_schedule_recipients(
      'schedule_revised',
      target_schedule_id,
      new_confirmed_revision,
      notify_recipient_ids,
      '확정 근무가 변경됐어요',
      to_char(notify_work_date, 'FMMM"월 "FMDD"일 근무 내용이 바뀌었어요"'),
      jsonb_build_object('screen', 'schedule-detail', 'date', notify_work_date)
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
  new_confirmed_revision integer;
  notify_work_date date;
  notify_recipient_ids uuid[];
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

  select work_date into notify_work_date from schedules where id = target_schedule_id;

  select coalesce(array_agg(distinct pid), array[]::uuid[])
    into notify_recipient_ids
    from (
      select profile_id as pid from assignments where schedule_id = target_schedule_id
      union
      select profile_id as pid from assignment_trainees where schedule_id = target_schedule_id
    ) recipients;

  if previous_checkin is not distinct from checkin and previous_checkout is not distinct from checkout then
    if target_status = 'CONFIRMED' then
      select bump_confirmed_revision(
        target_schedule_id,
        'planned_times',
        jsonb_build_object(
          'checkin', to_char(previous_checkin, 'HH24:MI'), 'checkout', to_char(previous_checkout, 'HH24:MI')
        ),
        jsonb_build_object('checkin', to_char(checkin, 'HH24:MI'), 'checkout', to_char(checkout, 'HH24:MI'))
      ) into new_confirmed_revision;

      perform notify_schedule_recipients(
        'schedule_revised',
        target_schedule_id,
        new_confirmed_revision,
        notify_recipient_ids,
        '확정 근무가 변경됐어요',
        to_char(notify_work_date, 'FMMM"월 "FMDD"일 근무 내용이 바뀌었어요"'),
        jsonb_build_object('screen', 'schedule-detail', 'date', notify_work_date)
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
    select bump_confirmed_revision(
      target_schedule_id,
      'planned_times',
      jsonb_build_object(
        'checkin', to_char(previous_checkin, 'HH24:MI'), 'checkout', to_char(previous_checkout, 'HH24:MI')
      ),
      jsonb_build_object('checkin', to_char(checkin, 'HH24:MI'), 'checkout', to_char(checkout, 'HH24:MI'))
    ) into new_confirmed_revision;

    perform notify_schedule_recipients(
      'schedule_revised',
      target_schedule_id,
      new_confirmed_revision,
      notify_recipient_ids,
      '확정 근무가 변경됐어요',
      to_char(notify_work_date, 'FMMM"월 "FMDD"일 근무 내용이 바뀌었어요"'),
      jsonb_build_object('screen', 'schedule-detail', 'date', notify_work_date)
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
  new_confirmed_revision integer;
  notify_work_date date;
  notify_schedule_before_ids uuid[];
  notify_schedule_after_ids uuid[];
  notify_recipient_ids uuid[];
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

  select work_date into notify_work_date from schedules where id = target_schedule_id;

  select coalesce(array_agg(distinct pid), array[]::uuid[])
    into notify_schedule_before_ids
    from (
      select asg.profile_id as pid
        from assignments asg
        where asg.schedule_id = target_schedule_id
      union
      select at.profile_id as pid
        from assignment_trainees at
        where at.schedule_id = target_schedule_id
    ) as roster;

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
      select bump_confirmed_revision(
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
      ) into new_confirmed_revision;

      select coalesce(array_agg(distinct pid), array[]::uuid[])
        into notify_schedule_after_ids
        from (
          select asg.profile_id as pid
            from assignments asg
            where asg.schedule_id = target_schedule_id
          union
          select at.profile_id as pid
            from assignment_trainees at
            where at.schedule_id = target_schedule_id
        ) as roster;

      select coalesce(array_agg(distinct pid), array[]::uuid[])
        into notify_recipient_ids
        from unnest(
          coalesce(notify_schedule_before_ids, array[]::uuid[])
            || coalesce(notify_schedule_after_ids, array[]::uuid[])
        ) as pid
        where pid is not null;

      perform notify_schedule_recipients(
        'schedule_revised',
        target_schedule_id,
        new_confirmed_revision,
        notify_recipient_ids,
        '확정 근무가 변경됐어요',
        to_char(notify_work_date, 'FMMM"월 "FMDD"일 근무 내용이 바뀌었어요"'),
        jsonb_build_object('screen', 'schedule-detail', 'date', notify_work_date)
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
    select bump_confirmed_revision(
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
    ) into new_confirmed_revision;

    select coalesce(array_agg(distinct pid), array[]::uuid[])
      into notify_schedule_after_ids
      from (
        select asg.profile_id as pid
          from assignments asg
          where asg.schedule_id = target_schedule_id
        union
        select at.profile_id as pid
          from assignment_trainees at
          where at.schedule_id = target_schedule_id
      ) as roster;

    select coalesce(array_agg(distinct pid), array[]::uuid[])
      into notify_recipient_ids
      from unnest(
        coalesce(notify_schedule_before_ids, array[]::uuid[])
          || coalesce(notify_schedule_after_ids, array[]::uuid[])
      ) as pid
      where pid is not null;

    perform notify_schedule_recipients(
      'schedule_revised',
      target_schedule_id,
      new_confirmed_revision,
      notify_recipient_ids,
      '확정 근무가 변경됐어요',
      to_char(notify_work_date, 'FMMM"월 "FMDD"일 근무 내용이 바뀌었어요"'),
      jsonb_build_object('screen', 'schedule-detail', 'date', notify_work_date)
    );
  end if;

  return jsonb_build_object('assigned_count', new_count, 'changed', true);
end;
$$;
