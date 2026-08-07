create function apply_recruitment_changes(
  apply_schedule_ids uuid[],
  withdraw_schedule_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  clean_apply uuid[];
  clean_withdraw uuid[];
  target_ids uuid[];
  target_count int;
  locked_count int;
  blocked_dates date[];
  today_kst date := (now() at time zone 'Asia/Seoul')::date;
  applied_count int := 0;
  withdrawn_count int := 0;
  transitioned_events text[] := array[]::text[];
  transitioned_schedule_ids uuid[] := array[]::uuid[];
  transitioned_application_ids uuid[] := array[]::uuid[];
  sid uuid;
  existing_app_id uuid;
  existing_status application_status;
  inserted_app_id uuid;
begin
  if actor_id is null then
    raise exception '인증이 필요합니다' using errcode = '42501';
  end if;

  if not is_active_worker(actor_id) then
    raise exception '활성 근무자만 신청·철회할 수 있습니다' using errcode = '42501';
  end if;

  if apply_schedule_ids is not null
     and exists (select 1 from unnest(apply_schedule_ids) as elem where elem is null) then
    raise exception '신청 목록에 빈 값이 있습니다' using errcode = '22023';
  end if;
  if withdraw_schedule_ids is not null
     and exists (select 1 from unnest(withdraw_schedule_ids) as elem where elem is null) then
    raise exception '철회 목록에 빈 값이 있습니다' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct elem), array[]::uuid[])
    into clean_apply
    from unnest(apply_schedule_ids) as elem;
  select coalesce(array_agg(distinct elem), array[]::uuid[])
    into clean_withdraw
    from unnest(withdraw_schedule_ids) as elem;

  if array_length(clean_apply, 1) is null and array_length(clean_withdraw, 1) is null then
    raise exception '신청·철회 대상이 없습니다' using errcode = '22023';
  end if;

  if exists (select 1 from unnest(clean_apply) as elem where elem = any(clean_withdraw)) then
    raise exception '같은 스케줄을 신청과 철회에 동시에 포함할 수 없습니다' using errcode = '22023';
  end if;

  target_ids := clean_apply || clean_withdraw;
  target_count := coalesce(array_length(target_ids, 1), 0);

  perform 1 from schedules where id = any(target_ids) for update;

  select count(*) into locked_count from schedules where id = any(target_ids);

  if locked_count <> target_count then
    raise exception '존재하지 않는 스케줄이 포함되어 있습니다' using errcode = '22023';
  end if;

  select array_agg(work_date order by work_date)
    into blocked_dates
    from schedules
    where id = any(target_ids)
      and (status <> 'OPEN' or application_deadline < today_kst);

  if blocked_dates is not null and array_length(blocked_dates, 1) > 0 then
    return jsonb_build_object(
      'applied_count', 0,
      'withdrawn_count', 0,
      'blocked_dates', to_jsonb(blocked_dates)
    );
  end if;

  foreach sid in array clean_apply loop
    select id, status into existing_app_id, existing_status
      from applications
      where schedule_id = sid and profile_id = actor_id
      for update;

    if not found then
      insert into applications (schedule_id, profile_id, status)
      values (sid, actor_id, 'applied')
      returning id into inserted_app_id;

      applied_count := applied_count + 1;
      transitioned_events := array_append(transitioned_events, 'application_applied');
      transitioned_schedule_ids := array_append(transitioned_schedule_ids, sid);
      transitioned_application_ids := array_append(transitioned_application_ids, inserted_app_id);
    elsif existing_status = 'withdrawn' then
      update applications set status = 'applied' where id = existing_app_id;

      applied_count := applied_count + 1;
      transitioned_events := array_append(transitioned_events, 'application_applied');
      transitioned_schedule_ids := array_append(transitioned_schedule_ids, sid);
      transitioned_application_ids := array_append(transitioned_application_ids, existing_app_id);
    end if;
  end loop;

  foreach sid in array clean_withdraw loop
    select id, status into existing_app_id, existing_status
      from applications
      where schedule_id = sid and profile_id = actor_id
      for update;

    if found and existing_status = 'applied' then
      update applications set status = 'withdrawn' where id = existing_app_id;

      withdrawn_count := withdrawn_count + 1;
      transitioned_events := array_append(transitioned_events, 'application_withdrawn');
      transitioned_schedule_ids := array_append(transitioned_schedule_ids, sid);
      transitioned_application_ids := array_append(transitioned_application_ids, existing_app_id);
    end if;
  end loop;

  if array_length(transitioned_schedule_ids, 1) > 0 then
    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, application_id, detail)
    select t.event, actor_id, t.schedule_id, t.application_id,
           jsonb_build_object('batch_size', applied_count + withdrawn_count)
    from unnest(transitioned_events, transitioned_schedule_ids, transitioned_application_ids)
      as t(event, schedule_id, application_id);
  end if;

  return jsonb_build_object(
    'applied_count', applied_count,
    'withdrawn_count', withdrawn_count,
    'blocked_dates', '[]'::jsonb
  );
end;
$$;
