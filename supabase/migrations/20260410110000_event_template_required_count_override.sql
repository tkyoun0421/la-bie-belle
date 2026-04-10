alter table public.event_template_position_slots
  rename column required_count to required_count_override;

alter table public.event_template_position_slots
  alter column required_count_override drop default,
  alter column required_count_override drop not null;

alter table public.event_template_position_slots
  drop constraint if exists event_template_position_slots_required_count_check;

alter table public.event_template_position_slots
  add constraint event_template_position_slots_required_count_override_check
    check (
      required_count_override is null
      or required_count_override > 0
    );

-- Existing templates were created before the override model existed.
-- Reset them to "follow the position default" so position defaults become the source of truth.
update public.event_template_position_slots
set required_count_override = null;

create or replace function public.create_event_template(
  p_name text,
  p_first_service_at time,
  p_last_service_end_at time,
  p_slot_defaults jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_template_id uuid;
begin
  insert into public.event_templates (
    name,
    time_label,
    first_service_at,
    last_service_end_at,
    created_by
  )
  values (
    trim(p_name),
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
  p_slot_defaults jsonb
)
returns uuid
language plpgsql
as $$
begin
  update public.event_templates
  set
    name = trim(p_name),
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
