-- 근무 신청은 달 단위 덮어쓰기다. 정본은
-- docs/2-design/modules/schedule/design.md 「근무 신청 내기」다.
--
-- 대상 프로필을 인자로 안 받는다 — 남의 신청을 내는 길을 만들지 않는다. `availabilities`에
-- insert·delete 정책이 없고 authenticated에게 select만 열려 있어(20260922091502_schedule.sql)
-- 이 함수가 유일한 쓰기 문이다.
--
-- 검사 순서는 거친 것부터다. 확정된 달은 마감도 지나 있어 둘이 겹치는데 `already_confirmed`가
-- 먼저다 — 화면이 「근무표가 확정됐어요」와 「마감됐어요」를 갈라 말해야 한다.
--
-- 마감은 그 날 끝까지다. 마감일 당일은 받고 다음날부터 `window_closed`다.
create function public.submit_availability(p_month date, p_dates date[])
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  month_start date := date_trunc('month', p_month)::date;
  next_month date := (date_trunc('month', p_month) + interval '1 month')::date;
  requested date[] := coalesce(p_dates, array[]::date[]);
  target public.schedules;
  caller_profile_id uuid;
begin
  if not public.is_approved() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.schedules
  where month = month_start;

  if not found then
    raise exception using message = 'no_schedule';
  end if;

  if target.confirmed_at is not null then
    raise exception using message = 'already_confirmed';
  end if;

  if target.application_deadline is null or target.application_deadline < today then
    raise exception using message = 'window_closed';
  end if;

  if exists (
    select 1
    from unnest(requested) as asked(work_date)
    where asked.work_date < month_start or asked.work_date >= next_month
  ) then
    raise exception using message = 'bad_dates';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  delete from public.availabilities
  where profile_id = caller_profile_id
    and work_date >= month_start
    and work_date < next_month;

  insert into public.availabilities (profile_id, work_date)
  select distinct caller_profile_id, asked.work_date
  from unnest(requested) as asked(work_date);
end;
$$;
