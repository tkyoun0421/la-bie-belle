begin;
select plan(40);

-- =====================================================================
-- 함수 시그니처
-- =====================================================================

select has_function(
  'public', 'apply_recruitment_changes', array['uuid[]', 'uuid[]'],
  'apply_recruitment_changes(uuid[], uuid[]) exists'
);

-- =====================================================================
-- 픽스처: 활성 근무자와 비활성 4종
-- =====================================================================

insert into auth.users (id, email) values
  ('14000000-0000-0000-0000-000000000001', 'app-worker@labiebelle.test'),
  ('14000000-0000-0000-0000-000000000002', 'app-pending@labiebelle.test'),
  ('14000000-0000-0000-0000-000000000003', 'app-rejected@labiebelle.test'),
  ('14000000-0000-0000-0000-000000000004', 'app-dormant@labiebelle.test'),
  ('14000000-0000-0000-0000-000000000005', 'app-departed@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('14000000-0000-0000-0000-000000000001', '근무자에이', '01070000001', 'female', '1990-01-01', 'active', now()),
  ('14000000-0000-0000-0000-000000000002', '대기중대상', '01070000002', 'male', '1991-02-02', 'pending', null),
  ('14000000-0000-0000-0000-000000000003', '거절대상', '01070000003', 'female', '1992-03-03', 'rejected', null),
  ('14000000-0000-0000-0000-000000000004', '휴면대상', '01070000004', 'male', '1993-04-04', 'dormant', now() - interval '10 days'),
  ('14000000-0000-0000-0000-000000000005', '탈퇴대상', '01070000005', 'female', '1994-05-05', 'departed', null);

-- =====================================================================
-- 픽스처: 스케줄
-- =====================================================================

insert into schedules (work_date, application_deadline) values
  ('2099-12-01', '2099-12-01'),
  ('2099-12-02', '2099-12-02'),
  ('2099-12-11', '2099-12-11'),
  ('2099-12-15', '2099-12-15'),
  ('2099-12-16', '2099-12-16'),
  ('2099-12-30', '2099-12-30');

insert into schedules (work_date, application_deadline, status) values
  ('2099-12-10', '2099-12-10', 'CLOSED'),
  ('2099-12-25', '2099-12-25', 'CANCELLED');

update schedules set application_deadline = (now() at time zone 'Asia/Seoul')::date - 1
where work_date = '2099-12-15';

update schedules set application_deadline = (now() at time zone 'Asia/Seoul')::date
where work_date = '2099-12-16';

insert into applications (schedule_id, profile_id, status)
select id, '14000000-0000-0000-0000-000000000001', 'applied'
from schedules where work_date = '2099-12-01';

-- =====================================================================
-- AC1 happy path: 신청·철회 혼합 batch
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-02'),
    array(select id from schedules where work_date = '2099-12-01')
  ),
  '{"applied_count": 1, "withdrawn_count": 1, "blocked_dates": []}'::jsonb,
  'AC1 happy path: 신청 1·철회 1 혼합 batch가 원자적으로 반영된다'
);
reset role;

select is(
  (select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and profile_id = '14000000-0000-0000-0000-000000000001'),
  'withdrawn'::application_status,
  'AC1: 2099-12-01 신청이 withdrawn으로 바뀌었다'
);
select is(
  (select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-02')
      and profile_id = '14000000-0000-0000-0000-000000000001'),
  'applied'::application_status,
  'AC1: 2099-12-02 신청이 새로 생성됐다'
);

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'application_applied'
      and schedule_id = (select id from schedules where work_date = '2099-12-02')
  ),
  1,
  'AC3: 2099-12-02 신청 전이 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'application_applied'
      and schedule_id = (select id from schedules where work_date = '2099-12-02')
  ),
  '{"batch_size": 2}'::jsonb,
  'AC3: 신청 감사 detail이 batch_size 2만 담고 PII가 없다'
);
select is(
  (
    select application_id from scheduling_audit_logs
    where event = 'application_applied'
      and schedule_id = (select id from schedules where work_date = '2099-12-02')
  ),
  (select id from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-02')
      and profile_id = '14000000-0000-0000-0000-000000000001'),
  'AC3: 신청 감사의 application_id가 실제 신청 행을 가리킨다'
);
select is(
  (
    select actor_profile_id from scheduling_audit_logs
    where event = 'application_applied'
      and schedule_id = (select id from schedules where work_date = '2099-12-02')
  ),
  '14000000-0000-0000-0000-000000000001',
  'AC3: 신청 감사의 actor_profile_id가 호출 근무자다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'application_withdrawn'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  1,
  'AC3: 2099-12-01 철회 전이 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'application_withdrawn'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  '{"batch_size": 2}'::jsonb,
  'AC3: 철회 감사 detail이 batch_size 2만 담는다'
);

-- =====================================================================
-- AC1 멱등: 같은 batch 재실행은 무변경 통과(감사 0행 추가)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-02'),
    array(select id from schedules where work_date = '2099-12-01')
  ),
  '{"applied_count": 0, "withdrawn_count": 0, "blocked_dates": []}'::jsonb,
  'AC1 멱등: 이미 목표 상태인 항목만 재요청하면 무변경 통과한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-02')
  ),
  1,
  'AC3: 멱등 재실행은 2099-12-02 감사 행을 추가하지 않는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  1,
  'AC3: 멱등 재실행은 2099-12-01 감사 행을 추가하지 않는다'
);

-- =====================================================================
-- AC1 경계값: withdrawn→applied 재신청 허용
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-01'),
    array[]::uuid[]
  ),
  '{"applied_count": 1, "withdrawn_count": 0, "blocked_dates": []}'::jsonb,
  'AC1 경계값: withdrawn 상태였던 2099-12-01 재신청이 허용된다'
);
reset role;

select is(
  (select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and profile_id = '14000000-0000-0000-0000-000000000001'),
  'applied'::application_status,
  'AC1: 2099-12-01 신청이 다시 applied로 바뀌었다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'application_applied'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  1,
  'AC3: 재신청 전이 감사가 추가로 1행 남는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'application_withdrawn'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  1,
  'AC3: 이전 철회 감사 1행은 그대로 유지된다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  2,
  'AC3: 2099-12-01 누적 감사는 철회 1행·신청 1행 총 2행이다'
);

-- =====================================================================
-- AC2 차단: CLOSED 대상이 섞이면 전체 미적용(감사 0행)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date in ('2099-12-10', '2099-12-11')),
    array[]::uuid[]
  ),
  jsonb_build_object(
    'applied_count', 0, 'withdrawn_count', 0, 'blocked_dates', to_jsonb(array['2099-12-10'::date])
  ),
  'AC2 차단: CLOSED 대상이 섞이면 유효했던 날짜도 함께 미적용되고 차단 날짜만 반환된다'
);
reset role;

select ok(
  not exists (
    select 1 from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-11')
  ),
  'AC2: 차단된 batch의 유효 날짜(2099-12-11)도 신청되지 않았다'
);
select ok(
  not exists (
    select 1 from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-10')
  ),
  'AC2: 차단 대상(2099-12-10)도 신청되지 않았다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-11')
  ),
  0,
  'AC3: 차단 경로는 유효 날짜에도 감사 행을 남기지 않는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-10')
  ),
  0,
  'AC3: 차단 경로는 차단 날짜에도 감사 행을 남기지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date in ('2099-12-10', '2099-12-11')),
    array[]::uuid[]
  ),
  jsonb_build_object(
    'applied_count', 0, 'withdrawn_count', 0, 'blocked_dates', to_jsonb(array['2099-12-10'::date])
  ),
  'AC2 중복 요청: 같은 차단 batch를 재시도해도 동일한 반환값으로 수렴한다'
);
reset role;

-- =====================================================================
-- AC2 차단: CANCELLED 대상
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-25'),
    array[]::uuid[]
  ),
  jsonb_build_object(
    'applied_count', 0, 'withdrawn_count', 0, 'blocked_dates', to_jsonb(array['2099-12-25'::date])
  ),
  'AC2 차단: CANCELLED 대상은 차단 날짜로 반환된다'
);
reset role;

-- =====================================================================
-- AC2 경계값: 마감 경과는 차단, 마감 당일(KST)은 허용
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-15'),
    array[]::uuid[]
  ),
  jsonb_build_object(
    'applied_count', 0, 'withdrawn_count', 0, 'blocked_dates', to_jsonb(array['2099-12-15'::date])
  ),
  'AC2 경계값: 마감 시각이 지난 스케줄은 OPEN이어도 차단된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-16'),
    array[]::uuid[]
  ),
  '{"applied_count": 1, "withdrawn_count": 0, "blocked_dates": []}'::jsonb,
  'AC2 경계값: 마감일 당일(KST)까지는 신청이 허용된다'
);
reset role;

-- =====================================================================
-- AC2 입력: 빈 배열·null 배열·null 원소·교집합·존재하지 않는 id
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select apply_recruitment_changes(
    array[(select id from schedules where work_date = '2099-12-30'), null]::uuid[], array[]::uuid[]
  )$$,
  '22023',
  null,
  'AC2: 신청 목록에 null 원소가 섞이면 22023으로 거부된다'
);
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '22023',
  null,
  'AC2: 두 배열이 모두 빈 배열이면 22023으로 거부된다'
);
select throws_ok(
  $$select apply_recruitment_changes(null::uuid[], null::uuid[])$$,
  '22023',
  null,
  'AC2: 두 배열이 모두 null이면 22023으로 거부된다'
);
select throws_ok(
  $$select apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-12-30'),
    array(select id from schedules where work_date = '2099-12-30')
  )$$,
  '22023',
  null,
  'AC2: 같은 스케줄이 신청·철회에 동시에 있으면 22023으로 거부된다'
);
select throws_ok(
  $$select apply_recruitment_changes(
    array['00000000-0000-0000-0000-000000000099'::uuid], array[]::uuid[]
  )$$,
  '22023',
  null,
  'AC2: 존재하지 않는 스케줄 id는 22023으로 거부된다'
);
select throws_ok(
  $$select apply_recruitment_changes(
    array[
      (select id from schedules where work_date = '2099-12-30'),
      '00000000-0000-0000-0000-000000000099'::uuid
    ], array[]::uuid[]
  )$$,
  '22023',
  null,
  'AC2: 유효한 id와 존재하지 않는 id가 섞이면 전체가 22023으로 거부된다'
);
reset role;

select ok(
  not exists (
    select 1 from applications
    where schedule_id = (select id from schedules where work_date = '2099-12-30')
  ),
  'AC2: 검증 실패 batch에 섞였던 유효 날짜(2099-12-30)도 신청되지 않았다'
);

-- =====================================================================
-- AC2 권한: 비활성 4종·anon은 42501, 재시도도 동일 코드로 수렴
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '42501',
  null,
  'AC2: pending 주체의 호출은 42501로 거부된다'
);
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '42501',
  null,
  'AC2: pending 주체의 재시도도 동일하게 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '42501',
  null,
  'AC2: rejected 주체의 호출은 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000004', true);
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '42501',
  null,
  'AC2: dormant 주체의 호출은 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000005', true);
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '42501',
  null,
  'AC2: departed 주체의 호출은 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select apply_recruitment_changes(array[]::uuid[], array[]::uuid[])$$,
  '42501',
  null,
  'AC2: anon의 호출은 42501로 거부된다'
);
reset role;

select * from finish();
rollback;
