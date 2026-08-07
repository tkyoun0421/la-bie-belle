begin;
select plan(82);

select has_function(
  'public', 'update_worker_info', array['uuid', 'text', 'gender', 'date', 'text'],
  'update_worker_info(uuid, text, gender, date, text) exists'
);
select has_function(
  'public', 'set_hourly_wage', array['uuid', 'integer'],
  'set_hourly_wage(uuid, integer) exists'
);
select has_function(
  'public', 'update_own_phone', array['text'],
  'update_own_phone(text) exists — 본인 수정 경로는 phone 하나뿐이다'
);
select has_function(
  'public', 'grant_position_eligibility', array['uuid', 'uuid'],
  'grant_position_eligibility(uuid, uuid) exists'
);
select has_function(
  'public', 'revoke_position_eligibility', array['uuid', 'uuid'],
  'revoke_position_eligibility(uuid, uuid) exists'
);

insert into auth.users (id, email) values
  ('a1000000-0000-0000-0000-000000000001', 'wm-admin@labiebelle.test'),
  ('a1000000-0000-0000-0000-000000000010', 'wm-worker-a@labiebelle.test'),
  ('a1000000-0000-0000-0000-000000000011', 'wm-worker-b@labiebelle.test'),
  ('a1000000-0000-0000-0000-000000000012', 'wm-worker-c@labiebelle.test'),
  ('a1000000-0000-0000-0000-000000000013', 'wm-worker-pending@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status) values
  ('a1000000-0000-0000-0000-000000000001', '관리자', '01070000001', 'male', '1988-01-01', 'active'),
  ('a1000000-0000-0000-0000-000000000010', '근무자에이', '01070000010', 'male', '1990-01-01', 'active'),
  ('a1000000-0000-0000-0000-000000000011', '근무자비', '01070000011', 'female', '1991-02-02', 'active'),
  ('a1000000-0000-0000-0000-000000000012', '근무자씨', '01070000012', 'male', '1992-03-03', 'active'),
  ('a1000000-0000-0000-0000-000000000013', '근무자디', '01070000013', 'male', '1993-04-04', 'pending');

insert into public.profile_roles (profile_id, role, granted_by) values
  ('a1000000-0000-0000-0000-000000000001', 'admin', null);

insert into public.positions (name, default_required_count, gender_requirement, is_default, is_active)
values
  ('임시비활성포지션', 1, 'any', false, false),
  ('임시미사용포지션', 1, 'any', false, true);

-- =====================================================================
-- AC2 관리자 수정: 개인정보·시급
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '근무자에이-개정', 'female', '1990-05-05', '01079990010'
  )$$,
  '관리자는 근무자 개인정보를 수정할 수 있다'
);
reset role;

select is(
  (select name from profiles where id = 'a1000000-0000-0000-0000-000000000010'),
  '근무자에이-개정',
  '개인정보 수정이 이름에 반영된다'
);
select is(
  (select phone from profiles where id = 'a1000000-0000-0000-0000-000000000010'),
  '01079990010',
  '개인정보 수정이 휴대폰에 반영된다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'worker_info_updated'),
  1,
  '개인정보 수정 감사 행이 정확히 하나 생긴다'
);
select is(
  (select detail -> 'name' ->> 'after' from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'worker_info_updated'),
  '근무자에이-개정',
  '감사 detail에 변경 후 이름이 담긴다'
);
select ok(
  (select detail ? 'gender' from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'worker_info_updated'),
  '감사 detail에 변경된 gender 필드가 담긴다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000010', 15000)$$,
  '관리자는 근무자 시급을 수정할 수 있다'
);
reset role;

select is(
  (select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000010'),
  15000,
  '시급 수정이 반영된다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'hourly_wage_updated'),
  1,
  '시급 수정 감사 행이 정확히 하나 생긴다'
);
select is(
  (select detail from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'hourly_wage_updated'),
  jsonb_build_object('before', null, 'after', 15000),
  '시급 감사 detail이 변경 전후 값을 담는다'
);

-- 주요 실패: 휴대폰 중복
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '근무자에이', 'male', '1990-01-01', '01070000011'
  )$$,
  '23505',
  null,
  '휴대폰 중복 시 전용 코드(23505)로 거부된다'
);
reset role;

select is(
  (select phone from profiles where id = 'a1000000-0000-0000-0000-000000000010'),
  '01079990010',
  '휴대폰 중복 거부 시 대상 상태가 바뀌지 않는다'
);

-- 경계값: 시급 범위
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000010', 0)$$,
  'LB001',
  null,
  '시급 0은 전용 SQLSTATE(LB001)로 거부된다'
);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000010', -100)$$,
  'LB001',
  null,
  '음수 시급도 LB001로 거부된다'
);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000010', 100001)$$,
  'LB001',
  null,
  '상한(100000) 초과 시급도 LB001로 거부된다'
);
reset role;

select is(
  (select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000010'),
  15000,
  '시급 경계값 거부는 기존 값을 바꾸지 않는다'
);

-- 권한: 일반 근무자의 함수 직접 호출
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000011', true);
select throws_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '해킹시도', 'male', '1990-01-01', '01079990099'
  )$$,
  '42501',
  null,
  '일반 근무자의 update_worker_info 직접 호출은 거부된다'
);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000012', 20000)$$,
  '42501',
  null,
  '일반 근무자가 타인 시급을 직접 호출로 바꾸려 하면 거부된다'
);
reset role;

-- 권한: anon 주체의 직접 호출도 거부된다(F-04)
-- set_config는 role 전환과 무관하게 트랜잭션에 남으므로 이전 세션의 claim을 명시적으로 비운다
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '익명시도', 'male', '1990-01-01', '01079990098'
  )$$,
  '42501',
  null,
  'anon의 update_worker_info 호출은 거부된다'
);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000010', 99000)$$,
  '42501',
  null,
  'anon의 set_hourly_wage 호출은 거부된다'
);
reset role;

-- 중복 요청: 같은 값 재수정은 멱등(감사 중복 없음)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '근무자에이-개정', 'female', '1990-05-05', '01079990010'
  )$$,
  '동일 값 재수정은 오류 없이 통과한다'
);
select lives_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000010', 15000)$$,
  '동일 시급 재수정도 오류 없이 통과한다'
);
reset role;

select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'worker_info_updated'),
  1,
  '동일 값 재수정은 감사 행을 추가하지 않는다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'hourly_wage_updated'),
  1,
  '동일 시급 재수정도 감사 행을 추가하지 않는다'
);

-- 순차 수정(진짜 동시성 아님): 후행 값이 유효하고 감사가 호출 순서를 보존한다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '근무자에이-먼저', 'female', '1990-05-05', '01079990010'
  )$$,
  '순차 수정 1회차'
);
select lives_ok(
  $$select update_worker_info(
    'a1000000-0000-0000-0000-000000000010', '근무자에이-나중', 'female', '1990-05-05', '01079990010'
  )$$,
  '순차 수정 2회차'
);
reset role;

select is(
  (select name from profiles where id = 'a1000000-0000-0000-0000-000000000010'),
  '근무자에이-나중',
  '후행 값이 최종 상태에 유효하게 반영된다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'worker_info_updated'),
  3,
  '순차 수정마다 감사 행이 하나씩 늘어 총 3건이다'
);
select is(
  (
    select array_agg(detail -> 'name' ->> 'after' order by seq)
    from identity_audit_logs
    where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'worker_info_updated'
  ),
  array['근무자에이-개정', '근무자에이-먼저', '근무자에이-나중'],
  '감사 행이 seq(bigint identity) 기준으로 호출 순서를 보존한다 — created_at은 한 트랜잭션에서 전부 동률이라 정본으로 쓰지 않는다'
);

-- =====================================================================
-- AC3 본인 수정
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000011', true);
select lives_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000011', 13000)$$,
  '본인은 자신의 시급을 수정할 수 있다'
);
select lives_ok(
  $$select update_own_phone('01079990011')$$,
  '본인은 자신의 휴대폰을 수정할 수 있다'
);
reset role;

select is(
  (select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000011'),
  13000,
  '본인 시급 수정이 반영된다'
);
select is(
  (select phone from profiles where id = 'a1000000-0000-0000-0000-000000000011'),
  '01079990011',
  '본인 휴대폰 수정이 반영된다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000011' and event = 'phone_updated'),
  1,
  '본인 휴대폰 수정 감사 행이 생긴다'
);
select is(
  (select actor_profile_id from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000011' and event = 'phone_updated'),
  'a1000000-0000-0000-0000-000000000011'::uuid,
  '본인 판정은 auth.uid() 기준이라 처리자가 본인 자신이다'
);
select is(
  (select phone from profiles where id = 'a1000000-0000-0000-0000-000000000012'),
  '01070000012',
  '본인 휴대폰 수정이 다른 근무자 행에는 영향을 주지 않는다'
);

-- 주요 실패: 타인 대상 호출 거부
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000011', true);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000012', 14000)$$,
  '42501',
  null,
  '본인이 타인 시급을 대상으로 호출하면 거부된다'
);
reset role;

select is(
  (select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000012'),
  null,
  '거부된 타인 대상 호출은 상태를 바꾸지 않는다'
);

-- 권한: anon 주체의 update_own_phone 직접 호출도 거부된다(F-04)
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select update_own_phone('01079990097')$$,
  '42501',
  null,
  'anon의 update_own_phone 호출은 거부된다'
);
reset role;

-- 권한: 비활성(pending) 본인은 자신의 시급·휴대폰도 수정할 수 없다(F-01)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000013', true);
select throws_ok(
  $$select set_hourly_wage('a1000000-0000-0000-0000-000000000013', 12000)$$,
  '42501',
  null,
  'pending 상태인 본인의 set_hourly_wage 호출도 거부된다'
);
select throws_ok(
  $$select update_own_phone('01079990096')$$,
  '42501',
  null,
  'pending 상태인 본인의 update_own_phone 호출도 거부된다'
);
reset role;

-- 중복 요청: 중복 휴대폰 재제출 일관 거부
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000012', true);
select throws_ok(
  $$select update_own_phone('01079990011')$$,
  '23505',
  null,
  '이미 쓰인 휴대폰으로 본인 수정을 시도하면 거부된다'
);
select throws_ok(
  $$select update_own_phone('01079990011')$$,
  '23505',
  null,
  '동일한 중복 시도를 재제출해도 일관되게 거부된다'
);
reset role;

-- =====================================================================
-- AC4 민감 필드 차단
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select isnt_empty(
  $$select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000010'$$,
  '관리자는 타인의 시급을 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000010', true);
select isnt_empty(
  $$select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000010'$$,
  '본인은 자신의 시급을 조회할 수 있다'
);
select is_empty(
  $$select hourly_wage from profiles where id = 'a1000000-0000-0000-0000-000000000011'$$,
  '일반 근무자는 타인의 시급을 조회할 수 없다(RLS 빈 결과)'
);
select is_empty(
  $$select name, phone, birth_date from profiles where id = 'a1000000-0000-0000-0000-000000000011'$$,
  '일반 근무자는 타인의 개인정보도 조회할 수 없다(RLS 빈 결과)'
);
reset role;

-- =====================================================================
-- AC5 포지션 부여·회수
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '관리자는 비기본 포지션을 부여할 수 있다'
);
reset role;

select is(
  (
    select count(*)::int from worker_position_eligibilities
    where profile_id = 'a1000000-0000-0000-0000-000000000010'
      and position_id = (select id from positions where name = '스캔')
  ),
  1,
  '부여된 eligibility 행이 존재한다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'position_granted'),
  1,
  '포지션 부여 감사 행이 생긴다'
);

-- eligibilities RLS: 관리자·본인·타인
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select isnt_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'a1000000-0000-0000-0000-000000000010'$$,
  '관리자는 근무자의 eligibility 행을 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000010', true);
select isnt_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'a1000000-0000-0000-0000-000000000010'$$,
  '본인은 자신의 eligibility 행을 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000011', true);
select is_empty(
  $$select 1 from worker_position_eligibilities where profile_id = 'a1000000-0000-0000-0000-000000000010'$$,
  '타인은 다른 근무자의 eligibility 행을 조회할 수 없다'
);
reset role;

-- 주요 실패: 기본 포지션 저장 시도는 트리거가 거부한다
select throws_ok(
  $$insert into worker_position_eligibilities (profile_id, position_id, granted_by)
    values (
      'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '매니저'),
      'a1000000-0000-0000-0000-000000000001'
    )$$,
  'P0001',
  null,
  '기본 포지션 직접 insert는 트리거가 거부한다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '안내')
  )$$,
  'P0001',
  null,
  'grant_position_eligibility로도 기본 포지션 부여 시도는 트리거가 거부한다'
);
reset role;

-- 경계값: 비활성 포지션 부여 거부, 이미 부여된 행 재부여 멱등
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '임시비활성포지션')
  )$$,
  'LB002',
  null,
  '비활성 포지션 부여는 LB002로 거부된다'
);
select lives_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '이미 부여된 포지션을 다시 부여해도 오류 없이 통과한다'
);
reset role;

select is(
  (
    select count(*)::int from worker_position_eligibilities
    where profile_id = 'a1000000-0000-0000-0000-000000000010'
      and position_id = (select id from positions where name = '스캔')
  ),
  1,
  '재부여는 행을 중복시키지 않는다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'position_granted' and detail ->> 'position_id' = (select id::text from positions where name = '스캔')),
  1,
  '재부여는 감사 행을 중복시키지 않는다'
);

-- 권한: 일반 근무자의 부여·회수 시도
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000011', true);
select throws_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '메인')
  )$$,
  '42501',
  null,
  '일반 근무자의 grant_position_eligibility 호출은 거부된다'
);
select throws_ok(
  $$select revoke_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '42501',
  null,
  '일반 근무자의 revoke_position_eligibility 호출은 거부된다'
);
reset role;

-- 권한: anon 주체의 부여·회수 직접 호출도 거부된다(F-04)
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '42501',
  null,
  'anon의 grant_position_eligibility 호출은 거부된다'
);
select throws_ok(
  $$select revoke_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '42501',
  null,
  'anon의 revoke_position_eligibility 호출은 거부된다'
);
reset role;

-- 중복 요청: 회수 재호출은 무변화로 수렴한다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select revoke_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '관리자는 부여된 포지션을 회수할 수 있다'
);
reset role;

select is(
  (
    select count(*)::int from worker_position_eligibilities
    where profile_id = 'a1000000-0000-0000-0000-000000000010'
      and position_id = (select id from positions where name = '스캔')
  ),
  0,
  '회수 후 eligibility 행이 사라진다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'position_revoked'),
  1,
  '회수 감사 행이 생긴다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select revoke_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '스캔')
  )$$,
  '이미 회수된 포지션을 다시 회수해도 오류 없이 통과한다'
);
reset role;

select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'position_revoked'),
  1,
  '재회수는 감사 행을 추가하지 않는다'
);

-- 멱등성(순차 재호출, 진짜 동시성 아님): 재부여가 PK로 단일 행에 수렴한다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '메인')
  )$$,
  '메인 포지션 재부여 시도 1회차'
);
select lives_ok(
  $$select grant_position_eligibility(
    'a1000000-0000-0000-0000-000000000010', (select id from positions where name = '메인')
  )$$,
  '메인 포지션 재부여 시도 2회차'
);
reset role;

select is(
  (
    select count(*)::int from worker_position_eligibilities
    where profile_id = 'a1000000-0000-0000-0000-000000000010'
      and position_id = (select id from positions where name = '메인')
  ),
  1,
  '재부여는 PK 제약으로 단일 행에 멱등하게 수렴한다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'a1000000-0000-0000-0000-000000000010' and event = 'position_granted' and detail ->> 'position_id' = (select id::text from positions where name = '메인')),
  1,
  '재부여는 감사 행을 중복시키지 않는다'
);

-- =====================================================================
-- AC6 삭제 차단(P0-T03 이월 검증)
-- =====================================================================

select throws_ok(
  $$delete from positions where name = '메인'$$,
  '23503',
  null,
  '쓰인 포지션의 delete는 RESTRICT로 차단된다'
);
select is(
  (select count(*)::int from positions where name = '메인'),
  1,
  '차단 후에도 포지션 행은 그대로 남아 있다'
);
select is(
  (
    select count(*)::int from worker_position_eligibilities
    where profile_id = 'a1000000-0000-0000-0000-000000000010'
      and position_id = (select id from positions where name = '메인')
  ),
  1,
  '차단 후에도 eligibility 참조가 그대로 남아 있다'
);

select lives_ok(
  $$delete from positions where name = '임시미사용포지션'$$,
  '쓰이지 않은 포지션의 delete는 허용된다'
);
select is(
  (select count(*)::int from positions where name = '임시미사용포지션'),
  0,
  '쓰이지 않은 포지션은 실제로 삭제된다'
);

select * from finish();
rollback;
