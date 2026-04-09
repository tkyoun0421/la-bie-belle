alter table public.positions
  add column sort_order integer;

with ordered_positions as (
  select
    id,
    row_number() over (order by created_at asc, name asc, id asc) as next_sort_order
  from public.positions
)
update public.positions as positions
set sort_order = ordered_positions.next_sort_order
from ordered_positions
where ordered_positions.id = positions.id;

alter table public.positions
  alter column sort_order set not null;

create index positions_sort_order_idx
  on public.positions (sort_order);

create or replace function public.set_position_sort_order()
returns trigger
language plpgsql
as $$
begin
  if new.sort_order is null then
    select coalesce(max(sort_order), 0) + 1
      into new.sort_order
    from public.positions;
  end if;

  return new;
end;
$$;

drop trigger if exists set_position_sort_order on public.positions;

create trigger set_position_sort_order
before insert on public.positions
for each row execute function public.set_position_sort_order();

create or replace function public.reorder_positions(p_position_ids uuid[])
returns void
language plpgsql
as $$
begin
  update public.positions as positions
  set sort_order = ordered_positions.next_sort_order
  from (
    select
      position_id,
      ordinality::integer as next_sort_order
    from unnest(p_position_ids) with ordinality as ordered_positions(position_id, ordinality)
  ) as ordered_positions
  where ordered_positions.position_id = positions.id;
end;
$$;
