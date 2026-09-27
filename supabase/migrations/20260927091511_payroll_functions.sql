-- 표 넷에 쓰는 길 여섯이다. 다섯은 `public`이고 첫 줄이 `is_admin()`이며, `import_holidays`
-- 하나만 `internal`이다 — 사람이 부르는 자리가 없고 Edge Function이 서비스 키로 온다
-- (data-access.md 「서비스 키 자리」).
--
-- **적용일을 인자로 안 받는다.** 시급 셋이 다 오늘 날짜에 쓴다(PAY-008·PAY-009). 지난 줄을
-- 고치는 함수가 없는 것이 소급하는 길을 안 만든다는 뜻이다(PAY-010).

-- 상한은 표의 check와 같은 값인데 여기서 한 번 더 본다. 표가 막으면 오류가 제약 위반으로
-- 나가고, 화면은 코드를 읽어 문안을 고르므로(data-access.md 「오류의 모양」) 함수가 먼저
-- `bad_amount`로 돌려보낸다.
create function internal.wage_in_range(p_amount integer)
  returns boolean
  language sql
  immutable
  set search_path = ''
as $$
  select p_amount is not null and p_amount > 0 and p_amount <= 100000;
$$;

-- 그 시점의 기본 시급이다. 아직 기본값을 한 번도 안 정했으면 `null`이다.
create function internal.default_wage_at(p_date date)
  returns integer
  language sql
  stable
  set search_path = ''
as $$
  select default_wage_rates.amount
  from public.default_wage_rates
  where default_wage_rates.effective_date <= p_date
  order by default_wage_rates.effective_date desc
  limit 1;
$$;

create function public.set_wage(p_profile_id uuid, p_amount integer)
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

  if not internal.wage_in_range(p_amount) then
    raise exception using message = 'bad_amount';
  end if;

  insert into public.wage_rates (
    profile_id,
    effective_date,
    amount,
    follows_default
  )
  values (p_profile_id, today, p_amount, false)
  on conflict (profile_id, effective_date) do update
  set amount = excluded.amount,
      follows_default = excluded.follows_default;
end;
$$;

-- 되돌린 날부터 다시 끈에 붙는다(PAY-014) — 지난 행은 그대로 두고 오늘 행만 기본값으로
-- 선다. 기본값을 한 번도 안 정했으면 되돌릴 값이 없어 `bad_amount`다.
create function public.reset_wage_to_default(p_profile_id uuid)
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

  default_amount := internal.default_wage_at(today);

  if default_amount is null then
    raise exception using message = 'bad_amount';
  end if;

  insert into public.wage_rates (
    profile_id,
    effective_date,
    amount,
    follows_default
  )
  values (p_profile_id, today, default_amount, true)
  on conflict (profile_id, effective_date) do update
  set amount = excluded.amount,
      follows_default = excluded.follows_default;
end;
$$;

-- 기본 시급이 끈이다(PAY-013). 기본값 행 하나와 따르는 사람 전원의 행이 **한 트랜잭션에**
-- 같이 서서, 계산은 `wage_rates` 한 표만 읽고 RLS도 한 표에만 걸린다.
--
-- 「따르는 사람」은 **각자의 가장 최근 행**이 `follows_default`인 사람이다. 지난 행이 아니라
-- 지금 상태를 본다 — 과거에 따랐다가 개별로 정한 사람은 여기 안 든다.
create function public.set_default_wage(p_amount integer)
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

  if not internal.wage_in_range(p_amount) then
    raise exception using message = 'bad_amount';
  end if;

  insert into public.default_wage_rates (effective_date, amount)
  values (today, p_amount)
  on conflict (effective_date) do update
  set amount = excluded.amount;

  insert into public.wage_rates (
    profile_id,
    effective_date,
    amount,
    follows_default
  )
  select latest.profile_id, today, p_amount, true
  from (
    select distinct on (wage_rates.profile_id)
      wage_rates.profile_id,
      wage_rates.follows_default
    from public.wage_rates
    order by wage_rates.profile_id, wage_rates.effective_date desc
  ) as latest
  where latest.follows_default
  on conflict (profile_id, effective_date) do update
  set amount = excluded.amount,
      follows_default = excluded.follows_default;
end;
$$;

-- **덮어쓰지 않는다.** 부를 때마다 새 행이고 계산이 마지막 행을 쓴다 — 「원래대로」도
-- `p_minutes = 0`인 새 행이다. 지우면 이력이 사라진다(plan AC-04).
--
-- **함수가 결근을 모른다.** 음수를 계산해 넣는 것은 화면이고 여기는 분만 받는다.
create function public.set_adjustment(
  p_day_id uuid,
  p_profile_id uuid,
  p_minutes integer,
  p_reason text
)
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

  -- 조정은 배정에 붙는다(PAY-002). 그날 그 사람의 살아 있는 배정이 없으면 붙을 자리가 없다.
  if not exists (
    select 1
    from public.assignments
    where assignments.day_id = p_day_id
      and assignments.profile_id = p_profile_id
      and assignments.ended_at is null
  ) then
    raise exception using message = 'not_allowed';
  end if;

  caller_profile_id := internal.active_profile_id();

  insert into public.adjustments (
    day_id,
    profile_id,
    minutes,
    reason,
    adjusted_by
  )
  values (p_day_id, p_profile_id, p_minutes, p_reason, caller_profile_id);
end;
$$;

-- `internal`이라 PostgREST가 못 부른다. `p_rows`의 원소는 표의 열 이름을 그대로 쓴
-- `{ "holiday_date": "2026-03-01", "name": "삼일절" }` 꼴이다.
--
-- **빈 배열이면 아무것도 안 한다.** 받아오기가 빈손으로 돌아온 날 그 해를 통째로 비우는 일이
-- 없어야 한다. `manual` 행도 안 건드린다 — 손으로 넣은 임시공휴일은 받아오기의 소관이 아니다.
create function internal.import_holidays(p_year integer, p_rows jsonb)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return;
  end if;

  delete from public.holidays
  where holidays.source = 'api'
    and holidays.holiday_date >= make_date(p_year, 1, 1)
    and holidays.holiday_date < make_date(p_year + 1, 1, 1);

  insert into public.holidays (holiday_date, source, name)
  select (entry ->> 'holiday_date')::date, 'api', entry ->> 'name'
  from jsonb_array_elements(p_rows) as entry
  on conflict (holiday_date, source) do update
  set name = excluded.name;
end;
$$;

-- **근무를 여는 날인지 다시 검사하지 않는다**(PAY-027). 그 조건은 줄을 그리는 화면이 들고,
-- 계산은 `holidays`를 안 읽어(PAY-024) 근무 없는 날의 행이 아무 값도 안 바꾼다.
--
-- 같은 날짜에 `api` 행이 있으면 아무것도 안 한다 — 이미 공휴일이라 손으로 켜고 끌 것이 없다.
create function public.set_holiday(p_date date, p_on boolean)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if exists (
    select 1
    from public.holidays
    where holidays.holiday_date = p_date
      and holidays.source = 'api'
  ) then
    return;
  end if;

  if p_on then
    insert into public.holidays (holiday_date, source)
    values (p_date, 'manual')
    on conflict (holiday_date, source) do nothing;

    return;
  end if;

  delete from public.holidays
  where holidays.holiday_date = p_date
    and holidays.source = 'manual';
end;
$$;
