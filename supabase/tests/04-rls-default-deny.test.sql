begin;
select plan(37);

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

insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-000000000001', 'rls-active-worker@labiebelle.test'),
  ('e0000000-0000-0000-0000-000000000002', 'rls-pending-worker@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('e0000000-0000-0000-0000-000000000001', '활성근무자', '01090000001', 'male', '1990-01-01', 'active', now()),
  ('e0000000-0000-0000-0000-000000000002', '대기근무자', '01090000002', 'female', '1991-02-02', 'pending', null);

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
  'authenticated(무세션) reads no positions'
);
select is_empty(
  $$select 1 from venue_settings$$,
  'authenticated(무세션) reads no venue_settings'
);
select is_empty(
  $$select 1 from check_in_rules$$,
  'authenticated(무세션) reads no check_in_rules'
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

-- 활성 근무자는 positions·venue_settings를 읽을 수 있다(P1-T05 revision 2 — DEV-SEC 이중 강제 보정)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*)::int from positions),
  9,
  '활성 근무자는 positions 전체를 읽을 수 있다'
);
select is(
  (select default_hourly_wage from venue_settings),
  12000,
  '활성 근무자는 venue_settings의 기본 시급을 읽을 수 있다'
);

reset role;

-- pending 근무자는 여전히 0행이다(P0-T03 의미의 연속성)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000002', true);

select is_empty(
  $$select 1 from positions$$,
  'pending 근무자는 positions를 읽을 수 없다'
);
select is_empty(
  $$select 1 from venue_settings$$,
  'pending 근무자는 venue_settings를 읽을 수 없다'
);

reset role;

select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'positions'),
  1,
  'positions has exactly one policy(활성 근무자 select)'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'venue_settings'),
  1,
  'venue_settings has exactly one policy(활성 근무자 select)'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'check_in_rules'),
  0,
  'check_in_rules has zero policies'
);

set local role anon;

select lives_ok(
  $$update positions set name = name || ' 변조'$$,
  'anon update positions raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from positions where code is null$$,
  'anon delete positions raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$update venue_settings set gps_radius_m = 1$$,
  'anon update venue_settings raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from check_in_rules$$,
  'anon delete check_in_rules raises no error because rows are filtered, not denied'
);

reset role;
set local role authenticated;

select lives_ok(
  $$update positions set name = name || ' 변조'$$,
  'authenticated(무세션) update positions raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from positions where code is null$$,
  'authenticated(무세션) delete positions raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$update venue_settings set gps_radius_m = 1$$,
  'authenticated(무세션) update venue_settings raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from check_in_rules$$,
  'authenticated(무세션) delete check_in_rules raises no error because rows are filtered, not denied'
);

reset role;

-- 활성 근무자도 읽기 정책만 있을 뿐 쓰기는 여전히 전부 필터된다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$update positions set name = name || ' 변조'$$,
  '활성 근무자의 update positions도 rows are filtered, not denied'
);
select lives_ok(
  $$delete from positions where code is null$$,
  '활성 근무자의 delete positions도 rows are filtered, not denied'
);
select lives_ok(
  $$update venue_settings set gps_radius_m = 1$$,
  '활성 근무자의 update venue_settings도 rows are filtered, not denied'
);

reset role;

select is(
  (select count(*)::int from positions where name like '% 변조'),
  0,
  'no position name was modified through rls'
);
select is(
  (select count(*)::int from positions),
  9,
  'no position row was deleted through rls'
);
select is(
  (select gps_radius_m from venue_settings),
  100,
  'venue settings stayed unchanged through rls'
);
select is(
  (select count(*)::int from check_in_rules),
  2,
  'check-in rules stayed intact through rls'
);

select * from finish();
rollback;
