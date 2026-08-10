create table assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules (id),
  profile_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (schedule_id, profile_id)
);

create table assignment_positions (
  assignment_id uuid not null references assignments (id) on delete cascade,
  position_id uuid not null references positions (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (assignment_id, position_id)
);

alter table assignments enable row level security;
alter table assignment_positions enable row level security;

create policy assignments_select_admin
on assignments
for select
using (is_admin(auth.uid()));

create policy assignment_positions_select_admin
on assignment_positions
for select
using (is_admin(auth.uid()));

create function assignment_eligibility(
  target_position_id uuid, target_profile_id uuid
) returns table (
  eligible boolean,
  ineligible_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  position_gender_requirement gender_requirement;
  position_is_default boolean;
  profile_status_value profile_status;
  profile_gender_value gender;
begin
  select p.gender_requirement, p.is_default
    into position_gender_requirement, position_is_default
    from positions p
    where p.id = target_position_id;

  select pr.status, pr.gender
    into profile_status_value, profile_gender_value
    from profiles pr
    where pr.id = target_profile_id;

  if profile_status_value is distinct from 'active' then
    return query select false, null::text;
    return;
  end if;

  if not (
    position_gender_requirement = 'any'
    or position_gender_requirement::text = profile_gender_value::text
  ) then
    return query select false, 'GENDER_MISMATCH'::text;
    return;
  end if;

  if not (
    position_is_default
    or exists (
      select 1
        from worker_position_eligibilities wpe
        where wpe.profile_id = target_profile_id and wpe.position_id = target_position_id
    )
  ) then
    return query select false, 'NOT_ELIGIBLE'::text;
    return;
  end if;

  return query select true, null::text;
end;
$$;

revoke execute on function assignment_eligibility(uuid, uuid)
  from public, anon, authenticated, service_role;

create function list_position_assignment_candidates(
  target_schedule_id uuid, target_position_id uuid
) returns table (
  profile_id uuid,
  name text,
  applied boolean,
  currently_assigned boolean,
  other_position_names text[],
  eligible boolean,
  ineligible_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  if not exists (select 1 from positions p where p.id = target_position_id) then
    raise exception '포지션을 찾을 수 없습니다' using errcode = '22023';
  end if;

  return query
  select
    p.id as profile_id,
    p.name,
    exists (
      select 1
        from applications a
        where a.schedule_id = target_schedule_id
          and a.profile_id = p.id
          and a.status = 'applied'
    ) as applied,
    exists (
      select 1
        from assignments asg
        join assignment_positions ap on ap.assignment_id = asg.id
        where asg.schedule_id = target_schedule_id
          and asg.profile_id = p.id
          and ap.position_id = target_position_id
    ) as currently_assigned,
    coalesce(
      (
        select array_agg(other_position.name order by other_position.name)
          from assignments other_asg
          join assignment_positions other_ap on other_ap.assignment_id = other_asg.id
          join positions other_position on other_position.id = other_ap.position_id
          where other_asg.schedule_id = target_schedule_id
            and other_asg.profile_id = p.id
            and other_ap.position_id <> target_position_id
      ),
      array[]::text[]
    ) as other_position_names,
    elig.eligible,
    elig.ineligible_reason
  from profiles p
  cross join lateral assignment_eligibility(target_position_id, p.id) as elig
  where p.status = 'active'
     or exists (
       select 1
         from assignments asg
         join assignment_positions ap on ap.assignment_id = asg.id
         where asg.schedule_id = target_schedule_id
           and asg.profile_id = p.id
           and ap.position_id = target_position_id
     )
  order by p.name asc
  limit 1000;
end;
$$;

revoke execute on function list_position_assignment_candidates(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function list_position_assignment_candidates(uuid, uuid) to authenticated;

create function replace_position_assignments(
  target_schedule_id uuid, target_position_id uuid, profile_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status schedule_status;
  position_active boolean;
  candidate_ids uuid[];
  candidate_id uuid;
  candidate_eligible boolean;
  candidate_ineligible_reason text;
  previous_ids uuid[];
  added_ids uuid[];
  removed_ids uuid[];
  added_count int;
  removed_count int;
  new_count int;
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

  added_count := coalesce(array_length(added_ids, 1), 0);
  removed_count := coalesce(array_length(removed_ids, 1), 0);
  new_count := coalesce(array_length(candidate_ids, 1), 0);

  if added_count = 0 and removed_count = 0 then
    return jsonb_build_object('assigned_count', new_count, 'changed', false);
  end if;

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

  return jsonb_build_object('assigned_count', new_count, 'changed', true);
end;
$$;

revoke execute on function replace_position_assignments(uuid, uuid, uuid[])
  from public, anon, authenticated, service_role;
grant execute on function replace_position_assignments(uuid, uuid, uuid[]) to authenticated;
