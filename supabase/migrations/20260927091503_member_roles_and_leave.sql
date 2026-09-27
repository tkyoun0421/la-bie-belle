-- 직원 관리 화면이 쓰는 판정 넷을 세운다 — 이름 고치기·역할 바꾸기·퇴사 처리·되돌리기.
-- 근거는 docs/2-design/modules/account/README.md 의 ACC-008·ACC-009·ACC-010·ACC-011 과
-- docs/2-design/modules/account/design.md 의 「이름 고치기」·「관리자 올리기·내리기」·
-- 「퇴사 처리와 되돌리기」다.
--
-- 넷 다 관리자의 손이다. 관리자가 아니면 not_allowed 로 한 갈래로 답한다 — 가입 승인·거절·
-- 차단과 같은 문이다.

-- 「마지막 관리자」의 셈이 사는 한 자리다. ACC-008 이 재직 중이고 차단되지 않은 관리자만
-- 관리자로 세므로 퇴사하거나 차단된 관리자는 빠진다. 역할 내리기와 퇴사 처리 둘이 같은 벽에
-- 부딪히는데, 셈을 두 함수에 나눠 적으면 한쪽만 고쳐질 수 있다.
create function public.is_last_admin(target_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
      select 1
      from public.profiles
      where id = target_id
        and role = 'admin'
        and left_at is null
        and blocked_at is null
    )
    and (
      select count(*)
      from public.profiles
      where role = 'admin'
        and left_at is null
        and blocked_at is null
    ) = 1;
$$;

-- 이름은 관리자만 고친다(ACC-009). 본인 손에서 잠긴 값이라 「나」 화면에는 이 문이 없다.
-- 같은 이름 둘은 안 막는다 — 구분은 이름 옆 사진이 한다.
--
-- 앞뒤 공백을 떼고 넣는다. 공백만 남는 이름은 목록에서 빈 줄이 되고, 앞뒤 공백만 다른 이름은
-- 화면이 이미 「바뀐 것이 없다」로 보므로 저장된 값도 같은 뜻이어야 한다.
create function public.set_display_name(profile_id uuid, display_name text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if set_display_name.display_name is null
    or btrim(set_display_name.display_name) = '' then
    raise exception using message = 'invalid_name';
  end if;

  update public.profiles
  set display_name = btrim(set_display_name.display_name)
  where id = set_display_name.profile_id;
end;
$$;

-- 관리자 올리기·내리기다(ACC-008). 관리자 전원이 같은 권한이라 누가 누구를 올리고 내리는지에
-- 규칙이 없고, 자기 자신을 내리는 것도 마지막이 아닌 한 막지 않는다.
--
-- 막는 것은 마지막 관리자를 내리는 것 하나다. 관리자가 하나도 없으면 아무도 승인을 못 해 앱이
-- 잠긴다.
create function public.set_role(profile_id uuid, role text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if set_role.role <> 'admin' and public.is_last_admin(set_role.profile_id) then
    raise exception using message = 'last_admin';
  end if;

  update public.profiles
  set role = set_role.role
  where id = set_role.profile_id;
end;
$$;

-- 퇴사 처리다(ACC-010·ACC-011). 프로필도 기록도 남고 undo_leave 로 되돌아온다.
--
-- 남은 배정을 저절로 빼주지 않는다. 근무표는 이미 나갔고 그날 누가 오는지를 여러 사람이 그
-- 화면을 보고 아는데, 빈 자리가 조용히 생기면 아무도 못 본다 — 관리자가 근무표에서 그 자리를
-- 비우고 다시 눌러야 한다.
--
-- 「앞으로」의 경계에 오늘이 든다. open_day 가 오늘을 date_past 로 안 보는 것과 같은 선이다 —
-- 오늘 근무가 남은 사람은 아직 근무표 위에 있다. 끝난(ended_at 이 찍힌) 배정은 이미 빠진
-- 자리라 세지 않는다.
create function public.mark_leave(profile_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = mark_leave.profile_id
      and approved_at is not null
      and left_at is null
  ) then
    raise exception using message = 'already_decided';
  end if;

  if public.is_last_admin(mark_leave.profile_id) then
    raise exception using message = 'last_admin';
  end if;

  if exists (
    select 1
    from public.assignments
    join public.days on days.id = assignments.day_id
    where assignments.profile_id = mark_leave.profile_id
      and assignments.ended_at is null
      and days.work_date >= today
  ) then
    raise exception using message = 'has_future_assignments';
  end if;

  update public.profiles
  set left_at = now()
  where id = mark_leave.profile_id;
end;
$$;

-- 퇴사 되돌리기다. 시한이 없다 — 반년 뒤 다시 오는 사람이 드물지 않은 자리라 며칠로 자르면
-- 그 사람은 새 계정으로 가입해 지난 급여와 끊긴다.
--
-- 퇴사가 아닌 대상이면 already_decided 다. 승인·거절·차단이 쓰는 코드를 그대로 쓰는 것은
-- 관리자 둘이 같은 사람을 동시에 열었을 때 늦게 누른 쪽이 받는 코드가 화면마다 다를 이유가
-- 없어서다.
create function public.undo_leave(profile_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = undo_leave.profile_id
      and left_at is not null
  ) then
    raise exception using message = 'already_decided';
  end if;

  update public.profiles
  set left_at = null
  where id = undo_leave.profile_id;
end;
$$;
