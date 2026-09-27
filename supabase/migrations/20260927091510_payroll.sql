-- 급여가 소유하는 표 넷이다. **금액을 저장하는 열이 하나도 없다** — 확정해 잠그는 행이
-- 없어(payroll/README.md PAY-020) 앱이 매번 다시 계산한다. 근무를 고치면 지난주 금액이
-- 따라 바뀌는 것이 규칙이고, 그래서 여기 서는 것은 금액이 아니라 금액의 재료다
-- (plan AC-01).

-- 시급 이력이다. `(profile_id, effective_date)`가 곧 키라 같은 날 두 번 바꾸면 덮어쓴다
-- (PAY-011) — 하루에 값 둘이 서면 그날 어느 값으로 셌는지가 사라진다.
--
-- `follows_default`가 끈이다. 기본 시급을 바꾸면 이 값이 참인 사람 전원에게 새 행이 같이
-- 서고(PAY-013), 개별로 정한 사람은 그 자리에 안 든다. 「지금 따르는가」를 행마다 실어서
-- 계산이 `wage_rates` 한 표만 읽는다.
--
-- 상한 100,000원을 표가 든다. 화면도 같은 값을 거는데(payroll/screens/wages.md) 0을 하나 더
-- 친 실수가 한 화면 너머에서 막히면 안 된다.
create table public.wage_rates (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  effective_date date not null,
  amount integer not null check (amount > 0 and amount <= 100000),
  follows_default boolean not null,
  primary key (profile_id, effective_date)
);

create table public.default_wage_rates (
  effective_date date primary key,
  amount integer not null check (amount > 0 and amount <= 100000)
);

-- 조정은 이력이다. **unique를 안 건다** — 계산이 `adjusted_at`이 가장 늦은 행을 쓰고
-- (payroll/design.md 「조정」·data-access.md 「이력」) 지난 값은 그대로 남는다.
-- 「원래대로」도 지우는 것이 아니라 `minutes = 0`인 새 행이다.
--
-- **「결근」 열이 없다.** 관리자가 결근을 고르면 화면이 그날 배정 시간만큼의 음수를
-- `minutes`에 넣는다 — 함수도 표도 결근이라는 말을 모른다.
create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  minutes integer not null,
  reason text,
  adjusted_by uuid not null references public.profiles (id),
  adjusted_at timestamptz not null default now()
);

-- 그 달 급여를 읽을 때 날 묶음으로 들어온다.
create index adjustments_day_id_idx on public.adjustments (day_id);

-- 키에 `source`가 든다 — 같은 날짜에 받아온 행과 손으로 넣은 행이 같이 설 수 있어야 재수입이
-- 임시공휴일을 안 지운다(payroll/design.md 「공휴일」).
create table public.holidays (
  holiday_date date not null,
  source text not null check (source in ('api', 'manual')),
  name text,
  primary key (holiday_date, source)
);

alter table public.wage_rates enable row level security;
alter table public.default_wage_rates enable row level security;
alter table public.adjustments enable row level security;
alter table public.holidays enable row level security;

-- 본인 행과 관리자만이다(PAY-018). 화면에서 안 그리는 것으로는 직접 질의하는 길이 안 닫힌다.
create policy wage_rates_select
  on public.wage_rates
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id = wage_rates.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

create policy default_wage_rates_select
  on public.default_wage_rates
  for select
  to authenticated
  using (public.is_admin());

-- 기본값이다 — 그날 명단에 서는 값이라 같은 날 배정된 사람들이 서로 본다.
create policy adjustments_select
  on public.adjustments
  for select
  to authenticated
  using (public.is_approved());

create policy holidays_select
  on public.holidays
  for select
  to authenticated
  using (public.is_approved());

-- 넷 다 직접 쓰기 정책이 없다. 넣고 고치고 지우는 길은 함수뿐이다.
revoke all on public.wage_rates from anon, authenticated;
revoke all on public.default_wage_rates from anon, authenticated;
revoke all on public.adjustments from anon, authenticated;
revoke all on public.holidays from anon, authenticated;

grant select on public.wage_rates to authenticated;
grant select on public.default_wage_rates to authenticated;
grant select on public.adjustments to authenticated;
grant select on public.holidays to authenticated;
