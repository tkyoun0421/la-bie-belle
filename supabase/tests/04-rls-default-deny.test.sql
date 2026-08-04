begin;
select plan(15);

select is(
  (select relrowsecurity from pg_class where oid = 'public.positions'::regclass),
  true,
  'positions has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.venue_settings'::regclass),
  true,
  'venue_settings has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.check_in_rules'::regclass),
  true,
  'check_in_rules has row level security enabled'
);

set local role anon;

select is_empty(
  $$select 1 from positions$$,
  'anon reads no positions'
);
select is_empty(
  $$select 1 from venue_settings$$,
  'anon reads no venue_settings'
);
select is_empty(
  $$select 1 from check_in_rules$$,
  'anon reads no check_in_rules'
);
select throws_ok(
  $$insert into positions (name, default_required_count, gender_requirement)
    values ('anon 침입', 1, 'any')$$,
  '42501',
  null,
  'anon cannot insert positions'
);
select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (1, 1, 1, 1, 1)$$,
  '42501',
  null,
  'anon cannot insert venue_settings'
);
select throws_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in)
    values ('23:00', '22:00')$$,
  '42501',
  null,
  'anon cannot insert check_in_rules'
);

reset role;
set local role authenticated;

select is_empty(
  $$select 1 from positions$$,
  'authenticated reads no positions'
);
select is_empty(
  $$select 1 from venue_settings$$,
  'authenticated reads no venue_settings'
);
select is_empty(
  $$select 1 from check_in_rules$$,
  'authenticated reads no check_in_rules'
);
select throws_ok(
  $$insert into positions (name, default_required_count, gender_requirement)
    values ('authenticated 침입', 1, 'any')$$,
  '42501',
  null,
  'authenticated cannot insert positions'
);
select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (1, 1, 1, 1, 1)$$,
  '42501',
  null,
  'authenticated cannot insert venue_settings'
);
select throws_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in)
    values ('23:30', '22:30')$$,
  '42501',
  null,
  'authenticated cannot insert check_in_rules'
);

reset role;

select * from finish();
rollback;
