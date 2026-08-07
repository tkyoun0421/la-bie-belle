create function open_recruitment_schedules(work_dates date[], application_deadline date)
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

  return jsonb_build_object('created_count', batch_size, 'conflict_dates', '[]'::jsonb);
end;
$$;
