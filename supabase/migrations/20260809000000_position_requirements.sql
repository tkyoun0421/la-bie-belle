create table schedule_position_requirements (
  schedule_id uuid not null references schedules (id),
  position_id uuid not null references positions (id) on delete restrict,
  required_count int not null default 0
    constraint schedule_position_requirements_count_non_negative check (required_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (schedule_id, position_id)
);

create trigger schedule_position_requirements_set_updated_at
before update on schedule_position_requirements
for each row execute function set_updated_at();

alter table schedule_position_requirements enable row level security;

create policy schedule_position_requirements_admin_all
on schedule_position_requirements
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy positions_admin_insert
on positions
for insert
with check (is_admin(auth.uid()));

create policy positions_admin_update
on positions
for update
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy positions_admin_delete
on positions
for delete
using (is_admin(auth.uid()));

create function copy_schedule_requirements(target_schedule_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  copied_count int;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status from schedules where id = target_schedule_id;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status = 'CANCELLED' then
    raise exception '취소된 스케줄에는 필요 인원을 생성할 수 없습니다' using errcode = 'LB020';
  end if;

  if exists (
    select 1 from schedule_position_requirements where schedule_id = target_schedule_id
  ) then
    return;
  end if;

  insert into schedule_position_requirements (schedule_id, position_id, required_count)
  select target_schedule_id, id, default_required_count
    from positions
    where is_active
  on conflict (schedule_id, position_id) do nothing;

  get diagnostics copied_count = row_count;

  if copied_count = 0 then
    return;
  end if;

  insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
  values (
    'requirements_copied',
    actor_id,
    target_schedule_id,
    jsonb_build_object('position_count', copied_count)
  );
end;
$$;

revoke execute on function copy_schedule_requirements(uuid)
  from public, anon, authenticated, service_role;
grant execute on function copy_schedule_requirements(uuid) to authenticated;

create function set_position_requirement(
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

  if target_status in ('CONFIRMED', 'CANCELLED') then
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
    return;
  end if;

  if existing_count = new_count then
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
end;
$$;

revoke execute on function set_position_requirement(uuid, uuid, int)
  from public, anon, authenticated, service_role;
grant execute on function set_position_requirement(uuid, uuid, int) to authenticated;

create function remove_position_requirement(target_schedule_id uuid, target_position_id uuid)
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
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status from schedules where id = target_schedule_id for update;

  if not found then
    raise exception '스케줄을 찾을 수 없습니다' using errcode = '22023';
  end if;

  if target_status in ('CONFIRMED', 'CANCELLED') then
    raise exception '확정되었거나 취소된 스케줄의 필요 인원은 변경할 수 없습니다' using errcode = 'LB020';
  end if;

  select required_count into existing_count
    from schedule_position_requirements
    where schedule_id = target_schedule_id and position_id = target_position_id;

  if not found then
    return;
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
end;
$$;

revoke execute on function remove_position_requirement(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function remove_position_requirement(uuid, uuid) to authenticated;

create function apply_new_position_to_open_schedules() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_schedule record;
begin
  if not new.is_active then
    return new;
  end if;

  for target_schedule in
    select s.id
      from schedules s
      where s.status not in ('CONFIRMED', 'CANCELLED')
        and exists (
          select 1 from schedule_position_requirements r where r.schedule_id = s.id
        )
  loop
    insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (target_schedule.id, new.id, new.default_required_count)
    on conflict (schedule_id, position_id) do nothing;

    insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
    values (
      'requirement_position_added',
      actor_id,
      target_schedule.id,
      jsonb_build_object('position_id', new.id, 'required_count', new.default_required_count)
    );
  end loop;

  return new;
end;
$$;

create trigger positions_apply_to_open_schedules
after insert on positions
for each row execute function apply_new_position_to_open_schedules();
