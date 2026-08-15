alter table positions add column sort_order integer not null default 1000;

update positions set sort_order = 10 where name = '팀장';
update positions set sort_order = 20 where name = '스캔';
update positions set sort_order = 30 where name = '메인';
update positions set sort_order = 40 where name = '드레스';
update positions set sort_order = 50 where name = '축가';
update positions set sort_order = 60 where name = '신부 대기실';
update positions set sort_order = 70 where name = '드레스실';
update positions set sort_order = 80 where name = '매니저';
update positions set sort_order = 90 where name = '안내';

create function get_confirmed_roster(target_schedule_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  target_planned_checkin time;
  target_planned_checkout time;
  ceremony_times jsonb;
  roster_rows jsonb;
begin
  if not (is_active_worker(actor_id) or is_admin(actor_id)) then
    raise exception '승인된 근무자만 열람할 수 있습니다' using errcode = '42501';
  end if;

  select status, planned_checkin, planned_checkout
    into target_status, target_planned_checkin, target_planned_checkout
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

  return jsonb_build_object(
    'planned_checkin', to_char(target_planned_checkin, 'HH24:MI'),
    'planned_checkout', to_char(target_planned_checkout, 'HH24:MI'),
    'ceremonies', ceremony_times,
    'roster', roster_rows
  );
end;
$$;

revoke execute on function get_confirmed_roster(uuid)
  from public, anon, authenticated, service_role;
grant execute on function get_confirmed_roster(uuid) to authenticated;
