alter table public.event_templates
  add column if not exists is_primary boolean not null default false;

create unique index if not exists event_templates_single_primary_idx
  on public.event_templates (is_primary)
  where is_primary;

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
begin
  if coalesce(p_is_primary, false) then
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
    coalesce(p_is_primary, false),
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
begin
  if coalesce(p_is_primary, false) then
    update public.event_templates
    set is_primary = false
    where id <> p_template_id and is_primary = true;
  end if;

  update public.event_templates
  set
    name = trim(p_name),
    is_primary = coalesce(p_is_primary, false),
    time_label = to_char(p_first_service_at, 'HH24:MI') || ' - ' || to_char(p_last_service_end_at, 'HH24:MI'),
    first_service_at = p_first_service_at,
    last_service_end_at = p_last_service_end_at
  where id = p_template_id;

  if not found then
    raise exception 'event template not found'
      using errcode = 'P0002';
  end if;

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
