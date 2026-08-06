begin;
select plan(46);

select has_function('public', 'approve_signup', array['uuid'], 'approve_signup(uuid) exists');
select has_function(
  'public', 'reject_signup', array['uuid', 'text'], 'reject_signup(uuid, text) exists'
);

select ok(
  pg_get_functiondef('approve_signup(uuid)'::regprocedure) ~* 'for update',
  'approve_signup locks the target row before checking its state'
);
select ok(
  pg_get_functiondef('reject_signup(uuid, text)'::regprocedure) ~* 'for update',
  'reject_signup locks the target row before checking its state'
);

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-000000000001', 'approval-admin@labiebelle.test'),
  ('c0000000-0000-0000-0000-000000000002', 'approval-nonadmin@labiebelle.test'),
  ('c0000000-0000-0000-0000-000000000010', 'approval-target-approve@labiebelle.test'),
  ('c0000000-0000-0000-0000-000000000011', 'approval-target-reject-reason@labiebelle.test'),
  ('c0000000-0000-0000-0000-000000000012', 'approval-target-reject-omit@labiebelle.test'),
  ('c0000000-0000-0000-0000-000000000013', 'approval-target-reject-blank@labiebelle.test'),
  ('c0000000-0000-0000-0000-000000000014', 'approval-target-permission-probe@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status) values
  ('c0000000-0000-0000-0000-000000000001', '승인자', '01080000001', 'male', '1990-01-01', 'active'),
  ('c0000000-0000-0000-0000-000000000002', '일반근무자', '01080000002', 'male', '1990-01-01', 'active'),
  ('c0000000-0000-0000-0000-000000000010', '승인대상', '01080000010', 'male', '1990-01-01', 'pending'),
  ('c0000000-0000-0000-0000-000000000011', '거절대상사유', '01080000011', 'female', '1991-02-02', 'pending'),
  ('c0000000-0000-0000-0000-000000000012', '거절대상생략', '01080000012', 'male', '1992-03-03', 'pending'),
  ('c0000000-0000-0000-0000-000000000013', '거절대상공백', '01080000013', 'female', '1993-04-04', 'pending'),
  ('c0000000-0000-0000-0000-000000000014', '권한확인대상', '01080000014', 'male', '1994-05-05', 'pending');

insert into public.profile_roles (profile_id, role, granted_by) values
  ('c0000000-0000-0000-0000-000000000001', 'admin', null);

-- 권한: 비관리자·anon은 서버·DB 양쪽에서 거부된다(AC1)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select approve_signup('c0000000-0000-0000-0000-000000000014')$$,
  '42501',
  null,
  '일반 근무자(admin 아님)의 approve_signup 호출은 거부된다'
);
select throws_ok(
  $$select reject_signup('c0000000-0000-0000-0000-000000000014')$$,
  '42501',
  null,
  '일반 근무자(admin 아님)의 reject_signup 호출은 거부된다'
);
reset role;

set local role anon;
select throws_ok(
  $$select approve_signup('c0000000-0000-0000-0000-000000000014')$$,
  '42501',
  null,
  'anon의 approve_signup 호출은 거부된다'
);
reset role;

select is(
  (select status from profiles where id = 'c0000000-0000-0000-0000-000000000014'),
  'pending'::profile_status,
  '거부된 처리 시도는 대상 상태를 바꾸지 않는다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000014'),
  0,
  '거부된 처리 시도는 감사 기록을 남기지 않는다'
);

-- 승인 happy path(AC2)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select approve_signup('c0000000-0000-0000-0000-000000000010')$$,
  '관리자는 pending 대상을 승인할 수 있다'
);
reset role;

select is(
  (select status from profiles where id = 'c0000000-0000-0000-0000-000000000010'),
  'active'::profile_status,
  '승인 후 대상 상태가 active로 바뀐다'
);
select is(
  (select name from profiles where id = 'c0000000-0000-0000-0000-000000000010'),
  '승인대상',
  '승인은 name을 바꾸지 않는다'
);
select is(
  (select phone from profiles where id = 'c0000000-0000-0000-0000-000000000010'),
  '01080000010',
  '승인은 phone을 바꾸지 않는다'
);
select is(
  (select gender from profiles where id = 'c0000000-0000-0000-0000-000000000010'),
  'male'::gender,
  '승인은 gender를 바꾸지 않는다'
);
select is(
  (select birth_date from profiles where id = 'c0000000-0000-0000-0000-000000000010'),
  '1990-01-01'::date,
  '승인은 birth_date를 바꾸지 않는다'
);
select is(
  (select count(*)::int from profile_roles where profile_id = 'c0000000-0000-0000-0000-000000000010'),
  0,
  '승인은 기본 포지션·역할 부여 행을 만들지 않는다(파생만 존재)'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000010'),
  1,
  '승인 이벤트가 감사 기록에 정확히 하나 남는다'
);
select is(
  (select event from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000010'),
  'signup_approved',
  '승인 감사 기록의 이벤트가 signup_approved다'
);
select is(
  (select actor_profile_id from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000010'),
  'c0000000-0000-0000-0000-000000000001'::uuid,
  '승인 감사 기록의 처리자가 승인을 실행한 관리자다'
);
select is(
  (select detail from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000010'),
  '{}'::jsonb,
  '승인 감사 기록의 detail은 빈 객체다'
);

-- 재처리 거부(AC4·AC5: 후행 요청은 잠금 해제 후 pending 아님을 보고 거부)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select approve_signup('c0000000-0000-0000-0000-000000000010')$$,
  '22023',
  null,
  '이미 승인된 대상의 재승인은 이미 처리됨으로 거부된다'
);
select throws_ok(
  $$select reject_signup('c0000000-0000-0000-0000-000000000010')$$,
  '22023',
  null,
  '이미 승인된 대상의 뒤늦은 거절 시도도 이미 처리됨으로 거부된다'
);
reset role;

select is(
  (select status from profiles where id = 'c0000000-0000-0000-0000-000000000010'),
  'active'::profile_status,
  '거부된 재처리 시도는 상태를 바꾸지 않는다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000010'),
  1,
  '거부된 재처리 시도는 감사 기록을 중복 생성하지 않는다'
);

-- 거절 happy path(AC3) + 사유 저장
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select reject_signup('c0000000-0000-0000-0000-000000000011', '  부적절한 서류  ')$$,
  '관리자는 사유와 함께 pending 대상을 거절할 수 있다'
);
reset role;

select is(
  (select status from profiles where id = 'c0000000-0000-0000-0000-000000000011'),
  'rejected'::profile_status,
  '거절 후 대상 상태가 rejected로 바뀐다'
);
select is(
  (select name from profiles where id = 'c0000000-0000-0000-0000-000000000011'),
  '거절대상사유',
  '거절도 name을 바꾸지 않는다'
);
select is(
  (select phone from profiles where id = 'c0000000-0000-0000-0000-000000000011'),
  '01080000011',
  '거절도 phone을 바꾸지 않는다'
);
select is(
  (select gender from profiles where id = 'c0000000-0000-0000-0000-000000000011'),
  'female'::gender,
  '거절도 gender를 바꾸지 않는다'
);
select is(
  (select birth_date from profiles where id = 'c0000000-0000-0000-0000-000000000011'),
  '1991-02-02'::date,
  '거절도 birth_date를 바꾸지 않는다'
);
select is(
  (select event from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000011'),
  'signup_rejected',
  '거절 감사 기록의 이벤트가 signup_rejected다'
);
select is(
  (select actor_profile_id from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000011'),
  'c0000000-0000-0000-0000-000000000001'::uuid,
  '거절 감사 기록의 처리자가 거절을 실행한 관리자다'
);
select is(
  (select detail from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000011'),
  jsonb_build_object('reason', '부적절한 서류'),
  '거절 감사 기록에 앞뒤 공백이 잘린 사유가 담긴다'
);

-- 재거절·역방향(이미 거절된 대상 승인) 거부
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reject_signup('c0000000-0000-0000-0000-000000000011', '두 번째 사유')$$,
  '22023',
  null,
  '이미 거절된 대상의 재거절은 이미 처리됨으로 거부된다'
);
select throws_ok(
  $$select approve_signup('c0000000-0000-0000-0000-000000000011')$$,
  '22023',
  null,
  '이미 거절된 대상의 뒤늦은 승인 시도도 이미 처리됨으로 거부된다'
);
reset role;

select is(
  (select status from profiles where id = 'c0000000-0000-0000-0000-000000000011'),
  'rejected'::profile_status,
  '거부된 재처리 시도는 rejected 상태를 유지한다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000011'),
  1,
  '거부된 재처리 시도는 감사 기록을 중복 생성하지 않는다'
);

-- 사유 생략(인자 미전달)·공백만(빈 사유)은 감사 detail에 사유가 남지 않는다
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select reject_signup('c0000000-0000-0000-0000-000000000012')$$,
  '사유 인자를 생략해도 거절할 수 있다(선택 입력)'
);
select lives_ok(
  $$select reject_signup('c0000000-0000-0000-0000-000000000013', '   ')$$,
  '공백만 있는 사유도 거절을 막지 않는다'
);
reset role;

select is(
  (select detail from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000012'),
  '{}'::jsonb,
  '사유 생략 거절의 감사 detail에는 reason 키가 없다'
);
select is(
  (select detail from identity_audit_logs where target_profile_id = 'c0000000-0000-0000-0000-000000000013'),
  '{}'::jsonb,
  '공백만 있는 사유도 정규화되어 감사 detail에 reason 키가 없다'
);

-- 무프로필 대상(존재하지 않는 uuid) 처리 거부
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select approve_signup('99999999-9999-9999-9999-999999999999')$$,
  '22023',
  null,
  '무프로필 대상의 승인 시도는 이미 처리됨과 같은 코드로 거부된다'
);
select throws_ok(
  $$select reject_signup('99999999-9999-9999-9999-999999999999')$$,
  '22023',
  null,
  '무프로필 대상의 거절 시도도 같은 코드로 거부된다'
);
reset role;

select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = '99999999-9999-9999-9999-999999999999'),
  0,
  '무프로필 대상 처리 거부는 감사 기록을 남기지 않는다'
);

-- profiles_select_admin은 status와 무관하게 admin에게 pending 행도 보여준다(AC1)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
select isnt(
  (select count(*)::int from profiles where status = 'pending'),
  0,
  '관리자는 profiles_select_admin 정책으로 pending 프로필도 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000002', true);
select is(
  (select count(*)::int from profiles where status = 'pending'),
  0,
  '관리자가 아닌 근무자는 다른 사람의 pending 프로필을 볼 수 없다'
);
reset role;

select * from finish();
rollback;
