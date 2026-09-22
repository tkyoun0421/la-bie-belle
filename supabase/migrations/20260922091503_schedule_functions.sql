create function public.create_schedule(p_month date, p_deadline date)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if p_deadline < today then
    raise exception using message = 'deadline_past';
  end if;

  if (date_trunc('month', p_month) + interval '1 month')::date - 1 < today then
    raise exception using message = 'month_over';
  end if;

  if exists (select 1 from public.schedules where month = p_month) then
    raise exception using message = 'already_exists';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  insert into public.schedules (month, application_deadline, created_by)
  values (p_month, p_deadline, caller_profile_id);
end;
$$;

create function public.set_application_deadline(p_month date, p_deadline date)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  target public.schedules;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.schedules
  where month = p_month;

  if not found then
    raise exception using message = 'no_schedule';
  end if;

  if target.confirmed_at is not null then
    raise exception using message = 'already_confirmed';
  end if;

  if p_deadline < today then
    raise exception using message = 'deadline_past';
  end if;

  update public.schedules
  set application_deadline = p_deadline
  where id = target.id;
end;
$$;

create function public.confirm_schedule(p_month date)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  target public.schedules;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.schedules
  where month = p_month;

  if not found then
    raise exception using message = 'no_schedule';
  end if;

  if target.confirmed_at is not null then
    raise exception using message = 'already_confirmed';
  end if;

  if target.application_deadline is null or target.application_deadline >= today then
    raise exception using message = 'too_early';
  end if;

  update public.schedules
  set confirmed_at = now()
  where id = target.id;
end;
$$;

create function public.open_day(p_work_date date)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  target public.schedules;
  hall public.halls;
  caller_profile_id uuid;
  new_day_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if p_work_date < today then
    raise exception using message = 'date_past';
  end if;

  select * into target
  from public.schedules
  where month = date_trunc('month', p_work_date)::date;

  if not found then
    raise exception using message = 'no_schedule';
  end if;

  if exists (select 1 from public.days where work_date = p_work_date) then
    raise exception using message = 'already_open';
  end if;

  select * into hall
  from public.halls
  limit 1;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  insert into public.days (schedule_id, work_date, starts_at, ends_at, opened_by)
  values (
    target.id,
    p_work_date,
    hall.default_starts,
    hall.default_ends,
    caller_profile_id
  )
  returning id into new_day_id;

  insert into public.slots (day_id, positions)
  select
    new_day_id,
    (
      select array_agg(position_name order by position_order)
      from jsonb_array_elements_text(entry.value -> 'positions')
        with ordinality as listed(position_name, position_order)
    )
  from jsonb_array_elements(hall.default_slots) as entry(value)
  cross join generate_series(1, (entry.value ->> 'count')::int);
end;
$$;

create function public.close_day(p_work_date date)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target_day public.days;
  target_schedule public.schedules;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target_day
  from public.days
  where work_date = p_work_date;

  if not found then
    raise exception using message = 'not_open';
  end if;

  select * into target_schedule
  from public.schedules
  where id = target_day.schedule_id;

  if target_schedule.confirmed_at is not null then
    raise exception using message = 'already_confirmed';
  end if;

  delete from public.days
  where id = target_day.id;
end;
$$;

-- 본식 시각은 안 정한 날이 있다.
create function public.set_day_hours(
  p_work_date date,
  p_starts time,
  p_ends time,
  p_ceremony time default null
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target_day public.days;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target_day
  from public.days
  where work_date = p_work_date;

  if not found then
    raise exception using message = 'not_open';
  end if;

  if p_ends <= p_starts then
    raise exception using message = 'bad_hours';
  end if;

  update public.days
  set starts_at = p_starts,
      ends_at = p_ends,
      ceremony_at = p_ceremony
  where id = target_day.id;
end;
$$;

create function public.set_hall_defaults(
  p_slots jsonb,
  p_starts time,
  p_ends time
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  hall_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select id into hall_id
  from public.halls
  limit 1;

  update public.halls
  set default_slots = p_slots,
      default_starts = p_starts,
      default_ends = p_ends
  where id = hall_id;
end;
$$;
