alter table public.positions
  add column default_required_count integer not null default 2;

alter table public.positions
  add constraint positions_default_required_count_check
  check (default_required_count > 0);
