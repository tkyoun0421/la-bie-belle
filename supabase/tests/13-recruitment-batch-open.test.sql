begin;
select plan(32);

-- =====================================================================
-- 함수 시그니처
-- =====================================================================

select has_function(
  'public', 'open_recruitment_schedules', array['date[]', 'date'],
  'open_recruitment_schedules(date[], date) exists'
);

-- =====================================================================
-- 픽스처: 관리자·활성 근무자·대기 주체
-- =====================================================================

insert into auth.users (id, email) values
  ('13000000-0000-0000-0000-000000000001', 'batch-admin@labiebelle.test'),
  ('13000000-0000-0000-0000-000000000002', 'batch-worker@labiebelle.test'),
  ('13000000-0000-0000-0000-000000000003', 'batch-pending@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('13000000-0000-0000-0000-000000000001', '모집관리자', '01060000001', 'male', '1985-01-01', 'active', now()),
  ('13000000-0000-0000-0000-000000000002', '근무자에이', '01060000002', 'female', '1990-02-02', 'active', now()),
  ('13000000-0000-0000-0000-000000000003', '대기주체', '01060000003', 'male', '1991-03-03', 'pending', null);

insert into public.profile_roles (profile_id, role, granted_by) values
  ('13000000-0000-0000-0000-000000000001', 'admin', null);

-- =====================================================================
-- AC1 happy path: N개 생성·반환값·행 존재
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select is(
  open_recruitment_schedules(
    array['2099-09-01', '2099-09-02']::date[], '2099-09-01'::date
  ),
  '{"created_count": 2, "conflict_dates": []}'::jsonb,
  'AC1 happy path: 2개 생성 시 반환값이 created_count 2·conflict_dates 빈 배열이다'
);
reset role;

select is(
  (select status from schedules where work_date = '2099-09-01'),
  'OPEN'::schedule_status,
  'AC1: 2099-09-01 스케줄이 OPEN 상태로 생성됐다'
);
select is(
  (select application_deadline from schedules where work_date = '2099-09-01'),
  '2099-09-01'::date,
  'AC1: 2099-09-01 스케줄의 마감일이 요청값과 같다'
);
select is(
  (select status from schedules where work_date = '2099-09-02'),
  'OPEN'::schedule_status,
  'AC1: 2099-09-02 스케줄이 OPEN 상태로 생성됐다'
);

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'schedule_opened' and schedule_id = (select id from schedules where work_date = '2099-09-01')
  ),
  1,
  'AC3: 2099-09-01 스케줄에 감사 행이 정확히 1개 남는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'schedule_opened' and schedule_id = (select id from schedules where work_date = '2099-09-02')
  ),
  1,
  'AC3: 2099-09-02 스케줄에 감사 행이 정확히 1개 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'schedule_opened' and schedule_id = (select id from schedules where work_date = '2099-09-01')
  ),
  '{"batch_size": 2}'::jsonb,
  'AC3: 감사 detail이 batch_size 2만 담고 PII가 없다'
);
select is(
  (
    select actor_profile_id from scheduling_audit_logs
    where event = 'schedule_opened' and schedule_id = (select id from schedules where work_date = '2099-09-02')
  ),
  '13000000-0000-0000-0000-000000000001',
  'AC3: 감사 행의 actor_profile_id가 호출 관리자다'
);

-- =====================================================================
-- AC1 경계값: 입력 중복 제거
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select is(
  open_recruitment_schedules(
    array['2099-09-10', '2099-09-10', '2099-09-11']::date[], '2099-09-10'::date
  ),
  '{"created_count": 2, "conflict_dates": []}'::jsonb,
  'AC1 경계값: 입력 중복 날짜는 정리되어 distinct 개수만 생성된다'
);
reset role;

select is(
  (select count(*)::int from schedules where work_date = '2099-09-10'),
  1,
  'AC1: 중복 입력에도 2099-09-10 스케줄은 1행만 생성된다'
);

-- =====================================================================
-- AC1 경계값: CANCELLED만 있는 날짜는 생성 허용
-- =====================================================================

insert into schedules (work_date, application_deadline, status)
values ('2099-09-20', '2099-09-20', 'CANCELLED');

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select is(
  open_recruitment_schedules(array['2099-09-20']::date[], '2099-09-20'::date),
  '{"created_count": 1, "conflict_dates": []}'::jsonb,
  'AC1 경계값: CANCELLED뿐인 날짜는 새 배치 생성이 허용된다'
);
reset role;

select is(
  (select count(*)::int from schedules where work_date = '2099-09-20'),
  2,
  'AC1: CANCELLED 1행과 새 OPEN 1행이 공존한다'
);

-- =====================================================================
-- AC1 실패: 활성 모집 충돌은 전체 미생성 + 충돌 목록 반환
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-09-30', '2099-09-30');

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select is(
  open_recruitment_schedules(
    array['2099-09-29', '2099-09-30']::date[], '2099-09-29'::date
  ),
  '{"created_count": 0, "conflict_dates": ["2099-09-30"]}'::jsonb,
  'AC1 충돌: 활성 모집이 있는 날짜가 섞이면 created_count 0과 충돌 목록만 반환한다'
);
reset role;

select ok(
  not exists (select 1 from schedules where work_date = '2099-09-29'),
  'AC1 충돌: 충돌이 없던 2099-09-29도 함께 미생성된다(전체 롤백)'
);
select is(
  (select count(*)::int from scheduling_audit_logs where event = 'schedule_opened'),
  5,
  'AC3: 충돌 반환 경로는 감사 행을 추가로 남기지 않는다(이전까지 누적 5행 유지)'
);

-- =====================================================================
-- AC1 중복 요청: 같은 호출 재실행은 전부 충돌로 수렴
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select is(
  open_recruitment_schedules(
    array['2099-09-01', '2099-09-02']::date[], '2099-09-01'::date
  ),
  '{"created_count": 0, "conflict_dates": ["2099-09-01", "2099-09-02"]}'::jsonb,
  'AC1 중복 요청: 이미 생성된 배치를 재요청하면 전부 충돌로 수렴한다'
);
reset role;

select is(
  (select count(*)::int from scheduling_audit_logs where event = 'schedule_opened'),
  5,
  'AC3: 중복 요청 충돌 경로도 감사 행을 추가하지 않는다'
);

-- =====================================================================
-- AC2 권한: 비관리자 주체는 42501, 재시도도 동일 코드로 수렴
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select open_recruitment_schedules(array['2099-10-01']::date[], '2099-10-01'::date)$$,
  '42501',
  null,
  'AC2: active 근무자의 호출은 42501로 거부된다'
);
select throws_ok(
  $$select open_recruitment_schedules(array['2099-10-01']::date[], '2099-10-01'::date)$$,
  '42501',
  null,
  'AC2: active 근무자의 재시도도 동일하게 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select open_recruitment_schedules(array['2099-10-02']::date[], '2099-10-02'::date)$$,
  '42501',
  null,
  'AC2: pending 주체의 호출은 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select open_recruitment_schedules(array['2099-10-03']::date[], '2099-10-03'::date)$$,
  '42501',
  null,
  'AC2: anon의 호출은 42501로 거부된다'
);
reset role;

select is(
  (select count(*)::int from schedules where work_date in ('2099-10-01', '2099-10-02', '2099-10-03')),
  0,
  'AC2: 거부된 호출들은 어떤 스케줄도 만들지 못했다'
);

-- =====================================================================
-- AC2 입력: 빈 배열·null 원소는 22023
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select open_recruitment_schedules(array[]::date[], '2099-10-10'::date)$$,
  '22023',
  null,
  'AC2: 빈 배열은 22023으로 거부된다'
);
select throws_ok(
  $$select open_recruitment_schedules(null::date[], '2099-10-10'::date)$$,
  '22023',
  null,
  'AC2: null 배열은 22023으로 거부된다'
);
select throws_ok(
  $$select open_recruitment_schedules(array['2099-10-11'::date, null], '2099-10-11'::date)$$,
  '22023',
  null,
  'AC2: null 원소가 섞인 배열은 22023으로 거부된다'
);
reset role;

select is(
  (select count(*)::int from schedules where work_date = '2099-10-11'),
  0,
  'AC2: null 원소가 섞인 요청은 어떤 스케줄도 만들지 못했다'
);

-- =====================================================================
-- AC3 실패 전파: 날짜 규칙 위반은 배치 전체 롤백(스케줄·감사 0행)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select open_recruitment_schedules(
    array['2099-11-01', (now() at time zone 'Asia/Seoul')::date - 1]::date[], '2099-11-01'::date
  )$$,
  'LB021',
  null,
  'AC3: 배치에 과거 근무일이 섞이면 LB021로 배치 전체가 거부된다'
);
reset role;

select ok(
  not exists (select 1 from schedules where work_date = '2099-11-01'),
  'AC3: 과거 근무일 위반 시 유효했던 2099-11-01도 생성되지 않는다(전체 롤백)'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select open_recruitment_schedules(array['2099-11-10']::date[], '2099-11-11'::date)$$,
  '23514',
  null,
  'AC3: 마감일이 근무일보다 늦으면 23514로 거부된다'
);
reset role;

select ok(
  not exists (select 1 from schedules where work_date = '2099-11-10'),
  'AC3: 마감일 위반 시 근무일 스케줄도 생성되지 않는다'
);

select is(
  (select count(*)::int from scheduling_audit_logs where event = 'schedule_opened'),
  5,
  'AC3: 날짜 규칙 위반 롤백들은 감사 행을 하나도 추가하지 않는다(최종 5행)'
);

select * from finish();
rollback;
