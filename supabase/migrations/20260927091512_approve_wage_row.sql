-- 승인이 첫 시급 행을 넣는다(plan AC-03 마지막 줄). `wage_rates`가 승인 함수보다 늦게 서서
-- 그쪽을 여기서 다시 낸다 — 바뀐 것은 마지막 문단 하나고 나머지는 그대로다.
--
-- **첫 행은 `follows_default = true`다.** 승인될 때 복사되는 값이 아니라 끈에 묶이는
-- 자리다(PAY-013) — 그 뒤 기본 시급이 바뀌면 이 사람도 같이 따라간다.
--
-- 기본 시급을 아직 한 번도 안 정했으면 행을 안 넣는다. 넣을 금액이 없어서다. 시급 이력이 빈
-- 그 상태도 「따로 정하지 않은 사람」이라 기본 시급이 처음 서는 순간 `set_default_wage`가
-- 같이 데려간다(PAY-012) — 승인이 먼저냐 기본 시급이 먼저냐로 결과가 갈리지 않는다.
create or replace function public.approve_member(profile_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  default_amount integer;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = approve_member.profile_id
      and submitted_at is not null
      and approved_at is null
      and rejected_at is null
      and blocked_at is null
  ) then
    raise exception using message = 'already_decided';
  end if;

  update public.profiles
  set approved_at = now()
  where id = approve_member.profile_id;

  default_amount := internal.default_wage_at(today);

  if default_amount is null then
    return;
  end if;

  insert into public.wage_rates (
    profile_id,
    effective_date,
    amount,
    follows_default
  )
  select approve_member.profile_id, today, default_amount, true
  where not exists (
    select 1
    from public.wage_rates as existing
    where existing.profile_id = approve_member.profile_id
      and existing.effective_date = today
  );
end;
$$;
