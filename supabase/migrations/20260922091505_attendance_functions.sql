create schema internal;

revoke all on schema internal from anon, authenticated;

create function internal.distance_meters(
  p_lat_a double precision,
  p_lng_a double precision,
  p_lat_b double precision,
  p_lng_b double precision
)
  returns double precision
  language sql
  immutable
  set search_path = ''
as $$
  select 2 * 6371000 * asin(
    sqrt(
      sin(radians(p_lat_b - p_lat_a) / 2) ^ 2
      + cos(radians(p_lat_a))
        * cos(radians(p_lat_b))
        * sin(radians(p_lng_b - p_lng_a) / 2) ^ 2
    )
  );
$$;

create function internal.check_in(
  p_profile_id uuid,
  p_day_id uuid,
  p_reported_at timestamptz,
  p_method text,
  p_lat double precision,
  p_lng double precision,
  p_qr_code text,
  p_now timestamptz
)
  returns void
  language plpgsql
  set search_path = ''
as $$
declare
  target_day public.days;
  hall public.halls;
  opens_at timestamptz;
  closes_at timestamptz;
  resolved_checked_at timestamptz;
begin
  select * into target_day
  from public.days
  where id = p_day_id;

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.assignments
    where day_id = p_day_id
      and profile_id = p_profile_id
      and ended_at is null
  ) then
    raise exception using message = 'not_allowed';
  end if;

  select * into hall
  from public.halls
  limit 1;

  if p_method = 'location' then
    if round(
      internal.distance_meters(hall.lat, hall.lng, p_lat, p_lng)
    )::integer > hall.radius_m then
      raise exception using message = 'too_far';
    end if;
  else
    if not exists (
      select 1
      from public.hall_secrets
      where hall_id = hall.id
        and qr_code = p_qr_code
    ) then
      raise exception using message = 'invalid_qr';
    end if;
  end if;

  opens_at :=
    ((target_day.work_date + target_day.starts_at) at time zone 'Asia/Seoul')
    - interval '1 hour';
  closes_at := (target_day.work_date + time '18:00') at time zone 'Asia/Seoul';

  if p_now < opens_at or p_now > closes_at then
    raise exception using message = 'window_closed';
  end if;

  if exists (
    select 1
    from public.check_ins
    where day_id = p_day_id
      and profile_id = p_profile_id
  ) then
    raise exception using message = 'already_done';
  end if;

  resolved_checked_at := p_reported_at;
  if p_reported_at < p_now - interval '10 minutes' or p_reported_at > p_now then
    resolved_checked_at := p_now;
  end if;

  begin
    insert into public.check_ins (
      day_id,
      profile_id,
      checked_at,
      reported_at,
      received_at,
      method
    )
    values (
      p_day_id,
      p_profile_id,
      resolved_checked_at,
      p_reported_at,
      p_now,
      p_method
    );
  exception
    when unique_violation then
      raise exception using message = 'already_done';
  end;
end;
$$;

create function public.check_in(
  p_day_id uuid,
  p_reported_at timestamptz,
  p_method text,
  p_lat double precision,
  p_lng double precision,
  p_qr_code text
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
begin
  if not public.is_approved() then
    raise exception using message = 'not_allowed';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  perform internal.check_in(
    caller_profile_id,
    p_day_id,
    p_reported_at,
    p_method,
    p_lat,
    p_lng,
    p_qr_code,
    now()
  );
end;
$$;

create function internal.submit_excuse(
  p_profile_id uuid,
  p_day_id uuid,
  p_body text,
  p_now timestamptz
)
  returns void
  language plpgsql
  set search_path = ''
as $$
declare
  target_day public.days;
  trimmed_body text := btrim(p_body);
begin
  select * into target_day
  from public.days
  where id = p_day_id;

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if not exists (
    select 1
    from public.assignments
    where day_id = p_day_id
      and profile_id = p_profile_id
      and ended_at is null
  ) then
    raise exception using message = 'not_allowed';
  end if;

  if p_now >
    ((target_day.work_date + target_day.ends_at) at time zone 'Asia/Seoul')
    + interval '48 hours'
  then
    raise exception using message = 'window_closed';
  end if;

  if exists (
    select 1
    from public.check_ins
    where day_id = p_day_id
      and profile_id = p_profile_id
  ) then
    raise exception using message = 'already_done';
  end if;

  if exists (
    select 1
    from public.excuses
    where day_id = p_day_id
      and profile_id = p_profile_id
      and (decided_at is null or decision = 'approved')
  ) then
    raise exception using message = 'already_requested';
  end if;

  if trimmed_body = '' or length(trimmed_body) > 200 then
    raise exception using message = 'invalid_reason';
  end if;

  insert into public.excuses (day_id, profile_id, body, submitted_at)
  values (p_day_id, p_profile_id, trimmed_body, p_now);
end;
$$;

create function public.submit_excuse(p_day_id uuid, p_body text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid;
begin
  if not public.is_approved() then
    raise exception using message = 'not_allowed';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  perform internal.submit_excuse(caller_profile_id, p_day_id, p_body, now());
end;
$$;

create function public.decide_excuse(
  p_excuse_id uuid,
  p_approved boolean,
  p_reason text
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target public.excuses;
  caller_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select * into target
  from public.excuses
  where id = p_excuse_id;

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if target.decided_at is not null then
    raise exception using message = 'already_decided';
  end if;

  if not p_approved and btrim(coalesce(p_reason, '')) = '' then
    raise exception using message = 'invalid_reason';
  end if;

  select id into caller_profile_id
  from public.profiles
  where user_id = auth.uid();

  update public.excuses
  set decided_at = now(),
      decided_by = caller_profile_id,
      decision = case when p_approved then 'approved' else 'rejected' end,
      decision_reason = case when p_approved then null else btrim(p_reason) end
  where id = target.id;
end;
$$;

create function public.rotate_qr()
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target_hall_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  select id into target_hall_id
  from public.halls
  limit 1;

  insert into public.hall_secrets (hall_id, qr_code)
  values (
    target_hall_id,
    encode(extensions.gen_random_bytes(16), 'hex')
  )
  on conflict (hall_id) do update
  set qr_code = excluded.qr_code,
      rotated_at = now();
end;
$$;

create function public.set_hall_location(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  target_hall_id uuid;
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if p_radius_m <= 0
    or p_lat < -90 or p_lat > 90
    or p_lng < -180 or p_lng > 180
  then
    raise exception using message = 'bad_radius';
  end if;

  select id into target_hall_id
  from public.halls
  limit 1;

  update public.halls
  set lat = p_lat,
      lng = p_lng,
      radius_m = p_radius_m
  where id = target_hall_id;
end;
$$;

revoke all on all functions in schema internal from anon, authenticated;
