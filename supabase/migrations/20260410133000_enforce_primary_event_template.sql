do $$
begin
  if exists (select 1 from public.event_templates)
    and not exists (
      select 1
      from public.event_templates
      where is_primary = true
    ) then
    update public.event_templates
    set is_primary = true
    where id = (
      select id
      from public.event_templates
      order by created_at asc, id asc
      limit 1
    );
  end if;
end;
$$;

create or replace function public.create_event_template(
  p_name text,
  p_first_service_at time,
  p_last_service_end_at time,
  p_slot_defaults jsonb,
  p_is_primary boolean default false,
  p_created_by uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_template_id uuid;
  v_should_be_primary boolean := coalesce(p_is_primary, false);
begin
  if not exists (
    select 1
    from public.event_templates
    where is_primary = true
  ) then
    v_should_be_primary := true;
  end if;

  if v_should_be_primary then
    update public.event_templates
    set is_primary = false
    where is_primary = true;
  end if;

  insert into public.event_templates (
    name,
    is_primary,
    time_label,
    first_service_at,
    last_service_end_at,
    created_by
  )
  values (
    trim(p_name),
    v_should_be_primary,
    to_char(p_first_service_at, 'HH24:MI') || ' - ' || to_char(p_last_service_end_at, 'HH24:MI'),
    p_first_service_at,
    p_last_service_end_at,
    p_created_by
  )
  returning id into v_template_id;

  insert into public.event_template_position_slots (
    template_id,
    position_id,
    required_count_override,
    training_count
  )
  select
    v_template_id,
    position.id,
    case
      when desired.required_count = position.default_required_count then null
      else desired.required_count
    end,
    desired.training_count
  from jsonb_array_elements(p_slot_defaults) as slot
  join public.positions as position
    on position.id = (slot ->> 'position_id')::uuid
  cross join lateral (
    select
      greatest(((slot ->> 'required_count')::integer), 1) as required_count,
      greatest(coalesce((slot ->> 'training_count')::integer, 0), 0) as training_count
  ) as desired;

  return v_template_id;
end;
$$;

create or replace function public.update_event_template(
  p_template_id uuid,
  p_name text,
  p_first_service_at time,
  p_last_service_end_at time,
  p_slot_defaults jsonb,
  p_is_primary boolean default false
)
returns uuid
language plpgsql
as $$
declare
  v_current_is_primary boolean;
  v_should_be_primary boolean := coalesce(p_is_primary, false);
begin
  select is_primary
  into v_current_is_primary
  from public.event_templates
  where id = p_template_id;

  if not found then
    raise exception 'event template not found'
      using errcode = 'P0002';
  end if;

  if not v_should_be_primary then
    if not exists (
      select 1
      from public.event_templates
      where id <> p_template_id
        and is_primary = true
    ) then
      v_should_be_primary := true;
    end if;
  end if;

  if v_should_be_primary then
    update public.event_templates
    set is_primary = false
    where id <> p_template_id and is_primary = true;
  end if;

  update public.event_templates
  set
    name = trim(p_name),
    is_primary = v_should_be_primary,
    time_label = to_char(p_first_service_at, 'HH24:MI') || ' - ' || to_char(p_last_service_end_at, 'HH24:MI'),
    first_service_at = p_first_service_at,
    last_service_end_at = p_last_service_end_at
  where id = p_template_id;

  delete from public.event_template_position_slots
  where template_id = p_template_id;

  insert into public.event_template_position_slots (
    template_id,
    position_id,
    required_count_override,
    training_count
  )
  select
    p_template_id,
    position.id,
    case
      when desired.required_count = position.default_required_count then null
      else desired.required_count
    end,
    desired.training_count
  from jsonb_array_elements(p_slot_defaults) as slot
  join public.positions as position
    on position.id = (slot ->> 'position_id')::uuid
  cross join lateral (
    select
      greatest(((slot ->> 'required_count')::integer), 1) as required_count,
      greatest(coalesce((slot ->> 'training_count')::integer, 0), 0) as training_count
  ) as desired;

  return p_template_id;
end;
$$;
