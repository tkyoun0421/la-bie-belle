insert into public.users (
  id,
  email,
  role,
  name,
  phone,
  hourly_wage,
  venue_lat,
  venue_lng,
  checkin_radius_m
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'admin@labiebelle.local',
    'admin',
    '관리자',
    '010-1111-1111',
    15000,
    37.5112000,
    127.0982000,
    150
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'manager@labiebelle.local',
    'manager',
    '팀장',
    '010-2222-2222',
    14000,
    37.5112000,
    127.0982000,
    150
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'member1@labiebelle.local',
    'member',
    '팀원1',
    '010-3333-3333',
    12000,
    37.5112000,
    127.0982000,
    150
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'member2@labiebelle.local',
    'member',
    '팀원2',
    '010-4444-4444',
    12000,
    37.5112000,
    127.0982000,
    150
  )
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  name = excluded.name,
  phone = excluded.phone,
  hourly_wage = excluded.hourly_wage,
  venue_lat = excluded.venue_lat,
  venue_lng = excluded.venue_lng,
  checkin_radius_m = excluded.checkin_radius_m;
