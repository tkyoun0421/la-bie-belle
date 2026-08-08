create table ceremonies (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules (id),
  starts_at time not null,
  unique (schedule_id, starts_at),
  constraint ceremonies_starts_at_minute_check check (extract(second from starts_at) = 0)
);

alter table ceremonies enable row level security;

create policy ceremonies_select_admin
on ceremonies
for select
using (is_admin(auth.uid()));

alter table schedules
  add column planned_checkin time,
  add column planned_checkout time,
  add constraint schedules_planned_times_pair_check
    check ((planned_checkin is null) = (planned_checkout is null)),
  add constraint schedules_planned_checkin_minute_check
    check (planned_checkin is null or extract(second from planned_checkin) = 0),
  add constraint schedules_planned_checkout_minute_check
    check (planned_checkout is null or extract(second from planned_checkout) = 0);

create policy check_in_rules_admin_all
on check_in_rules
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create function replace_schedule_ceremonies(target_schedule_id uuid, ceremony_times time[])
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

  if target_status in ('CONFIRMED', 'CANCELLED') then
    raise exception '확정되었거나 취소된 스케줄의 예식은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  ceremony_count := coalesce(array_length(ceremony_times, 1), 0);
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

  return jsonb_build_object(
    'ceremony_times',
    (select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb) from unnest(sorted_times) as t),
    'changed',
    did_change
  );
end;
$$;

revoke execute on function replace_schedule_ceremonies(uuid, time[])
  from public, anon, authenticated, service_role;
grant execute on function replace_schedule_ceremonies(uuid, time[]) to authenticated;

create function set_schedule_planned_times(target_schedule_id uuid, checkin time, checkout time)
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

  if target_status in ('CONFIRMED', 'CANCELLED') then
    raise exception '확정되었거나 취소된 스케줄의 예정 시각은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  if checkin is null or checkout is null then
    raise exception '출근·퇴근 시각을 모두 입력해야 합니다' using errcode = '22023';
  end if;

  if checkin >= checkout then
    raise exception '출근 시간은 퇴근 시간보다 이전이어야 합니다' using errcode = '22023';
  end if;

  if previous_checkin is not distinct from checkin and previous_checkout is not distinct from checkout then
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
end;
$$;

revoke execute on function set_schedule_planned_times(uuid, time, time)
  from public, anon, authenticated, service_role;
grant execute on function set_schedule_planned_times(uuid, time, time) to authenticated;
