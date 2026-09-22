create table public.halls (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null,
  default_slots jsonb not null,
  default_starts time not null,
  default_ends time not null
);

alter table public.halls enable row level security;

create policy halls_select
  on public.halls
  for select
  to authenticated
  using (public.is_approved());

revoke all on public.halls from anon, authenticated;
grant select on public.halls to authenticated;

insert into public.halls (
  lat,
  lng,
  radius_m,
  default_slots,
  default_starts,
  default_ends
)
values (
  37.000000,
  127.000000,
  200,
  '[
    {"positions": ["팀장"], "count": 1},
    {"positions": ["스캔"], "count": 1},
    {"positions": ["메인"], "count": 1},
    {"positions": ["드레스"], "count": 1},
    {"positions": ["축가"], "count": 1},
    {"positions": ["매니저"], "count": 2},
    {"positions": ["안내"], "count": 2},
    {"positions": ["드레스실"], "count": 1},
    {"positions": ["대기실"], "count": 1}
  ]'::jsonb,
  '10:00',
  '22:00'
);
