-- 리허설을 넣고 고치고 지우는 길 셋이다. 표에 직접 쓰는 권한이 없어 이 셋이 유일한 문이다
-- (plan AC-03).
--
-- **자격이 문이다.** 승인만으로는 못 넣는다 — 관리자도 자격이 없으면 못 쓴다. 관리자에게
-- 넣는 길이 따로 없는 것이 SCH-020의 「쓰는 것은 넣은 본인뿐」이다.
--
-- **갈래를 함수가 판정한다.** 화면이 보낸 갈래를 안 믿는다. 날짜를 고른 뒤 저장까지 사이에
-- 관리자가 배정을 넣거나 뺄 수 있어 여기서 다시 정하고, 어긋나면 `wrong_kind`로 돌려보내
-- 화면이 칸을 바꿔 다시 받는다.

-- 자격 확인 하나다. `position_grants`의 `'리허설'` 행이 유일한 길이고
-- (schedule/design.md 「자격」) 살아 있는 교육 배정은 여기 안 든다 — 리허설은 배워서 얻는
-- 포지션이 아니다.
create function public.has_rehearsal_grant(p_profile_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.position_grants
    where position_grants.profile_id = p_profile_id
      and position_grants.position = '리허설'
  );
$$;

-- 그날 그 사람의 갈래다 — 살아 있는 정규 배정이 있으면 건수, 없으면 시각이다. 교육 배정은
-- 안 센다(schedule/design.md 「리허설」).
create function internal.rehearsal_kind_of(p_profile_id uuid, p_work_date date)
  returns text
  language sql
  stable
  set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.assignments
      join public.days on days.id = assignments.day_id
      where assignments.profile_id = p_profile_id
        and assignments.kind = 'regular'
        and assignments.ended_at is null
        and days.work_date = p_work_date
    )
    then 'count'
    else 'time'
  end;
$$;

-- 겹침은 리허설 행끼리만 본다. 배정된 근무 시간과는 안 견준다 — 근무하는 동안 리허설을
-- 하는 것이 아니라 그 시간에 다른 일을 한 것이라 두 시간이 서로를 막을 이유가 없다.
create function internal.rehearsal_overlaps(
  p_profile_id uuid,
  p_work_date date,
  p_starts_at time,
  p_ends_at time,
  p_except_id uuid
)
  returns boolean
  language sql
  stable
  set search_path = ''
as $$
  select exists (
    select 1
    from public.rehearsals
    where rehearsals.profile_id = p_profile_id
      and rehearsals.work_date = p_work_date
      and rehearsals.starts_at is not null
      and (p_except_id is null or rehearsals.id <> p_except_id)
      and rehearsals.starts_at < p_ends_at
      and p_starts_at < rehearsals.ends_at
  );
$$;

create function public.add_rehearsal(
  p_work_date date,
  p_starts_at time default null,
  p_ends_at time default null,
  p_count integer default null
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
  resolved_kind text;
begin
  if not public.is_approved() then
    raise exception using message = 'not_allowed';
  end if;

  caller_profile_id := internal.active_profile_id();

  if not public.has_rehearsal_grant(caller_profile_id) then
    raise exception using message = 'not_qualified';
  end if;

  resolved_kind := internal.rehearsal_kind_of(caller_profile_id, p_work_date);

  if resolved_kind = 'count' then
    if p_count is null or p_starts_at is not null or p_ends_at is not null then
      raise exception using message = 'wrong_kind';
    end if;

    if p_count < 1 or p_count > 9 then
      raise exception using message = 'bad_count';
    end if;

    if exists (
      select 1
      from public.rehearsals
      where rehearsals.profile_id = caller_profile_id
        and rehearsals.work_date = p_work_date
        and rehearsals.count is not null
    ) then
      raise exception using message = 'already_exists';
    end if;

    insert into public.rehearsals (profile_id, work_date, count)
    values (caller_profile_id, p_work_date, p_count);

    return;
  end if;

  if p_starts_at is null or p_ends_at is null or p_count is not null then
    raise exception using message = 'wrong_kind';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception using message = 'bad_hours';
  end if;

  if internal.rehearsal_overlaps(
    caller_profile_id,
    p_work_date,
    p_starts_at,
    p_ends_at,
    null
  ) then
    raise exception using message = 'overlaps';
  end if;

  insert into public.rehearsals (profile_id, work_date, starts_at, ends_at)
  values (caller_profile_id, p_work_date, p_starts_at, p_ends_at);
exception
  -- 건수 갈래의 unique index를 두 요청이 같이 밟았을 때다. 앞선 검사와 같은 말을 한다.
  when unique_violation then
    raise exception using message = 'already_exists';
end;
$$;

-- **이미 선 행은 갈래를 다시 판정하지 않는다.** 배정 없는 날에 시각으로 넣어둔 뒤 관리자가
-- 그날 배정을 넣어도 그 행은 시각 갈래로 남는다 — 급여가 갈래와 무관하게 시간만 쓰고
-- (payroll/README.md PAY-028) 그 시각이 실제로 일한 시각이라 틀린 값이 아니다.
create function public.edit_rehearsal(
  p_id uuid,
  p_starts_at time default null,
  p_ends_at time default null,
  p_count integer default null
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
  target public.rehearsals;
begin
  if not public.is_approved() then
    raise exception using message = 'not_allowed';
  end if;

  caller_profile_id := internal.active_profile_id();

  select * into target
  from public.rehearsals
  where rehearsals.id = p_id;

  -- 남의 행은 관리자도 못 고친다. 없는 행도 같은 말이다 — 남의 행이 있는지 없는지를
  -- 오류 코드로 알려주지 않는다.
  if not found or target.profile_id is distinct from caller_profile_id then
    raise exception using message = 'not_allowed';
  end if;

  if not public.has_rehearsal_grant(caller_profile_id) then
    raise exception using message = 'not_qualified';
  end if;

  if target.count is not null then
    if p_count is null or p_starts_at is not null or p_ends_at is not null then
      raise exception using message = 'wrong_kind';
    end if;

    if p_count < 1 or p_count > 9 then
      raise exception using message = 'bad_count';
    end if;

    update public.rehearsals
    set count = p_count
    where rehearsals.id = target.id;

    return;
  end if;

  if p_starts_at is null or p_ends_at is null or p_count is not null then
    raise exception using message = 'wrong_kind';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception using message = 'bad_hours';
  end if;

  if internal.rehearsal_overlaps(
    target.profile_id,
    target.work_date,
    p_starts_at,
    p_ends_at,
    target.id
  ) then
    raise exception using message = 'overlaps';
  end if;

  update public.rehearsals
  set starts_at = p_starts_at,
      ends_at = p_ends_at
  where rehearsals.id = target.id;
end;
$$;

create function public.remove_rehearsal(p_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
  target public.rehearsals;
begin
  if not public.is_approved() then
    raise exception using message = 'not_allowed';
  end if;

  caller_profile_id := internal.active_profile_id();

  select * into target
  from public.rehearsals
  where rehearsals.id = p_id;

  if not found or target.profile_id is distinct from caller_profile_id then
    raise exception using message = 'not_allowed';
  end if;

  if not public.has_rehearsal_grant(caller_profile_id) then
    raise exception using message = 'not_qualified';
  end if;

  delete from public.rehearsals where rehearsals.id = target.id;
end;
$$;
