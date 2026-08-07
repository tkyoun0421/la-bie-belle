begin;
select plan(96);

-- =====================================================================
-- 픽스처: 주체 10종 + 행별 전용 대상(전용 UUID 대역 f1)
-- =====================================================================

insert into auth.users (id, email) values
  ('f1000000-0000-0000-0000-000000000002', 'authz-pending@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000003', 'authz-rejected@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000004', 'authz-dormant@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000005', 'authz-departed@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000006', 'authz-worker-self@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000007', 'authz-worker-other@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000008', 'authz-team-lead@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000009', 'authz-admin@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000010', 'authz-super-admin@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000020', 'authz-appointment-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000021', 'authz-dormant-self-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000022', 'authz-dormant-admin-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000023', 'authz-dormant-super-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000024', 'authz-dormant-deny-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000025', 'authz-active-admin-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000026', 'authz-active-super-target@labiebelle.test'),
  ('f1000000-0000-0000-0000-000000000027', 'authz-active-deny-target@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage) values
  ('f1000000-0000-0000-0000-000000000002', '대기주체', '01080000002', 'male', '1990-01-01', 'pending', null, null),
  ('f1000000-0000-0000-0000-000000000003', '거절주체', '01080000003', 'male', '1990-01-01', 'rejected', null, null),
  ('f1000000-0000-0000-0000-000000000004', '휴면주체', '01080000004', 'male', '1990-01-01', 'dormant', now() - interval '10 days', null),
  ('f1000000-0000-0000-0000-000000000005', '탈퇴주체', '01080000005', 'male', '1990-01-01', 'departed', null, null),
  ('f1000000-0000-0000-0000-000000000006', '본인주체', '01080000006', 'male', '1990-01-01', 'active', now(), 13000),
  ('f1000000-0000-0000-0000-000000000007', '타인주체', '01080000007', 'female', '1991-02-02', 'active', now(), 14000),
  ('f1000000-0000-0000-0000-000000000008', '팀장후보', '01080000008', 'male', '1990-03-03', 'active', now(), 13000),
  ('f1000000-0000-0000-0000-000000000009', '관리자주체', '01080000009', 'male', '1985-04-04', 'active', now(), null),
  ('f1000000-0000-0000-0000-000000000010', '슈퍼관리자주체', '01080000010', 'male', '1985-05-05', 'active', now(), null),
  ('f1000000-0000-0000-0000-000000000020', '임명대상', '01080000020', 'male', '1992-06-06', 'active', now(), null),
  ('f1000000-0000-0000-0000-000000000021', '본인휴면해제대상', '01080000021', 'female', '1993-07-07', 'dormant', now() - interval '5 days', null),
  ('f1000000-0000-0000-0000-000000000022', '관리자휴면해제대상', '01080000022', 'female', '1994-08-08', 'dormant', now() - interval '6 days', null),
  ('f1000000-0000-0000-0000-000000000023', '슈퍼휴면해제대상', '01080000023', 'female', '1995-09-09', 'dormant', now() - interval '7 days', null),
  ('f1000000-0000-0000-0000-000000000024', '휴면해제거부대상', '01080000024', 'female', '1996-10-10', 'dormant', now() - interval '8 days', null),
  ('f1000000-0000-0000-0000-000000000025', '관리자휴면처리대상', '01080000025', 'male', '1997-11-11', 'active', now(), null),
  ('f1000000-0000-0000-0000-000000000026', '슈퍼휴면처리대상', '01080000026', 'male', '1998-12-12', 'active', now(), null),
  ('f1000000-0000-0000-0000-000000000027', '휴면처리거부대상', '01080000027', 'male', '1999-01-13', 'active', now(), null);

insert into public.profile_roles (profile_id, role, granted_by) values
  ('f1000000-0000-0000-0000-000000000009', 'admin', null),
  ('f1000000-0000-0000-0000-000000000010', 'super_admin', null);

insert into public.worker_position_eligibilities (profile_id, position_id, granted_by) values
  ('f1000000-0000-0000-0000-000000000006', (select id from positions where name = '스캔'), null),
  ('f1000000-0000-0000-0000-000000000008', (select id from positions where code = 'team_lead'), null);

insert into public.positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('행렬용비활성포지션', 1, 'any', false, false);

-- =====================================================================
-- 비활성 4종 빈 역할(개별 단언)
-- =====================================================================

select is(
  effective_roles('f1000000-0000-0000-0000-000000000002'),
  array[]::text[],
  '픽스처: pending 주체의 effective_roles는 빈 배열이다'
);
select is(
  effective_roles('f1000000-0000-0000-0000-000000000003'),
  array[]::text[],
  '픽스처: rejected 주체의 effective_roles는 빈 배열이다'
);
select is(
  effective_roles('f1000000-0000-0000-0000-000000000004'),
  array[]::text[],
  '픽스처: dormant 주체의 effective_roles는 빈 배열이다'
);
select is(
  effective_roles('f1000000-0000-0000-0000-000000000005'),
  array[]::text[],
  '픽스처: departed 주체의 effective_roles는 빈 배열이다'
);

-- =====================================================================
-- 행1 본인 프로필 조회·휴대폰 수정
-- =====================================================================

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select update_own_phone('01099990001')$$,
  '42501',
  null,
  '행1(본인 프로필): anon의 update_own_phone 호출은 거부된다'
);
select is_empty(
  $$select 1 from profiles$$,
  '행1(본인 프로필): anon은 자신의 프로필로 읽을 행이 없다(전체 조회 0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select update_own_phone('01099990002')$$,
  '42501',
  null,
  '행1(본인 프로필): pending 주체의 update_own_phone 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select update_own_phone('01099990003')$$,
  '42501',
  null,
  '행1(본인 프로필): rejected 주체의 update_own_phone 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$select update_own_phone('01099990004')$$,
  '42501',
  null,
  '행1(본인 프로필): dormant 주체의 update_own_phone 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select update_own_phone('01099990005')$$,
  '42501',
  null,
  '행1(본인 프로필): departed 주체의 update_own_phone 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000006', true);
select isnt_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000006'$$,
  '행1(본인 프로필): active 본인은 자신의 프로필을 조회할 수 있다'
);
select lives_ok(
  $$select update_own_phone('01099990006')$$,
  '행1(본인 프로필): active 본인은 자신의 휴대폰을 수정할 수 있다'
);
reset role;
select is(
  (select phone from profiles where id = 'f1000000-0000-0000-0000-000000000006'),
  '01099990006',
  '행1(본인 프로필): 본인의 휴대폰 수정이 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000006'$$,
  '행1(본인 프로필): 타인 근무자는 다른 근무자의 프로필을 조회할 수 없다(0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select isnt_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000008'$$,
  '행1(본인 프로필): 팀장 후보도 자신의 프로필을 조회할 수 있다'
);
select lives_ok(
  $$select update_own_phone('01099990008')$$,
  '행1(본인 프로필): 팀장 후보도 자신의 휴대폰을 수정할 수 있다'
);
reset role;
select is(
  (select phone from profiles where id = 'f1000000-0000-0000-0000-000000000008'),
  '01099990008',
  '행1(본인 프로필): 팀장 후보의 휴대폰 수정이 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000009', true);
select lives_ok(
  $$select update_worker_info(
    'f1000000-0000-0000-0000-000000000020', '임명대상-개정', 'male', '1992-06-06', '01099990020'
  )$$,
  '행1(본인 프로필): admin은 다른 근무자의 프로필을 전체 관리할 수 있다'
);
reset role;
select is(
  (select name from profiles where id = 'f1000000-0000-0000-0000-000000000020'),
  '임명대상-개정',
  '행1(본인 프로필): admin의 관리가 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select lives_ok(
  $$select update_worker_info(
    'f1000000-0000-0000-0000-000000000023', '슈퍼휴면해제대상-개정', 'female', '1995-09-09', '01099990023'
  )$$,
  '행1(본인 프로필): super_admin은 다른 근무자의 프로필을 전체 관리할 수 있다'
);
reset role;
select is(
  (select name from profiles where id = 'f1000000-0000-0000-0000-000000000023'),
  '슈퍼휴면해제대상-개정',
  '행1(본인 프로필): super_admin의 관리가 실제로 반영된다'
);

-- =====================================================================
-- 행2 가능 포지션·시급
-- =====================================================================

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000006', 15000)$$,
  '42501',
  null,
  '행2(가능 포지션·시급): anon의 set_hourly_wage 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000002', 15000)$$,
  '42501',
  null,
  '행2(가능 포지션·시급): pending 주체의 본인 시급 수정은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000003', 15000)$$,
  '42501',
  null,
  '행2(가능 포지션·시급): rejected 주체의 본인 시급 수정은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000004', 15000)$$,
  '42501',
  null,
  '행2(가능 포지션·시급): dormant 주체의 본인 시급 수정은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000005', 15000)$$,
  '42501',
  null,
  '행2(가능 포지션·시급): departed 주체의 본인 시급 수정은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000006', true);
select isnt_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'f1000000-0000-0000-0000-000000000006'$$,
  '행2(가능 포지션·시급): 본인은 자신의 가능 포지션을 조회할 수 있다'
);
select lives_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000006', 13500)$$,
  '행2(가능 포지션·시급): 본인은 자신의 시급을 수정할 수 있다'
);
reset role;
select is(
  (select hourly_wage from profiles where id = 'f1000000-0000-0000-0000-000000000006'),
  13500,
  '행2(가능 포지션·시급): 본인의 시급 수정이 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000006', 20000)$$,
  '42501',
  null,
  '행2(가능 포지션·시급): 타인 근무자가 다른 근무자의 시급을 수정하려 하면 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select isnt_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'f1000000-0000-0000-0000-000000000008'$$,
  '행2(가능 포지션·시급): 팀장 후보도 자신의 가능 포지션(팀장)을 조회할 수 있다'
);
select lives_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000008', 13500)$$,
  '행2(가능 포지션·시급): 팀장 후보도 자신의 시급을 수정할 수 있다'
);
reset role;
select is(
  (select hourly_wage from profiles where id = 'f1000000-0000-0000-0000-000000000008'),
  13500,
  '행2(가능 포지션·시급): 팀장 후보의 시급 수정이 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000009', true);
select lives_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000007', 14500)$$,
  '행2(가능 포지션·시급): admin은 다른 근무자의 시급을 관리할 수 있다'
);
select throws_ok(
  $$select grant_position_eligibility(
    'f1000000-0000-0000-0000-000000000007', (select id from positions where name = '행렬용비활성포지션')
  )$$,
  'LB002',
  null,
  '행2(가능 포지션·시급): 비활성 포지션 부여는 admin에게도 LB002로 거부된다'
);
select throws_ok(
  $$select set_hourly_wage('f1000000-0000-0000-0000-000000000007', 200000)$$,
  'LB001',
  null,
  '행2(가능 포지션·시급): admin의 시급 관리도 범위를 벗어나면 LB001로 거부된다'
);
reset role;
select is(
  (select hourly_wage from profiles where id = 'f1000000-0000-0000-0000-000000000007'),
  14500,
  '행2(가능 포지션·시급): admin의 시급 관리가 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select lives_ok(
  $$select grant_position_eligibility(
    'f1000000-0000-0000-0000-000000000007', (select id from positions where name = '메인')
  )$$,
  '행2(가능 포지션·시급): super_admin은 다른 근무자의 가능 포지션을 관리할 수 있다'
);
reset role;
select is(
  (
    select count(*)::int from worker_position_eligibilities
    where profile_id = 'f1000000-0000-0000-0000-000000000007'
      and position_id = (select id from positions where name = '메인')
  ),
  1,
  '행2(가능 포지션·시급): super_admin의 포지션 부여가 실제로 반영된다'
);

-- =====================================================================
-- 행3 다른 사람 개인정보
-- =====================================================================

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): anon은 타인의 프로필을 조회할 수 없다(0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): pending 주체는 타인의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): rejected 주체는 타인의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000004', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): dormant 주체는 타인의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000005', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): departed 주체는 타인의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000006', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): 본인(일반 근무자)은 타인의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000006'$$,
  '행3(다른 사람 개인정보): 타인 근무자(반대 방향)도 상대의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select is_empty(
  $$select 1 from profiles where id = 'f1000000-0000-0000-0000-000000000007'$$,
  '행3(다른 사람 개인정보): 팀장 후보도 타인의 프로필을 조회할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000009', true);
select is(
  (select name from profiles where id = 'f1000000-0000-0000-0000-000000000007'),
  '타인주체',
  '행3(다른 사람 개인정보): admin은 타인의 개인정보를 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select is(
  (select name from profiles where id = 'f1000000-0000-0000-0000-000000000006'),
  '본인주체',
  '행3(다른 사람 개인정보): super_admin은 타인의 개인정보를 조회할 수 있다'
);
reset role;

-- =====================================================================
-- 행4 관리자 임명·해제
-- =====================================================================

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): anon의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): pending 주체의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): rejected 주체의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): dormant 주체의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): departed 주체의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000006', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): 본인(일반 근무자)의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): 타인 근무자의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): 팀장 후보의 grant_admin_role 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000009', true);
select throws_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '42501',
  null,
  '행4(관리자 임명·해제): admin의 grant_admin_role 호출도 거부된다(super_admin 전용)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select lives_ok(
  $$select grant_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '행4(관리자 임명·해제): super_admin은 임명할 수 있다'
);
reset role;
select is(
  (select count(*)::int from profile_roles where profile_id = 'f1000000-0000-0000-0000-000000000020' and role = 'admin'),
  1,
  '행4(관리자 임명·해제): super_admin의 임명이 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select lives_ok(
  $$select revoke_admin_role('f1000000-0000-0000-0000-000000000020')$$,
  '행4(관리자 임명·해제): super_admin은 해제할 수 있다'
);
reset role;
select is(
  (select count(*)::int from profile_roles where profile_id = 'f1000000-0000-0000-0000-000000000020' and role = 'admin'),
  0,
  '행4(관리자 임명·해제): super_admin의 해제가 실제로 반영된다'
);

-- =====================================================================
-- 행5 휴면 해제
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000021', true);
select lives_ok(
  $$select reactivate_own_profile()$$,
  '행5(휴면 해제): dormant 본인은 스스로 재활성화할 수 있다'
);
reset role;
select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000021'),
  'active'::profile_status,
  '행5(휴면 해제): dormant 본인의 재활성화가 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000009', true);
select lives_ok(
  $$select reactivate_worker('f1000000-0000-0000-0000-000000000022')$$,
  '행5(휴면 해제): admin은 dormant 대상을 재활성화할 수 있다'
);
reset role;
select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000022'),
  'active'::profile_status,
  '행5(휴면 해제): admin의 재활성화가 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select lives_ok(
  $$select reactivate_worker('f1000000-0000-0000-0000-000000000023')$$,
  '행5(휴면 해제): super_admin은 dormant 대상을 재활성화할 수 있다'
);
reset role;
select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000023'),
  'active'::profile_status,
  '행5(휴면 해제): super_admin의 재활성화가 실제로 반영된다'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select reactivate_worker('f1000000-0000-0000-0000-000000000024')$$,
  '42501',
  null,
  '행5(휴면 해제): anon의 reactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select reactivate_own_profile()$$,
  'LB011',
  null,
  '행5(휴면 해제): pending 주체의 자기 재활성화는 상태 부적합(LB011)으로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select reactivate_own_profile()$$,
  'LB011',
  null,
  '행5(휴면 해제): rejected 주체의 자기 재활성화는 상태 부적합(LB011)으로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select reactivate_own_profile()$$,
  'LB011',
  null,
  '행5(휴면 해제): departed 주체의 자기 재활성화는 상태 부적합(LB011)으로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000006', true);
select throws_ok(
  $$select reactivate_own_profile()$$,
  'LB011',
  null,
  '행5(휴면 해제): active 본인의 자기 재활성화는 상태 부적합(LB011)으로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select throws_ok(
  $$select reactivate_worker('f1000000-0000-0000-0000-000000000024')$$,
  '42501',
  null,
  '행5(휴면 해제): 타인 근무자의 reactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select throws_ok(
  $$select reactivate_own_profile()$$,
  'LB011',
  null,
  '행5(휴면 해제): 팀장 후보의 자기 재활성화는 상태 부적합(LB011)으로 거부된다'
);
reset role;

select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000024'),
  'dormant'::profile_status,
  '행5(휴면 해제): 거부 시도들은 대상 상태를 바꾸지 못했다'
);

-- =====================================================================
-- 행6 수동 휴면
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000009', true);
select lives_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000025')$$,
  '행6(수동 휴면): admin은 active 대상을 휴면 처리할 수 있다'
);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000002')$$,
  'LB010',
  null,
  '행6(수동 휴면): admin이 비active 대상을 휴면 처리하면 상태 부적합(LB010)으로 거부된다'
);
reset role;
select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000025'),
  'dormant'::profile_status,
  '행6(수동 휴면): admin의 휴면 처리가 실제로 반영된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000010', true);
select lives_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000026')$$,
  '행6(수동 휴면): super_admin은 active 대상을 휴면 처리할 수 있다'
);
reset role;
select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000026'),
  'dormant'::profile_status,
  '행6(수동 휴면): super_admin의 휴면 처리가 실제로 반영된다'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): anon의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): pending 주체의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): rejected 주체의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): dormant 주체의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): departed 주체의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000006', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): 본인(일반 근무자)의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): 타인 근무자의 deactivate_worker 호출은 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '행6(수동 휴면): 팀장 후보의 deactivate_worker 호출은 거부된다'
);
reset role;

select is(
  (select status from profiles where id = 'f1000000-0000-0000-0000-000000000027'),
  'active'::profile_status,
  '행6(수동 휴면): 거부 시도들은 대상 상태를 바꾸지 못했다'
);

-- =====================================================================
-- 팀장 후보 동일성
-- =====================================================================

select is(
  effective_roles('f1000000-0000-0000-0000-000000000006'),
  array['worker']::text[],
  '동일성: 일반 근무자의 유효 역할은 worker뿐이다'
);
select is(
  effective_roles('f1000000-0000-0000-0000-000000000008'),
  array['worker']::text[],
  '동일성: 팀장 포지션 보유자의 유효 역할도 worker뿐이다(동일)'
);
select is(
  is_admin('f1000000-0000-0000-0000-000000000008'),
  false,
  '동일성: 팀장 포지션 보유가 is_admin 판정에 영향을 주지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000008', true);
select isnt_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'f1000000-0000-0000-0000-000000000008'$$,
  '동일성: 팀장 후보는 자신의 팀장 포지션 보유 행을 조회할 수 있다(본인 읽기 범위는 일반 근무자와 동일)'
);
select throws_ok(
  $$select deactivate_worker('f1000000-0000-0000-0000-000000000027')$$,
  '42501',
  null,
  '동일성: 팀장 후보의 deactivate_worker 호출도 일반 근무자와 동일하게 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000007', true);
select is_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'f1000000-0000-0000-0000-000000000008'$$,
  '동일성: 타인 근무자는 팀장 후보의 포지션 보유 행을 조회할 수 없다(팀장이라도 예외 없음)'
);
reset role;

select * from finish();
rollback;
