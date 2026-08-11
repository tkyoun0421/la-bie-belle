create table assignment_trainees (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules (id),
  position_id uuid not null references positions (id) on delete restrict,
  profile_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (schedule_id, profile_id)
);

alter table assignment_trainees enable row level security;

create policy assignment_trainees_select_admin
on assignment_trainees
for select
using (is_admin(auth.uid()));

drop function list_position_assignment_candidates(uuid, uuid);

create function list_position_assignment_candidates(
  target_schedule_id uuid, target_position_id uuid
) returns table (
  profile_id uuid,
  name text,
  applied boolean,
  currently_assigned boolean,
  other_position_names text[],
  eligible boolean,
  ineligible_reason text,
  currently_trainee boolean
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
    elig.ineligible_reason,
    exists (
      select 1
        from assignment_trainees at
        where at.schedule_id = target_schedule_id
          and at.profile_id = p.id
          and at.position_id = target_position_id
    ) as currently_trainee
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
     or exists (
       select 1
         from assignment_trainees at
         where at.schedule_id = target_schedule_id
           and at.profile_id = p.id
           and at.position_id = target_position_id
     )
  order by p.name asc
  limit 1000;
end;
$$;

revoke execute on function list_position_assignment_candidates(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function list_position_assignment_candidates(uuid, uuid) to authenticated;

drop function replace_position_assignments(uuid, uuid, uuid[]);

create function replace_position_assignments(
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
      and at.position_id <> target_position_id
    limit 1;

  if conflicting_id is not null then
    raise exception '이미 다른 포지션의 교육생이라 정식 배정할 수 없습니다' using errcode = 'LB024';
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

  return jsonb_build_object('assigned_count', new_count, 'changed', true);
end;
$$;

revoke execute on function replace_position_assignments(uuid, uuid, uuid[], uuid[])
  from public, anon, authenticated, service_role;
grant execute on function replace_position_assignments(uuid, uuid, uuid[], uuid[]) to authenticated;
