begin;
select plan(58);

-- =====================================================================
-- 함수 시그니처
-- =====================================================================

select has_function(
  'public', 'close_due_recruitment_schedules', array[]::text[],
  'close_due_recruitment_schedules() exists'
);
select has_function(
  'public', 'extend_recruitment_deadline', array['uuid', 'date'],
  'extend_recruitment_deadline(uuid, date) exists'
);
select has_function(
  'public', 'reopen_recruitment_schedule', array['uuid', 'date'],
  'reopen_recruitment_schedule(uuid, date) exists'
);

-- =====================================================================
-- 픽스처: 관리자·활성 근무자 2명
-- =====================================================================

insert into auth.users (id, email) values
  ('15000000-0000-0000-0000-000000000001', 'closing-admin@labiebelle.test'),
  ('15000000-0000-0000-0000-000000000002', 'closing-worker-a@labiebelle.test'),
  ('15000000-0000-0000-0000-000000000003', 'closing-worker-b@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('15000000-0000-0000-0000-000000000001', '마감관리자', '01050000001', 'male', '1985-01-01', 'active', now()),
  ('15000000-0000-0000-0000-000000000002', '근무자에이', '01050000002', 'female', '1990-02-02', 'active', now()),
  ('15000000-0000-0000-0000-000000000003', '근무자비', '01050000003', 'male', '1991-03-03', 'active', now());

insert into public.profile_roles (profile_id, role, granted_by) values
  ('15000000-0000-0000-0000-000000000001', 'admin', null);

-- =====================================================================
-- AC2 노출: 함수 실행 권한과 cron 등록
-- =====================================================================

select ok(
  not has_function_privilege('authenticated', 'close_due_recruitment_schedules()', 'execute'),
  'AC2: authenticated는 close_due_recruitment_schedules 실행 권한이 없다'
);
select ok(
  not has_function_privilege('anon', 'close_due_recruitment_schedules()', 'execute'),
  'AC2: anon은 close_due_recruitment_schedules 실행 권한이 없다'
);
select ok(
  has_function_privilege('service_role', 'close_due_recruitment_schedules()', 'execute'),
  'AC2: service_role은 close_due_recruitment_schedules 실행 권한을 유지한다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select close_due_recruitment_schedules()$$,
  '42501',
  null,
  'AC2: 관리자를 포함한 authenticated 주체의 직접 호출도 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select close_due_recruitment_schedules()$$,
  '42501',
  null,
  'AC2: anon의 직접 호출은 42501로 거부된다'
);
reset role;

select ok(
  exists (select 1 from cron.job where jobname = 'close-due-recruitments'),
  'AC2: close-due-recruitments cron 작업이 등록되어 있다'
);

-- =====================================================================
-- AC1 자동 마감: happy path·경계값·반환값·감사
-- =====================================================================

insert into schedules (work_date, application_deadline) values
  ('2099-06-05', '2099-06-05'),
  ('2099-06-06', '2099-06-06'),
  ('2099-06-10', '2099-06-10');

update schedules set application_deadline = (now() at time zone 'Asia/Seoul')::date - 1
where work_date in ('2099-06-05', '2099-06-06');

update schedules set application_deadline = (now() at time zone 'Asia/Seoul')::date
where work_date = '2099-06-10';

select is(
  close_due_recruitment_schedules(),
  '{"closed_count": 2}'::jsonb,
  'AC1 happy path: 마감일이 지난 2건만 반환값 closed_count 2로 마감된다'
);

select is(
  (select status from schedules where work_date = '2099-06-05'),
  'CLOSED'::schedule_status,
  'AC1: 2099-06-05 스케줄이 CLOSED로 전환됐다'
);
select is(
  (select status from schedules where work_date = '2099-06-06'),
  'CLOSED'::schedule_status,
  'AC1: 2099-06-06 스케줄이 CLOSED로 전환됐다'
);
select is(
  (select status from schedules where work_date = '2099-06-10'),
  'OPEN'::schedule_status,
  'AC1 경계값: 마감일이 KST 오늘인 2099-06-10 스케줄은 대상이 아니라 OPEN을 유지한다'
);

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'schedule_closed'
      and schedule_id = (select id from schedules where work_date = '2099-06-05')
  ),
  1,
  'AC1: 2099-06-05 스케줄에 schedule_closed 감사가 정확히 1행 남는다'
);
select is(
  (
    select actor_profile_id from scheduling_audit_logs
    where event = 'schedule_closed'
      and schedule_id = (select id from schedules where work_date = '2099-06-05')
  ),
  null,
  'AC1: 자동 마감 감사의 actor_profile_id는 시스템 실행을 뜻하는 null이다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'schedule_closed'
      and schedule_id = (select id from schedules where work_date = '2099-06-05')
  ),
  '{"trigger": "cron"}'::jsonb,
  'AC1: 자동 마감 감사 detail이 실행 경로를 담고 PII가 없다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'schedule_closed'
      and schedule_id = (select id from schedules where work_date = '2099-06-06')
  ),
  1,
  'AC1: 2099-06-06 스케줄에도 schedule_closed 감사가 정확히 1행 남는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-06-10')
  ),
  0,
  'AC1 경계값: 대상이 아닌 2099-06-10 스케줄은 감사 행이 없다'
);

-- =====================================================================
-- AC1 대상 없음·멱등: 재실행은 0 반환, 상태·감사 무변화
-- =====================================================================

select is(
  close_due_recruitment_schedules(),
  '{"closed_count": 0}'::jsonb,
  'AC1 대상 없음·멱등: 재실행은 closed_count 0을 반환한다'
);
select is(
  (select status from schedules where work_date = '2099-06-05'),
  'CLOSED'::schedule_status,
  'AC1 멱등: 재실행 후에도 2099-06-05 상태는 CLOSED로 무변화다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-06-05')
  ),
  1,
  'AC1 멱등: 재실행은 2099-06-05 감사 행을 추가하지 않는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-06-06')
  ),
  1,
  'AC1 멱등: 재실행은 2099-06-06 감사 행을 추가하지 않는다'
);

-- =====================================================================
-- AC3 연장: happy path
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-07-10', '2099-07-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-07-10'), '2099-07-05'::date
  )$$,
  'AC3 happy path: admin의 연장 호출이 성공한다'
);
reset role;

select is(
  (select application_deadline from schedules where work_date = '2099-07-10'),
  '2099-07-05'::date,
  'AC3: 2099-07-10 스케줄의 마감일이 새 값으로 반영됐다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'deadline_extended'
      and schedule_id = (select id from schedules where work_date = '2099-07-10')
  ),
  1,
  'AC3: 연장 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'deadline_extended'
      and schedule_id = (select id from schedules where work_date = '2099-07-10')
  ),
  '{"previous_deadline": "2099-07-01", "new_deadline": "2099-07-05"}'::jsonb,
  'AC3: 연장 감사 detail이 이전·새 마감일만 담는다'
);
select is(
  (
    select actor_profile_id from scheduling_audit_logs
    where event = 'deadline_extended'
      and schedule_id = (select id from schedules where work_date = '2099-07-10')
  ),
  '15000000-0000-0000-0000-000000000001',
  'AC3: 연장 감사의 actor_profile_id가 호출 관리자다'
);

-- =====================================================================
-- AC3 연장: 상태·권한·입력 거부
-- =====================================================================

insert into schedules (work_date, application_deadline, status) values ('2099-07-15', '2099-07-15', 'CLOSED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-07-15'), '2099-07-10'::date
  )$$,
  '22023',
  null,
  'AC3: CLOSED 스케줄의 연장은 22023으로 거부된다'
);
select throws_ok(
  $$select extend_recruitment_deadline(
    '00000000-0000-0000-0000-000000000099'::uuid, '2099-07-10'::date
  )$$,
  '22023',
  null,
  'AC3: 존재하지 않는 스케줄의 연장은 22023으로 거부된다'
);
reset role;

insert into schedules (work_date, application_deadline) values ('2099-07-20', '2099-07-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-07-20'), '2099-07-10'::date
  )$$,
  '42501',
  null,
  'AC3: 비관리자(active 근무자)의 연장은 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-07-20'), '2099-07-10'::date
  )$$,
  '42501',
  null,
  'AC3: anon의 연장은 42501로 거부된다'
);
reset role;

select is(
  (select application_deadline from schedules where work_date = '2099-07-20'),
  '2099-07-01'::date,
  'AC3: 거부된 호출들은 2099-07-20 마감일을 바꾸지 못했다'
);

-- =====================================================================
-- AC3 연장: 날짜 안전선(LB021·23514)
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-07-25', '2099-07-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-07-25'),
    ((now() at time zone 'Asia/Seoul')::date - 1)
  )$$,
  'LB021',
  null,
  'AC3 안전선: 과거 새 마감일은 LB021로 거부된다'
);
reset role;

insert into schedules (work_date, application_deadline) values ('2099-07-31', '2099-07-01');
update schedules
  set work_date = (now() at time zone 'Asia/Seoul')::date - 1,
      application_deadline = (now() at time zone 'Asia/Seoul')::date - 2
where work_date = '2099-07-31';

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where application_deadline = (now() at time zone 'Asia/Seoul')::date - 2),
    (now() at time zone 'Asia/Seoul')::date
  )$$,
  'LB021',
  null,
  'AC3 안전선: 근무일이 이미 지난 스케줄은 새 마감일이 오늘이어도 LB021로 거부된다'
);
reset role;

insert into schedules (work_date, application_deadline) values ('2099-08-05', '2099-08-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-08-05'), '2099-08-10'::date
  )$$,
  '23514',
  null,
  'AC3 안전선: 마감일이 근무일보다 늦으면 23514로 거부된다'
);
reset role;

-- =====================================================================
-- AC3 연장: 경계값 허용(오늘·근무일 당일)과 재연장
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-08-15', '2099-08-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-08-15'),
    (now() at time zone 'Asia/Seoul')::date
  )$$,
  'AC3 경계값: 새 마감일이 KST 오늘인 연장은 허용된다'
);
select lives_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-08-15'), '2099-08-15'::date
  )$$,
  'AC3 경계값: 새 마감일이 근무일 당일인 연장은 허용된다'
);
select lives_ok(
  $$select extend_recruitment_deadline(
    (select id from schedules where work_date = '2099-08-15'), '2099-08-15'::date
  )$$,
  'AC3 재연장: 같은 마감일로 다시 연장해도 무해하게 통과한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'deadline_extended'
      and schedule_id = (select id from schedules where work_date = '2099-08-15')
  ),
  3,
  'AC3: 경계값 연장 2회와 재연장 1회로 감사가 누적 3행 남는다(멱등이 아니라 매 호출마다 기록)'
);

-- =====================================================================
-- AC4 재오픈: happy path·신청 유지·재신청 허용
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-09-05', '2099-09-01');

insert into applications (schedule_id, profile_id, status)
select id, '15000000-0000-0000-0000-000000000002', 'applied'
from schedules where work_date = '2099-09-05';

update schedules set status = 'CLOSED' where work_date = '2099-09-05';

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-09-05'), '2099-09-03'::date
  )$$,
  'AC4 happy path: admin의 재오픈 호출이 성공한다'
);
reset role;

select is(
  (select status from schedules where work_date = '2099-09-05'),
  'OPEN'::schedule_status,
  'AC4: 2099-09-05 스케줄이 OPEN으로 전환됐다'
);
select is(
  (select application_deadline from schedules where work_date = '2099-09-05'),
  '2099-09-03'::date,
  'AC4: 2099-09-05 스케줄의 마감일이 새 값으로 반영됐다'
);
select is(
  (
    select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-09-05')
      and profile_id = '15000000-0000-0000-0000-000000000002'
  ),
  'applied'::application_status,
  'AC4: 재오픈 전 존재하던 applied 신청이 그대로 유지된다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'schedule_reopened'
      and schedule_id = (select id from schedules where work_date = '2099-09-05')
  ),
  1,
  'AC4: 재오픈 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'schedule_reopened'
      and schedule_id = (select id from schedules where work_date = '2099-09-05')
  ),
  '{"new_deadline": "2099-09-03"}'::jsonb,
  'AC4: 재오픈 감사 detail이 새 마감일만 담는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000003', true);
select is(
  apply_recruitment_changes(
    array(select id from schedules where work_date = '2099-09-05'), array[]::uuid[]
  ),
  '{"applied_count": 1, "withdrawn_count": 0, "blocked_dates": []}'::jsonb,
  'AC4: 재오픈된 스케줄에 다른 근무자의 새 신청이 T03 함수로 허용된다'
);
reset role;

-- =====================================================================
-- AC4 재오픈: 상태·권한·입력 거부
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-09-10', '2099-09-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-09-10'), '2099-09-05'::date
  )$$,
  '22023',
  null,
  'AC4: OPEN 스케줄의 재오픈은 22023으로 거부된다'
);
select throws_ok(
  $$select reopen_recruitment_schedule(
    '00000000-0000-0000-0000-000000000098'::uuid, '2099-09-05'::date
  )$$,
  '22023',
  null,
  'AC4: 존재하지 않는 스케줄의 재오픈은 22023으로 거부된다'
);
reset role;

insert into schedules (work_date, application_deadline, status) values ('2099-09-15', '2099-09-15', 'CLOSED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-09-15'), '2099-09-10'::date
  )$$,
  '42501',
  null,
  'AC4: 비관리자(active 근무자)의 재오픈은 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-09-15'), '2099-09-10'::date
  )$$,
  '42501',
  null,
  'AC4: anon의 재오픈은 42501로 거부된다'
);
reset role;

select is(
  (select status from schedules where work_date = '2099-09-15'),
  'CLOSED'::schedule_status,
  'AC4: 거부된 호출들은 2099-09-15 상태를 바꾸지 못했다'
);

-- =====================================================================
-- AC4 재오픈: 날짜 안전선(LB021·23514)
-- =====================================================================

insert into schedules (work_date, application_deadline, status) values ('2099-09-20', '2099-09-20', 'CLOSED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-09-20'),
    ((now() at time zone 'Asia/Seoul')::date - 1)
  )$$,
  'LB021',
  null,
  'AC4 안전선: 과거 새 마감일은 LB021로 거부된다'
);
reset role;

insert into schedules (work_date, application_deadline) values ('2099-09-21', '2099-09-01');
update schedules
  set work_date = (now() at time zone 'Asia/Seoul')::date - 3,
      application_deadline = (now() at time zone 'Asia/Seoul')::date - 4,
      status = 'CLOSED'
where work_date = '2099-09-21';

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where application_deadline = (now() at time zone 'Asia/Seoul')::date - 4),
    (now() at time zone 'Asia/Seoul')::date
  )$$,
  'LB021',
  null,
  'AC4 안전선: 근무일이 이미 지난 스케줄은 새 마감일이 오늘이어도 LB021로 거부된다'
);
reset role;

insert into schedules (work_date, application_deadline, status) values ('2099-09-25', '2099-09-25', 'CLOSED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-09-25'), '2099-09-30'::date
  )$$,
  '23514',
  null,
  'AC4 안전선: 마감일이 근무일보다 늦으면 23514로 거부된다'
);
reset role;

-- =====================================================================
-- AC4 재오픈: 경계값 허용(근무일 당일)과 중복 요청
-- =====================================================================

insert into schedules (work_date, application_deadline, status) values ('2099-10-05', '2099-10-05', 'CLOSED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-10-05'), '2099-10-05'::date
  )$$,
  'AC4 경계값: 새 마감일이 근무일 당일인 재오픈은 허용된다'
);
reset role;

select is(
  (select application_deadline from schedules where work_date = '2099-10-05'),
  '2099-10-05'::date,
  'AC4: 경계값 재오픈의 마감일이 근무일과 같은 값으로 반영됐다'
);

insert into schedules (work_date, application_deadline, status) values ('2099-10-10', '2099-10-10', 'CLOSED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-10-10'), '2099-10-08'::date
  )$$,
  'AC4 중복 요청: 첫 재오픈 호출은 성공한다'
);
select throws_ok(
  $$select reopen_recruitment_schedule(
    (select id from schedules where work_date = '2099-10-10'), '2099-10-08'::date
  )$$,
  '22023',
  null,
  'AC4 중복 요청: 이미 OPEN인 대상의 재요청은 22023으로 수렴한다'
);
reset role;

select * from finish();
rollback;
