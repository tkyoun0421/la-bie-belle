-- 리허설은 근무표 밖에 선다. `days`를 안 가리키고 `work_date`가 날짜를 직접 들어서, 근무표를
-- 아직 안 만든 달에도 이미 지난 날에도 행이 선다(schedule/README.md SCH-022). FK를 걸면 그
-- 둘이 막힌다.
--
-- 갈래 열이 없다. check 하나가 「시각 둘이 있고 count가 비었거나, count만 있고 시각 둘이
-- 비었거나」를 강제해 행이 스스로 어느 갈래인지 말한다(plan AC-01).
create table public.rehearsals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  starts_at time,
  ends_at time,
  count integer,
  created_at timestamptz not null default now(),
  check (
    (starts_at is not null and ends_at is not null and count is null)
    or (count is not null and starts_at is null and ends_at is null)
  ),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (count is null or count between 1 and 9)
);

-- 건수 갈래는 하루 한 줄이다(SCH-023). 시각 갈래는 구간만 안 겹치면 여럿이라 조건부 index다.
create unique index rehearsals_count_per_day
  on public.rehearsals (profile_id, work_date)
  where count is not null;

alter table public.rehearsals enable row level security;

-- 본인 행과 관리자만 읽는다(SCH-021). `is_approved()`로 여는 기본값을 좁힌다 — 다른
-- 근무자에게는 남의 리허설이 안 보인다.
create policy rehearsals_select
  on public.rehearsals
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.profiles
      where profiles.id = rehearsals.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

-- 직접 쓰기 정책이 없다. 넣고 고치고 지우는 길은 함수 셋뿐이다.
revoke all on public.rehearsals from anon, authenticated;

grant select on public.rehearsals to authenticated;
