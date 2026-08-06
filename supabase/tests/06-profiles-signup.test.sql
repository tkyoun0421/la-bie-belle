begin;
select plan(30);

select has_type('public', 'profile_status', 'profile_status enum');
select enum_has_labels(
  'public',
  'profile_status',
  array['pending', 'active', 'rejected', 'dormant', 'departed'],
  'profile_status labels'
);

select col_not_null('public', 'profiles', 'name', 'profiles.name not null');
select col_type_is('public', 'profiles', 'name', 'text', 'profiles.name type');
select col_not_null('public', 'profiles', 'phone', 'profiles.phone not null');
select col_type_is('public', 'profiles', 'phone', 'text', 'profiles.phone type');
select col_is_unique('public', 'profiles', 'phone', 'profiles.phone unique');
select col_not_null('public', 'profiles', 'gender', 'profiles.gender not null');
select col_type_is('public', 'profiles', 'gender', 'gender', 'profiles.gender type');
select col_not_null('public', 'profiles', 'birth_date', 'profiles.birth_date not null');
select col_type_is('public', 'profiles', 'birth_date', 'date', 'profiles.birth_date type');
select col_not_null('public', 'profiles', 'status', 'profiles.status not null');
select col_type_is('public', 'profiles', 'status', 'profile_status', 'profiles.status type');
select col_has_default('public', 'profiles', 'status', 'profiles.status has a default');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555555');

select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('44444444-4444-4444-4444-444444444444', '홍길동', '0212345678', 'male', '1990-01-01')$$,
  '23514',
  null,
  'phone not starting with 01 is rejected by the format check'
);

select lives_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('44444444-4444-4444-4444-444444444444', '홍길동', '0101234567', 'male', '1990-01-01')$$,
  '10-digit phone is accepted by the format check'
);

select lives_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('55555555-5555-5555-5555-555555555555', '김영희', '01012340005', 'female', '1990-01-01')$$,
  '11-digit phone is accepted by the format check'
);

set local role anon;

select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('11111111-1111-1111-1111-111111111111', '홍길동', '01012340001', 'male', '1990-01-01')$$,
  '42501',
  null,
  'anon cannot insert profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select lives_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('11111111-1111-1111-1111-111111111111', '홍길동', '01012340001', 'male', '1990-01-01')$$,
  'authenticated user can insert their own pending profile'
);
select is(
  (select status from profiles where id = '11111111-1111-1111-1111-111111111111'),
  'pending'::profile_status,
  'a profile inserted without an explicit status defaults to pending'
);
select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('11111111-1111-1111-1111-111111111111', '홍길동', '01012340009', 'male', '1990-01-01')$$,
  '23505',
  null,
  'a second insert for the same id is rejected as a duplicate'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('11111111-1111-1111-1111-111111111111', '가짜', '01012340008', 'male', '1990-01-01')$$,
  '42501',
  null,
  'authenticated user cannot insert a profile for another id'
);
select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date)
    values ('22222222-2222-2222-2222-222222222222', '이영수', '01012340001', 'male', '1990-01-01')$$,
  '23505',
  null,
  'authenticated user cannot reuse a phone number already taken'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date, status)
    values ('33333333-3333-3333-3333-333333333333', '박민수', '01012340003', 'male', '1990-01-01', 'active')$$,
  '42501',
  null,
  'authenticated user cannot insert their own profile with a non-pending status'
);

reset role;
set local role anon;

select lives_ok(
  $$update profiles set name = name || ' 변조'$$,
  'anon update profiles raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  'anon delete profiles raises no error because rows are filtered, not denied'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select lives_ok(
  $$update profiles set name = name || ' 변조' where id = '11111111-1111-1111-1111-111111111111'$$,
  'authenticated update raises no error because rows are filtered, not denied'
);
select lives_ok(
  $$delete from profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  'authenticated delete raises no error because rows are filtered, not denied'
);

reset role;

select isnt(
  (select name from profiles where id = '11111111-1111-1111-1111-111111111111'),
  '홍길동 변조',
  'the attempted update value was not actually written through rls'
);
select is(
  (select count(*)::int from profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'no profile row was deleted through rls'
);

select * from finish();
rollback;
