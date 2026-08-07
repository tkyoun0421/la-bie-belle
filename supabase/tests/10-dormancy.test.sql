begin;
select plan(57);

select has_column('public', 'profiles', 'inactivity_anchor_at', 'profiles.inactivity_anchor_at exists');
select col_type_is(
  'public', 'profiles', 'inactivity_anchor_at', 'timestamp with time zone',
  'profiles.inactivity_anchor_at type'
);
select col_not_null(
  'public', 'profiles', 'name', 'profiles.name은 여전히 not null이다(회귀 방지)'
);

select has_function(
  'public', 'deactivate_worker', array['uuid'], 'deactivate_worker(uuid) exists'
);
select has_function(
  'public', 'reactivate_worker', array['uuid'], 'reactivate_worker(uuid) exists'
);
select has_function(
  'public', 'reactivate_own_profile', array[]::text[], 'reactivate_own_profile() exists'
);
select ok(
  pg_get_functiondef('deactivate_worker(uuid)'::regprocedure) ~* 'for update',
  'deactivate_worker locks the target row before checking its state'
);
select ok(
  pg_get_functiondef('reactivate_worker(uuid)'::regprocedure) ~* 'for update',
  'reactivate_worker locks the target row before checking its state'
);
select ok(
  pg_get_functiondef('reactivate_own_profile()'::regprocedure) ~* 'for update',
  'reactivate_own_profile locks the caller row before checking its state'
);

insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-000000000001', 'dormancy-admin@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000002', 'dormancy-nonadmin@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000010', 'dormancy-target-deactivate@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000011', 'dormancy-target-reactivate-admin@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000012', 'dormancy-target-reactivate-self@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000013', 'dormancy-target-pending@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000014', 'dormancy-target-approve@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000015', 'dormancy-target-rejected@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000016', 'dormancy-target-departed@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000017', 'dormancy-target-dormant-admin@labiebelle.test'),
  ('d0000000-0000-0000-0000-000000000018', 'dormancy-bootstrap-pending@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('d0000000-0000-0000-0000-000000000001', '관리자', '01060000001', 'male', '1988-01-01', 'active', now()),
  ('d0000000-0000-0000-0000-000000000002', '일반근무자', '01060000002', 'male', '1990-01-01', 'active', now()),
  ('d0000000-0000-0000-0000-000000000010', '휴면대상', '01060000010', 'female', '1991-02-02', 'active', now()),
  ('d0000000-0000-0000-0000-000000000011', '재활성화대상관리자용', '01060000011', 'male', '1992-03-03', 'dormant', now() - interval '10 days'),
  ('d0000000-0000-0000-0000-000000000012', '재활성화대상본인용', '01060000012', 'female', '1993-04-04', 'dormant', now() - interval '20 days'),
  ('d0000000-0000-0000-0000-000000000013', '대기중대상', '01060000013', 'male', '1994-05-05', 'pending', null),
  ('d0000000-0000-0000-0000-000000000014', '승인예정대상', '01060000014', 'female', '1995-06-06', 'pending', null),
  ('d0000000-0000-0000-0000-000000000015', '거절상태대상', '01060000015', 'male', '1996-07-07', 'rejected', null),
  ('d0000000-0000-0000-0000-000000000016', '탈퇴상태대상', '01060000016', 'female', '1997-08-08', 'departed', null),
  ('d0000000-0000-0000-0000-000000000017', '휴면관리자권한보유자', '01060000017', 'male', '1998-09-09', 'dormant', now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000000018', '부트스트랩대상', '01060000018', 'female', '1999-10-10', 'pending', null);

insert into public.profile_roles (profile_id, role, granted_by) values
  ('d0000000-0000-0000-0000-000000000001', 'admin', null),
  ('d0000000-0000-0000-0000-000000000017', 'admin', null);

-- =====================================================================
-- CHECK 투영: active·dormant는 anchor 필수, 그 외 상태는 null 허용
-- =====================================================================

insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-000000000090', 'dormancy-check-anchor@labiebelle.test');

select throws_ok(
  $$insert into profiles (id, name, phone, gender, birth_date, status)
    values ('d0000000-0000-0000-0000-000000000090', '앵커없는활성', '01069990001', 'male', '1990-01-01', 'active')$$,
  '23514',
  null,
  'anchor 없는 active insert는 CHECK로 거부된다'
);
select lives_ok(
  $$insert into profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at)
    values ('d0000000-0000-0000-0000-000000000090', '앵커있는활성', '01069990001', 'male', '1990-01-01', 'active', now())$$,
  'anchor 있는 active insert는 통과한다'
);
select throws_ok(
  $$update profiles set status = 'dormant', inactivity_anchor_at = null
    where id = 'd0000000-0000-0000-0000-000000000090'$$,
  '23514',
  null,
  'anchor 없는 dormant 전환도 CHECK로 거부된다'
);
select lives_ok(
  $$update profiles set status = 'rejected', inactivity_anchor_at = null
    where id = 'd0000000-0000-0000-0000-000000000090'$$,
  'rejected 전환은 anchor를 null로 되돌려도 통과한다'
);

-- =====================================================================
-- AC1 anchor 도입: approve_signup이 활성 전환 시 anchor를 기록한다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select approve_signup('d0000000-0000-0000-0000-000000000014')$$,
  '관리자는 pending 대상을 승인할 수 있다(anchor 기록 전제)'
);
reset role;

select is(
  (select status from profiles where id = 'd0000000-0000-0000-0000-000000000014'),
  'active'::profile_status,
  '승인 후 대상 상태가 active로 바뀐다'
);
select isnt(
  (select inactivity_anchor_at from profiles where id = 'd0000000-0000-0000-0000-000000000014'),
  null,
  '승인 시 inactivity_anchor_at이 서버 시각으로 기록된다'
);

select is(
  bootstrap_super_admin('dormancy-bootstrap-pending@labiebelle.test'),
  true,
  'bootstrap_super_admin으로 승격된 pending 대상도 최초 활성 승인 경로다'
);
select isnt(
  (select inactivity_anchor_at from profiles where id = 'd0000000-0000-0000-0000-000000000018'),
  null,
  'bootstrap_super_admin으로 승격돼도 inactivity_anchor_at이 서버 시각으로 기록된다'
);

-- =====================================================================
-- AC2 관리자 수동 휴면
-- =====================================================================

create temporary table dormancy_anchor_before as
select inactivity_anchor_at as before_value
from profiles
where id = 'd0000000-0000-0000-0000-000000000010';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000010')$$,
  '관리자는 active 대상을 휴면 처리할 수 있다'
);
reset role;

select is(
  (select status from profiles where id = 'd0000000-0000-0000-0000-000000000010'),
  'dormant'::profile_status,
  '휴면 처리 후 대상 상태가 dormant로 바뀐다'
);
select is(
  (select inactivity_anchor_at from profiles where id = 'd0000000-0000-0000-0000-000000000010'),
  (select before_value from dormancy_anchor_before),
  '휴면 처리는 anchor 값을 정확히 그대로 유지한다(전후 값 일치)'
);
select is(
  (
    select count(*)::int from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000010' and event = 'profile_dormanted'
  ),
  1,
  '휴면 처리 감사 행이 정확히 하나 생긴다'
);
select is(
  (
    select detail from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000010' and event = 'profile_dormanted'
  ),
  jsonb_build_object('before', 'active', 'after', 'dormant'),
  '휴면 처리 감사 detail이 before·after 상태만 담는다'
);
select is(
  (
    select actor_profile_id from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000010' and event = 'profile_dormanted'
  ),
  'd0000000-0000-0000-0000-000000000001'::uuid,
  '휴면 처리 감사의 행위자가 처리한 관리자다'
);

-- 주요 실패: active가 아닌 대상의 휴면 처리는 거부된다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000013')$$,
  'LB010',
  null,
  'pending 대상의 휴면 처리는 LB010으로 거부된다'
);
select throws_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000015')$$,
  'LB010',
  null,
  'rejected 대상의 휴면 처리도 LB010으로 거부된다'
);
select throws_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000016')$$,
  'LB010',
  null,
  'departed 대상의 휴면 처리도 LB010으로 거부된다'
);
select throws_ok(
  $$select deactivate_worker('99999999-9999-9999-9999-999999999999')$$,
  'LB010',
  null,
  '무프로필 대상의 휴면 처리도 LB010으로 거부된다'
);
reset role;

-- 중복 요청: 이미 dormant인 대상 재휴면 시도는 거부되어 멱등하게 수렴한다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000010')$$,
  'LB010',
  null,
  '이미 dormant인 대상의 재휴면 시도는 LB010으로 거부된다'
);
reset role;

select is(
  (
    select count(*)::int from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000010' and event = 'profile_dormanted'
  ),
  1,
  '거부된 재휴면 시도는 감사 행을 중복시키지 않는다'
);

-- 권한: 비관리자·anon의 직접 호출은 거부된다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000010')$$,
  '42501',
  null,
  '일반 근무자(admin 아님)의 deactivate_worker 호출은 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select deactivate_worker('d0000000-0000-0000-0000-000000000010')$$,
  '42501',
  null,
  'anon의 deactivate_worker 호출은 거부된다'
);
reset role;

-- =====================================================================
-- AC3 재활성화(관리자·본인)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000011')$$,
  '관리자는 dormant 대상을 재활성화할 수 있다'
);
reset role;

select is(
  (select status from profiles where id = 'd0000000-0000-0000-0000-000000000011'),
  'active'::profile_status,
  '관리자 재활성화 후 대상 상태가 active로 바뀐다'
);
select ok(
  (select inactivity_anchor_at from profiles where id = 'd0000000-0000-0000-0000-000000000011')
    > (now() - interval '1 minute'),
  '관리자 재활성화는 anchor를 서버 시각으로 갱신한다'
);
select is(
  (
    select count(*)::int from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000011' and event = 'profile_reactivated'
  ),
  1,
  '관리자 재활성화 감사 행이 정확히 하나 생긴다'
);
select is(
  (
    select detail from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000011' and event = 'profile_reactivated'
  ),
  jsonb_build_object('before', 'dormant', 'after', 'active'),
  '관리자 재활성화 감사 detail이 before·after 상태만 담는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000012', true);
select lives_ok(
  $$select reactivate_own_profile()$$,
  '본인은 dormant 상태에서 스스로 재활성화할 수 있다'
);
reset role;

select is(
  (select status from profiles where id = 'd0000000-0000-0000-0000-000000000012'),
  'active'::profile_status,
  '본인 재활성화 후 상태가 active로 바뀐다'
);
select ok(
  (select inactivity_anchor_at from profiles where id = 'd0000000-0000-0000-0000-000000000012')
    > (now() - interval '1 minute'),
  '본인 재활성화도 anchor를 서버 시각으로 갱신한다'
);
select is(
  (
    select actor_profile_id from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000012' and event = 'profile_reactivated'
  ),
  'd0000000-0000-0000-0000-000000000012'::uuid,
  '본인 재활성화 감사의 행위자가 본인 자신이다(auth.uid() 기준)'
);

-- 주요 실패: dormant가 아닌 대상의 재활성화는 거부된다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000002')$$,
  'LB011',
  null,
  'active 대상의 재활성화는 LB011으로 거부된다'
);
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000013')$$,
  'LB011',
  null,
  'pending 대상의 재활성화도 LB011으로 거부된다'
);
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000015')$$,
  'LB011',
  null,
  'rejected 대상의 재활성화도 LB011으로 거부된다'
);
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000016')$$,
  'LB011',
  null,
  'departed 대상의 재활성화도 LB011으로 거부된다'
);
select throws_ok(
  $$select reactivate_worker('99999999-9999-9999-9999-999999999999')$$,
  'LB011',
  null,
  '무프로필 대상의 재활성화도 LB011으로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select reactivate_own_profile()$$,
  'LB011',
  null,
  'active 상태인 본인의 reactivate_own_profile 호출도 LB011으로 거부된다'
);
reset role;

-- 중복 요청: 이미 active인 대상 재호출은 거부되어 멱등하게 수렴한다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000011')$$,
  'LB011',
  null,
  '이미 active인 대상의 재호출은 LB011으로 거부된다'
);
reset role;

select is(
  (
    select count(*)::int from identity_audit_logs
    where target_profile_id = 'd0000000-0000-0000-0000-000000000011' and event = 'profile_reactivated'
  ),
  1,
  '거부된 재호출은 감사 행을 중복시키지 않는다'
);

-- 권한: 비관리자·anon·타인의 직접 호출은 거부된다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000010')$$,
  '42501',
  null,
  '일반 근무자(admin 아님)의 reactivate_worker 호출은 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select reactivate_worker('d0000000-0000-0000-0000-000000000010')$$,
  '42501',
  null,
  'anon의 reactivate_worker 호출은 거부된다'
);
select throws_ok(
  $$select reactivate_own_profile()$$,
  '42501',
  null,
  'anon의 reactivate_own_profile 호출은 거부된다'
);
reset role;

-- =====================================================================
-- AC6 구조적 차단: dormant 주체는 기존 업무 함수도 호출할 수 없다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000010', true);
select throws_ok(
  $$select set_hourly_wage('d0000000-0000-0000-0000-000000000010', 12000)$$,
  '42501',
  null,
  'dormant 본인의 set_hourly_wage 호출은 거부된다'
);
select throws_ok(
  $$select update_own_phone('01069991234')$$,
  '42501',
  null,
  'dormant 본인의 update_own_phone 호출도 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000017', true);
select throws_ok(
  $$select approve_signup('d0000000-0000-0000-0000-000000000013')$$,
  '42501',
  null,
  'admin 역할이 부여됐어도 dormant 상태면 approve_signup 호출이 거부된다(effective_roles 구조 차단)'
);
select throws_ok(
  $$select grant_position_eligibility(
    'd0000000-0000-0000-0000-000000000002', (select id from positions where name = '스캔')
  )$$,
  '42501',
  null,
  'admin 역할이 부여됐어도 dormant 상태면 grant_position_eligibility 호출도 거부된다'
);
reset role;

select is(
  (select status from profiles where id = 'd0000000-0000-0000-0000-000000000013'),
  'pending'::profile_status,
  '거부된 승인 시도는 대상 상태를 바꾸지 않는다'
);

select * from finish();
rollback;
