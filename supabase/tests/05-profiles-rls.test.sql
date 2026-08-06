begin;
select plan(19);

select has_table('public', 'profiles', 'profiles table');
select col_is_pk('public', 'profiles', 'id', 'profiles pk');
select col_type_is('public', 'profiles', 'id', 'uuid', 'profiles.id type');
select col_is_fk('public', 'profiles', array['id'], 'profiles.id references auth.users');
select col_not_null('public', 'profiles', 'created_at', 'profiles.created_at not null');
select col_type_is(
  'public', 'profiles', 'created_at', 'timestamp with time zone', 'profiles.created_at type'
);
select col_has_default('public', 'profiles', 'created_at', 'profiles.created_at has a default');

select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'profiles has row level security enabled'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'profiles'),
  3,
  'profiles has exactly three policies (select own, insert own pending, select admin)'
);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.profiles (id, name, phone, gender, birth_date) values
  ('11111111-1111-1111-1111-111111111111', '홍길동', '01011110001', 'male', '1990-01-01'),
  ('22222222-2222-2222-2222-222222222222', '김영희', '01022220002', 'female', '1990-01-01');

set local role anon;

select is_empty(
  $$select 1 from profiles$$,
  'anon reads no profiles'
);
select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('33333333-3333-3333-3333-333333333333', '박민수', '01033330003', 'male', '1990-01-01')$$,
  '42501',
  null,
  'anon cannot insert profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select results_eq(
  $$select id from profiles order by id$$,
  $$values ('11111111-1111-1111-1111-111111111111'::uuid)$$,
  'authenticated sees only their own profile row'
);
select is(
  (select count(*)::int from profiles),
  1,
  'authenticated does not see the other profile row'
);
select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('44444444-4444-4444-4444-444444444444', '최지훈', '01044440004', 'male', '1990-01-01')$$,
  '42501',
  null,
  'authenticated cannot insert a profile for another id'
);
select lives_ok(
  $$update profiles set created_at = '2020-01-01 00:00:00+00' where id = '11111111-1111-1111-1111-111111111111'$$,
  'authenticated update raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  'authenticated delete raises no error because rows are filtered, not denied'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select results_eq(
  $$select id from profiles order by id$$,
  $$values ('22222222-2222-2222-2222-222222222222'::uuid)$$,
  'the other authenticated user sees only their own profile row'
);

reset role;

select isnt(
  (select created_at from profiles where id = '11111111-1111-1111-1111-111111111111'),
  '2020-01-01 00:00:00+00'::timestamptz,
  'the attempted update value was not actually written through rls'
);
select is(
  (select count(*)::int from profiles),
  2,
  'no profile row was modified through rls'
);

select * from finish();
rollback;
