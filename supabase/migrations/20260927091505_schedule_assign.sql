-- 자격은 뷰 하나가 낸다. `position_grants`와 살아 있는 교육 배정을 합쳐 (profile_id,
-- position)으로 내고 `add_assignment`도 사람 픽커도 이것만 읽는다 — 같은 규칙이 SQL과 TS에
-- 두 벌 서지 않는다(design.md 「자격」).
create view public.qualifications
  with (security_invoker = true)
as
select profile_id, position
from public.position_grants
union
select profile_id, position
from public.assignments
where kind = 'training'
  and ended_at is null;

revoke all on public.qualifications from anon, authenticated;

grant select on public.qualifications to authenticated;

-- 확정이 묶는 것은 확정 시점에 있던 날들이다(SCH-018). 확정 뒤에 새로 연 날은 확정 전과
-- 똑같이 구조를 고친다. 경계는 엄격 부등호다 — 같은 시각이면 확정 시점에 있던 날이다.
create function public.day_structure_locked(p_day_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.days
    join public.schedules on schedules.id = days.schedule_id
    where days.id = p_day_id
      and schedules.confirmed_at is not null
      and days.opened_at <= schedules.confirmed_at
  );
$$;

create function public.add_slot(p_day_id uuid, p_position text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if public.day_structure_locked(p_day_id) then
    raise exception using message = 'already_confirmed';
  end if;

  insert into public.slots (day_id, positions)
  values (p_day_id, array[p_position]);
end;
$$;

-- 확정 전의 이동은 자국을 안 남긴다 — 행을 지우면 `on delete cascade`가 그 자리의 배정도
-- 데려간다. 확정 뒤 새로 연 날은 이력이라 `ended_at`을 찍는다(design.md 「배정」).
create function public.remove_slot(p_slot_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target public.slots;
  confirmed_at timestamptz;
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.slots
  where id = p_slot_id;

  if not found or target.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  if public.day_structure_locked(target.day_id) then
    raise exception using message = 'already_confirmed';
  end if;

  select schedules.confirmed_at into confirmed_at
  from public.days
  join public.schedules on schedules.id = days.schedule_id
  where days.id = target.day_id;

  if confirmed_at is null then
    delete from public.slots where id = target.id;
    return;
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  update public.assignments
  set ended_at = now(),
      ended_reason = 'slot_removed',
      ended_by = caller_profile_id
  where slot_id = target.id
    and ended_at is null;

  update public.slots
  set ended_at = now(),
      ended_by = caller_profile_id
  where id = target.id;
end;
$$;

-- 합치기가 받는 것은 포지션 이름 둘이다 — 관리자가 집는 것은 줄 머리고 거기엔 자리 id가
-- 없다. 빈 자리를 고르는 것도 함수라 합치는 손짓이 남의 배정을 지우는 길이 없다(SCH-015).
--
-- 먼저 만든 자리가 간다. `created_at`이 같은 자리들 — 날을 열 때 한 문장이 깔아둔 기본
-- 자리들이 그렇다 — 은 `ctid`가 넣은 순서를 대신 가른다.
create function public.merge_slots(p_day_id uuid, p_from text, p_to text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  receiving_slot_id uuid;
  donating_slot_id uuid;
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if public.day_structure_locked(p_day_id) then
    raise exception using message = 'already_confirmed';
  end if;

  select slots.id into receiving_slot_id
  from public.slots
  where slots.day_id = p_day_id
    and slots.ended_at is null
    and slots.positions[1] = p_to
    and not exists (
      select 1
      from public.assignments
      where assignments.slot_id = slots.id
        and assignments.ended_at is null
        and assignments.kind = 'regular'
    )
  order by slots.created_at, slots.ctid
  limit 1;

  select slots.id into donating_slot_id
  from public.slots
  where slots.day_id = p_day_id
    and slots.ended_at is null
    and slots.positions[1] = p_from
    and slots.id is distinct from receiving_slot_id
    and not exists (
      select 1
      from public.assignments
      where assignments.slot_id = slots.id
        and assignments.ended_at is null
        and assignments.kind = 'regular'
    )
  order by slots.created_at, slots.ctid
  limit 1;

  if receiving_slot_id is null or donating_slot_id is null then
    raise exception using message = 'no_empty_slot';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  update public.slots
  set positions = array_append(positions, p_from)
  where id = receiving_slot_id;

  update public.slots
  set ended_at = now(),
      ended_by = caller_profile_id
  where id = donating_slot_id;

  update public.requests
  set closed_at = now()
  where slot_id = donating_slot_id
    and closed_at is null;
end;
$$;

-- 합친 행에서 첫 포지션만 남기고 나머지 포지션마다 새 자리를 만든다. 어느 행이 합쳐졌는지
-- 가리키는 열이 없어 원래 둘을 되살릴 길이 없고, 배정된 사람은 남는 쪽에 그대로 있다
-- (design.md 「날과 자리」).
create function public.split_slot(p_slot_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target public.slots;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.slots
  where id = p_slot_id;

  if not found or target.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  if public.day_structure_locked(target.day_id) then
    raise exception using message = 'already_confirmed';
  end if;

  if cardinality(target.positions) < 2 then
    raise exception using message = 'not_merged';
  end if;

  insert into public.slots (day_id, positions)
  select target.day_id, array[freed]
  from unnest(target.positions[2:]) as freed;

  update public.slots
  set positions = target.positions[1:1]
  where id = target.id;
end;
$$;

-- 정규는 `p_slot_id`로 날과 포지션을 읽고, 교육은 자리를 안 먹어 `p_day_id`·`p_position`을
-- 받는다(SCH-012). 검사 순서가 화면의 메시지 순서다 — 미신청이 자격 없음보다 먼저다.
-- `p_skip_qualification`이 「이번만 넣기」고 자격 검사 하나만 건너뛴다.
create function public.add_assignment(
  p_profile_id uuid,
  p_kind text,
  p_slot_id uuid default null,
  p_day_id uuid default null,
  p_position text default null,
  p_skip_qualification boolean default false
)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target_slot public.slots;
  target_work_date date;
  resolved_day_id uuid;
  resolved_position text;
  new_assignment_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if p_kind = 'regular' then
    if p_slot_id is null then
      raise exception using message = 'wrong_kind';
    end if;

    select * into target_slot
    from public.slots
    where id = p_slot_id;

    if not found or target_slot.ended_at is not null then
      raise exception using message = 'stale';
    end if;

    resolved_day_id := target_slot.day_id;
    resolved_position := target_slot.positions[1];
  elsif p_kind = 'training' then
    if p_slot_id is not null or p_day_id is null or p_position is null then
      raise exception using message = 'wrong_kind';
    end if;

    resolved_day_id := p_day_id;
    resolved_position := p_position;
  else
    raise exception using message = 'wrong_kind';
  end if;

  select days.work_date into target_work_date
  from public.days
  where days.id = resolved_day_id;

  if not found then
    raise exception using message = 'stale';
  end if;

  if not exists (
    select 1
    from public.availabilities
    where availabilities.profile_id = p_profile_id
      and availabilities.work_date = target_work_date
  ) then
    raise exception using message = 'not_applied';
  end if;

  if p_kind = 'regular'
    and not p_skip_qualification
    and resolved_position = any (array['팀장', '스캔', '메인', '드레스', '드레스실'])
    and not exists (
      select 1
      from public.qualifications
      where qualifications.profile_id = p_profile_id
        and qualifications.position = resolved_position
    )
  then
    raise exception using message = 'not_qualified';
  end if;

  if exists (
    select 1
    from public.assignments
    where assignments.day_id = resolved_day_id
      and assignments.profile_id = p_profile_id
      and assignments.kind = 'regular'
      and assignments.ended_at is null
  ) then
    raise exception using message = 'already_assigned';
  end if;

  if p_kind = 'regular' and exists (
    select 1
    from public.assignments
    where assignments.slot_id = p_slot_id
      and assignments.kind = 'regular'
      and assignments.ended_at is null
  ) then
    raise exception using message = 'slot_full';
  end if;

  insert into public.assignments (day_id, slot_id, position, profile_id, kind)
  values (resolved_day_id, p_slot_id, resolved_position, p_profile_id, p_kind)
  returning id into new_assignment_id;

  return new_assignment_id;
end;
$$;

create function public.remove_assignment(p_assignment_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target public.assignments;
  confirmed_at timestamptz;
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.assignments
  where id = p_assignment_id;

  if not found or target.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  select schedules.confirmed_at into confirmed_at
  from public.days
  join public.schedules on schedules.id = days.schedule_id
  where days.id = target.day_id;

  if confirmed_at is null then
    delete from public.assignments where id = target.id;
    return;
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  update public.assignments
  set ended_at = now(),
      ended_reason = 'removed_by_admin',
      ended_by = caller_profile_id
  where id = target.id;
end;
$$;

-- 한 트랜잭션이다 — 새 사람이 검사에 걸리면 옛 배정을 닫은 것까지 되돌아간다. 빼기만 되고
-- 넣기가 실패하면 자리가 빈 채로 남고 알림도 반쪽이 된다(plan 리스크).
--
-- 검사 넷을 여기 다시 적지 않고 `add_assignment`에 맡긴다. 옛 배정을 먼저 닫아야 그 자리가
-- `slot_full`로 스스로를 막지 않는다.
create function public.force_change(p_assignment_id uuid, p_profile_id uuid)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target public.assignments;
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.assignments
  where id = p_assignment_id;

  if not found or target.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  update public.assignments
  set ended_at = now(),
      ended_reason = 'force_change',
      ended_by = caller_profile_id
  where id = target.id;

  return public.add_assignment(
    p_profile_id := p_profile_id,
    p_kind := target.kind,
    p_slot_id := target.slot_id,
    p_day_id := case when target.slot_id is null then target.day_id end,
    p_position := case when target.slot_id is null then target.position end
  );
end;
$$;

-- 자격은 있고 없고뿐이라 두 번 준 것이 오류가 아니다.
create function public.grant_position(p_profile_id uuid, p_position text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  insert into public.position_grants (profile_id, position, granted_by)
  values (p_profile_id, p_position, caller_profile_id)
  on conflict (profile_id, position) do nothing;
end;
$$;
