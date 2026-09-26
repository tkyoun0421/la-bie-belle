-- 가입 대기 화면이 쓰는 판정 둘을 세운다 — 차단과 해제. 근거는
-- docs/2-design/modules/account/design.md 의 「가입 승인·거절·차단·해제」와
-- docs/2-design/modules/account/README.md 의 ACC-004·ACC-007 이다.
--
-- 승인·거절과 같은 문을 쓴다. 관리자가 아니면 not_allowed 고, 대상이 「제출됨」이 아니면
-- already_decided 다 — 프로필을 보냈고 아직 아무 판정도 안 난 사람만 대상이라는 뜻이다.
-- 둘이 같은 사람을 동시에 열었을 때 늦게 누른 쪽이 받는 코드가 하나여야 화면이 한 갈래로
-- 답한다. 보낸 적 없는 계정이 판정에 들지 않는 것도 같은 조건이 막는다 — 이름도 개인정보도
-- 없는 사람이 승인되면 근무표가 부를 이름이 없다.
create function public.block_member(profile_id uuid)
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
    where id = block_member.profile_id
      and submitted_at is not null
      and approved_at is null
      and rejected_at is null
      and blocked_at is null
  ) then
    raise exception using message = 'already_decided';
  end if;

  update public.profiles
  set blocked_at = now()
  where id = block_member.profile_id;
end;
$$;

-- 해제는 `submitted_at`도 같이 비운다. 그 사람이 다시 들어오면 프로필 작성이 지난 값을 들고
-- 서고, 보내야 대기 목록에 다시 뜬다 — 풀었다는 것이 곧 받았다는 뜻은 아니다.
create function public.unblock_member(profile_id uuid)
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
    where id = unblock_member.profile_id
      and blocked_at is not null
  ) then
    raise exception using message = 'already_decided';
  end if;

  update public.profiles
  set blocked_at = null,
      submitted_at = null
  where id = unblock_member.profile_id;
end;
$$;

-- 가입 대기 상세 시트가 구글 계정을 보여준다
-- (docs/2-design/modules/account/screens/members-pending.md 의 「상세 시트 문안」).
-- `auth.users`는 앱이 못 읽어서 design.md 의 「소유 데이터」가 정한 대로 개인정보 표가
-- 그 값을 들고 있는다 — 본인과 관리자만 읽는 표다.
--
-- 옮겨 적는 자리가 프로필 제출인 것은 개인정보 행이 거기서 처음 생기기 때문이다. 계정을
-- 만들 때 빈 행을 미리 깔면 「한 번이라도 보낸 적이 있는가」를 그 행의 유무로 아는 프로필
-- 작성 화면이 갈 곳을 잃는다.
alter table public.profile_private add column email text;

create or replace function public.submit_profile(
  display_name text,
  phone text,
  birth_date date,
  gender text
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile public.profiles;
begin
  select * into caller_profile
  from public.profiles
  where user_id = auth.uid();

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if submit_profile.display_name is null or btrim(submit_profile.display_name) = '' then
    raise exception using message = 'invalid_name';
  end if;

  if submit_profile.phone is null or submit_profile.phone !~ '^010-\d{4}-\d{4}$' then
    raise exception using message = 'invalid_phone';
  end if;

  if submit_profile.gender is null or submit_profile.gender not in ('female', 'male') then
    raise exception using message = 'invalid_gender';
  end if;

  if caller_profile.submitted_at is not null and caller_profile.rejected_at is null then
    raise exception using message = 'already_submitted';
  end if;

  update public.profiles
  set display_name = submit_profile.display_name,
      submitted_at = now(),
      rejected_at = null
  where id = caller_profile.id;

  insert into public.profile_private (profile_id, email, phone, birth_date, gender)
  values (
    caller_profile.id,
    (select users.email from auth.users where users.id = auth.uid()),
    submit_profile.phone,
    submit_profile.birth_date,
    submit_profile.gender
  )
  on conflict (profile_id) do update
  set email = excluded.email,
      phone = excluded.phone,
      birth_date = excluded.birth_date,
      gender = excluded.gender;
end;
$$;
