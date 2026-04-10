create type public.position_allowed_gender as enum ('all', 'female', 'male');

alter table public.positions
  add column allowed_gender public.position_allowed_gender not null default 'all';

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
    required_count,
    training_count
  )
  select
    p_template_id,
    (slot ->> 'position_id')::uuid,
    greatest(((slot ->> 'required_count')::integer), 1),
    greatest(coalesce((slot ->> 'training_count')::integer, 0), 0)
  from jsonb_array_elements(p_slot_defaults) as slot;

  return p_template_id;
end;
$$;
