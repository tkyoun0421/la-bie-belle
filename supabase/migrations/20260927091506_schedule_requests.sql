-- 요청이 저절로 만료되려면 스케줄러가 있어야 한다. 이 저장소가 pg_cron을 처음 켜는 자리다
-- (plan schedule-requests.md 「입력 명세·기준」).
create extension if not exists pg_cron;

-- 화면이 쓰는 「지금」의 기준점이다(runtime.md 「서버 시각」). 앱이 뜰 때와 앞으로 돌아올 때
-- 한 번씩 불러 기기 시각과의 차이를 들고, 카운트다운과 만료 잠금이 그 차이를 더해 센다.
-- 판정은 여전히 함수 안의 `now()`라 이 값이 틀려도 배정이 틀리지 않는다.
--
-- 승인 전 사람도 부른다 — 시각은 권한이 아니다.
create function public.server_now()
  returns timestamptz
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select now();
$$;

-- 요청은 관리자와 그 요청의 후보만 읽는다(design.md 「요청」). 누구에게 물었고 누가
-- 거절했는지는 배정처럼 전원이 볼 것이 아니다 — 처음엔 `is_approved()`로 열려 있었다.
drop policy requests_select on public.requests;

create policy requests_select
  on public.requests
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.request_candidates
      join public.profiles on profiles.id = request_candidates.profile_id
      where request_candidates.request_id = requests.id
        and profiles.user_id = (select auth.uid())
    )
  );

drop policy request_candidates_select on public.request_candidates;

create policy request_candidates_select
  on public.request_candidates
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id = request_candidates.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

-- 자리를 채우는 길이 여럿이고 전부 그 자리의 살아 있는 요청을 닫는다(design.md 「요청」).
-- 규칙이 한 곳에만 있으라고 닫기를 여기 모은다 — `add_assignment`(정규)와
-- `respond_request`(수락)와 `decide_cancel_request`(승인)가 이것을 부르고, 교대 승인은
-- swap 영역이 제 함수에서 같은 것을 부른다.
create function internal.close_slot_requests(p_slot_id uuid)
  returns void
  language sql
  set search_path = ''
as $$
  update public.requests
  set closed_at = now()
  where slot_id = p_slot_id
    and closed_at is null;
$$;

-- 매 분 도는 만료 배치다. **갈래 행은 안 건드린다** — 「만료됨」은 저장하지 않는 상태고
-- (`status = 'pending'`이면서 `expires_at`이 지난 것이 만료된 갈래다) 상태를 하나 더
-- 저장하면 cron이 도는 사이 한 분 동안 화면과 표가 어긋난다(design.md 「요청」).
--
-- 닫는 것은 살아 있는 갈래가 하나도 안 남은 요청의 `closed_at`뿐이다. `closed_at is null`
-- 조건이 멱등을 지킨다 — 두 번 돌아도 먼저 찍힌 시각이 안 밀린다.
create function internal.expire_requests()
  returns void
  language sql
  set search_path = ''
as $$
  update public.requests
  set closed_at = now()
  where closed_at is null
    and not exists (
      select 1
      from public.request_candidates
      where request_candidates.request_id = requests.id
        and request_candidates.status = 'pending'
        and request_candidates.expires_at > now()
    );
$$;

select cron.schedule(
  'expire-requests',
  '* * * * *',
  $$select internal.expire_requests()$$
);

-- 빈 자리에 사람을 물어보는 문이다(SCH-017). 요청은 자리 단위라 같은 자리에 살아 있는
-- 요청이 이미 있으면 새 행을 만들지 않고 후보만 더한다 — 답이 둘로 갈리면 선착순이 두
-- 줄기가 된다.
--
-- **만료는 48시간과 근무 시작 중 이른 쪽이다.** 근무가 시작된 뒤에 수락해봐야 소용이 없어서
-- 그 시각이 마지막 마감이다. 갈래마다 같은 값을 실어 화면이 요청 행을 안 읽고도 센다.
--
-- **그날 이미 정규로 든 사람은 조용히 뺀다.** 목록이 낡아 생기는 일이라 전체를 실패시키지
-- 않는다 — 관리자가 고른 나머지는 그대로 나가야 한다.
create function public.send_work_request(p_slot_id uuid, p_profile_ids uuid[])
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target_slot public.slots;
  target_day public.days;
  work_starts_at timestamptz;
  expires timestamptz;
  caller_profile_id uuid;
  new_request_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target_slot
  from public.slots
  where id = p_slot_id;

  if not found or target_slot.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  select * into target_day
  from public.days
  where id = target_slot.day_id;

  if exists (
    select 1
    from public.assignments
    where assignments.slot_id = target_slot.id
      and assignments.kind = 'regular'
      and assignments.ended_at is null
  ) then
    raise exception using message = 'slot_full';
  end if;

  work_starts_at :=
    (target_day.work_date + target_day.starts_at) at time zone 'Asia/Seoul';

  if work_starts_at <= now() then
    raise exception using message = 'window_closed';
  end if;

  expires := least(now() + interval '48 hours', work_starts_at);

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  select requests.id into new_request_id
  from public.requests
  where requests.slot_id = target_slot.id
    and requests.closed_at is null
  limit 1;

  if new_request_id is null then
    insert into public.requests (kind, slot_id, requested_by, expires_at)
    values ('work', target_slot.id, caller_profile_id, expires)
    returning id into new_request_id;
  else
    update public.requests
    set expires_at = expires
    where id = new_request_id;
  end if;

  insert into public.request_candidates (
    request_id,
    profile_id,
    status,
    responded_at,
    expires_at
  )
  select new_request_id, candidate_id, 'pending', null, expires
  from unnest(p_profile_ids) as candidate_id
  where not exists (
    select 1
    from public.assignments
    where assignments.day_id = target_day.id
      and assignments.profile_id = candidate_id
      and assignments.kind = 'regular'
      and assignments.ended_at is null
  )
  on conflict (request_id, profile_id) do update
  set status = 'pending',
      responded_at = null,
      expires_at = excluded.expires_at;

  return new_request_id;
end;
$$;

-- 근무자가 받은 요청에 답한다. 수락은 **배정을 넣고 요청을 닫는 것까지 한 트랜잭션이라**
-- 둘이 같은 순간에 눌러도 하나만 들어간다 — 마지막 문은 `assignments_live_regular_per_slot`
-- unique index고 진 쪽의 예외를 `slot_full`로 올린다(SCH-017).
--
-- **`not_applied`만 건너뛴다.** 신청 안 한 날을 채우는 길이 요청이라 그 검사가 요청의 존재
-- 이유를 막는다(SCH-016). 제한 포지션 자격은 그대로 본다.
--
-- **자리가 찼는지를 닫혔는지보다 먼저 본다.** 늦은 수락이 「마감됨」이 아니라 「자리가
-- 찼어요」로 와야 화면이 무슨 일이 있었는지 말한다(schedule-worker.md 「실패와 경합」).
create function public.respond_request(p_request_id uuid, p_answer text)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid := internal.active_profile_id();
  candidate public.request_candidates;
  target_request public.requests;
  target_slot public.slots;
  new_assignment_id uuid;
begin
  select * into candidate
  from public.request_candidates
  where request_id = p_request_id
    and profile_id = caller_profile_id
    and status = 'pending';

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if p_answer not in ('accept', 'decline') then
    raise exception using message = 'wrong_kind';
  end if;

  select * into target_request
  from public.requests
  where id = p_request_id;

  if p_answer = 'decline' then
    if target_request.closed_at is not null or candidate.expires_at <= now() then
      raise exception using message = 'request_closed';
    end if;

    update public.request_candidates
    set status = 'declined',
        responded_at = now()
    where id = candidate.id;

    if not exists (
      select 1
      from public.request_candidates
      where request_id = p_request_id
        and status = 'pending'
        and expires_at > now()
    ) then
      update public.requests
      set closed_at = now()
      where id = p_request_id
        and closed_at is null;
    end if;

    return null;
  end if;

  select * into target_slot
  from public.slots
  where id = target_request.slot_id;

  if not found or target_slot.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  if exists (
    select 1
    from public.assignments
    where assignments.slot_id = target_slot.id
      and assignments.kind = 'regular'
      and assignments.ended_at is null
  ) then
    raise exception using message = 'slot_full';
  end if;

  if target_request.closed_at is not null or candidate.expires_at <= now() then
    raise exception using message = 'request_closed';
  end if;

  if target_slot.positions[1] = any (array['팀장', '스캔', '메인', '드레스', '드레스실'])
    and not exists (
      select 1
      from public.qualifications
      where qualifications.profile_id = caller_profile_id
        and qualifications.position = target_slot.positions[1]
    )
  then
    raise exception using message = 'not_qualified';
  end if;

  if exists (
    select 1
    from public.assignments
    where assignments.day_id = target_slot.day_id
      and assignments.profile_id = caller_profile_id
      and assignments.kind = 'regular'
      and assignments.ended_at is null
  ) then
    raise exception using message = 'already_assigned';
  end if;

  begin
    insert into public.assignments (day_id, slot_id, position, profile_id, kind)
    values (
      target_slot.day_id,
      target_slot.id,
      target_slot.positions[1],
      caller_profile_id,
      'regular'
    )
    returning id into new_assignment_id;
  exception
    when unique_violation then
      raise exception using message = 'slot_full';
  end;

  update public.request_candidates
  set status = 'accepted',
      responded_at = now()
  where id = candidate.id;

  perform internal.close_slot_requests(target_slot.id);

  update public.requests
  set approved_candidate_id = candidate.id
  where id = p_request_id;

  return new_assignment_id;
end;
$$;

-- 근무 취소는 근무 전날까지다(SCH-018). 당일부터는 대신 나올 사람을 구할 시간이 없다.
-- 거절된 뒤에는 새 행으로 다시 요청할 수 있고 횟수를 안 막는다 — 마감이 이미 막는다.
create function public.create_cancel_request(p_assignment_id uuid, p_reason text)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid := internal.active_profile_id();
  target public.assignments;
  target_work_date date;
  new_cancel_request_id uuid;
begin
  select * into target
  from public.assignments
  where id = p_assignment_id;

  if not found or target.profile_id is distinct from caller_profile_id then
    raise exception using message = 'not_allowed';
  end if;

  if target.ended_at is not null then
    raise exception using message = 'stale';
  end if;

  select days.work_date into target_work_date
  from public.days
  where days.id = target.day_id;

  if (now() at time zone 'Asia/Seoul')::date >= target_work_date then
    raise exception using message = 'window_closed';
  end if;

  if btrim(p_reason) = '' or length(p_reason) > 100 then
    raise exception using message = 'invalid_reason';
  end if;

  if exists (
    select 1
    from public.cancel_requests
    where cancel_requests.assignment_id = target.id
      and cancel_requests.decided_at is null
  ) then
    raise exception using message = 'already_requested';
  end if;

  insert into public.cancel_requests (assignment_id, profile_id, reason)
  values (target.id, caller_profile_id, p_reason)
  returning id into new_cancel_request_id;

  return new_cancel_request_id;
end;
$$;

-- 판정은 관리자만이다. **행을 먼저 잠근다** — 둘이 같은 요청을 동시에 판정하면 늦은 쪽이
-- `already_decided`를 받아야 하고, 안 잠그면 둘 다 통과해 판정이 덮인다.
--
-- 승인은 그 배정을 닫고 그 자리의 살아 있는 요청도 같이 닫는다. 자리가 다시 비었으니 앞서
-- 나간 요청은 채우려던 자리가 아니게 된다.
create function public.decide_cancel_request(
  p_cancel_request_id uuid,
  p_decision text,
  p_reason text default null
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
  target public.cancel_requests;
  target_slot_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception using message = 'wrong_kind';
  end if;

  select * into target
  from public.cancel_requests
  where id = p_cancel_request_id
  for update;

  if not found then
    raise exception using message = 'stale';
  end if;

  if target.decided_at is not null then
    raise exception using message = 'already_decided';
  end if;

  if p_decision = 'rejected' and btrim(coalesce(p_reason, '')) = '' then
    raise exception using message = 'invalid_reason';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  update public.cancel_requests
  set decided_at = now(),
      decided_by = caller_profile_id,
      decision = p_decision,
      decision_reason = case when p_decision = 'rejected' then p_reason end
  where id = target.id;

  if p_decision = 'rejected' then
    return;
  end if;

  update public.assignments
  set ended_at = now(),
      ended_reason = 'cancel',
      ended_by = caller_profile_id
  where id = target.assignment_id
    and ended_at is null
  returning slot_id into target_slot_id;

  if target_slot_id is not null then
    perform internal.close_slot_requests(target_slot_id);
  end if;
end;
$$;

-- 아래는 앞 task가 만든 함수를 다시 정의한 것이다. 바뀐 것은 마지막 한 줄 —
-- 정규 배정이 들어가면 그 자리의 살아 있는 요청이 닫힌다(design.md 「요청」).
-- 교육 배정은 자리를 안 먹으니 안 닫는다.
--
-- `force_change`는 안 고친다. 새 사람을 넣는 일을 `add_assignment`에 그대로 맡기고 있어서
-- 닫기가 그 안에서 같이 일어난다 — 여기 한 번 더 부르면 같은 규칙이 두 자리에 선다.
create or replace function public.add_assignment(
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

  if p_kind = 'regular' then
    perform internal.close_slot_requests(p_slot_id);
  end if;

  return new_assignment_id;
end;
$$;

revoke all on all functions in schema internal from anon, authenticated;
