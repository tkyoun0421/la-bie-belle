create or replace function public.create_event(
  p_template_id uuid,
  p_title text,
  p_event_date date,
  p_created_by uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_event_id uuid;
  v_template public.event_templates%rowtype;
begin
  select *
  into v_template
  from public.event_templates
  where id = p_template_id;

  if not found then
    raise exception 'event template not found'
      using errcode = 'P0002';
  end if;

  insert into public.events (
    template_id,
    title,
    time_label,
    event_date,
    first_service_at,
    last_service_end_at,
    created_by
  )
  values (
    p_template_id,
    trim(p_title),
    v_template.time_label,
    p_event_date,
    v_template.first_service_at,
    v_template.last_service_end_at,
    p_created_by
  )
  returning id into v_event_id;

  insert into public.event_position_slots (
    event_id,
    position_id,
    required_count,
    training_count
  )
  select
    v_event_id,
    template_slot.position_id,
    coalesce(
      template_slot.required_count_override,
      position.default_required_count
    ),
    template_slot.training_count
  from public.event_template_position_slots as template_slot
  join public.positions as position
    on position.id = template_slot.position_id
  where template_slot.template_id = p_template_id;

  return v_event_id;
end;
$$;
