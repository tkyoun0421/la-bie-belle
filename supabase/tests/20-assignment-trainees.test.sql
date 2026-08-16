begin;
select plan(64);

-- =====================================================================
-- 스키마 노출: assignment_trainees 테이블·컬럼·제약·RLS
-- =====================================================================

select has_table('public', 'assignment_trainees', 'assignment_trainees table');
select col_not_null('public', 'assignment_trainees', 'schedule_id', 'assignment_trainees.schedule_id not null');
select col_not_null('public', 'assignment_trainees', 'position_id', 'assignment_trainees.position_id not null');
select col_not_null('public', 'assignment_trainees', 'profile_id', 'assignment_trainees.profile_id not null');
select col_is_fk('public', 'assignment_trainees', 'schedule_id', 'assignment_trainees.schedule_id fk');
select col_is_fk('public', 'assignment_trainees', 'position_id', 'assignment_trainees.position_id fk');
select col_is_fk('public', 'assignment_trainees', 'profile_id', 'assignment_trainees.profile_id fk');
select col_is_unique(
  'public', 'assignment_trainees', array['schedule_id', 'profile_id'],
  'assignment_trainees unique(schedule_id, profile_id) — 한 스케줄에 교육생 자리는 하나'
);
select is(
  (
    select confdeltype from pg_constraint
    where conrelid = 'assignment_trainees'::regclass
      and confrelid = 'positions'::regclass
  ),
  'r',
  'assignment_trainees.position_id fk는 on delete restrict다'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.assignment_trainees'::regclass),
  'assignment_trainees has row level security enabled'
);
select is(
  (
    select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'assignment_trainees'
  ),
  1,
  'assignment_trainees has exactly one policy(select 전용, 쓰기는 DEFINER 함수로만)'
);

-- =====================================================================
-- 픽스처: 관리자·근무자 12명, 스케줄 1종
-- =====================================================================

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-000000000001', 'trn-admin@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000002', 'trn-f1@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000003', 'trn-m1@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000004', 'trn-pending@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000005', 'trn-f2@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000006', 'trn-f3@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000007', 'trn-f4@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000008', 'trn-f5@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000009', 'trn-f6@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000010', 'trn-f7@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000011', 'trn-f8@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000012', 'trn-f9@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000013', 'trn-f10@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000014', 'trn-f11@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000017', 'trn-f14@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('20000000-0000-0000-0000-000000000001', '교육관리자', '01091000001', 'male', '1985-01-01', 'active', now()),
  ('20000000-0000-0000-0000-000000000002', '교육F1', '01091000002', 'female', '1994-01-01', 'active', now()),
  ('20000000-0000-0000-0000-000000000003', '교육M1', '01091000003', 'male', '1994-01-02', 'active', now()),
  (
    '20000000-0000-0000-0000-000000000004', '교육대기', '01091000004', 'female', '1994-01-03',
    'pending', null
  ),
  ('20000000-0000-0000-0000-000000000005', '교육F2', '01091000005', 'female', '1994-01-04', 'active', now()),
  ('20000000-0000-0000-0000-000000000006', '교육F3', '01091000006', 'female', '1994-01-05', 'active', now()),
  ('20000000-0000-0000-0000-000000000007', '교육F4', '01091000007', 'female', '1994-01-06', 'active', now()),
  ('20000000-0000-0000-0000-000000000008', '교육F5', '01091000008', 'female', '1994-01-07', 'active', now()),
  ('20000000-0000-0000-0000-000000000009', '교육F6', '01091000009', 'female', '1994-01-08', 'active', now()),
  ('20000000-0000-0000-0000-000000000010', '교육F7', '01091000010', 'female', '1994-01-09', 'active', now()),
  ('20000000-0000-0000-0000-000000000011', '교육F8', '01091000011', 'female', '1994-01-10', 'active', now()),
  ('20000000-0000-0000-0000-000000000012', '교육F9', '01091000012', 'female', '1994-01-11', 'active', now()),
  ('20000000-0000-0000-0000-000000000013', '교육F10', '01091000013', 'female', '1994-01-12', 'active', now()),
  ('20000000-0000-0000-0000-000000000014', '교육F11', '01091000014', 'female', '1994-01-13', 'active', now()),
  ('20000000-0000-0000-0000-000000000017', '교육F14', '01091000017', 'female', '1994-01-16', 'active', now());

insert into public.profile_roles (profile_id, role, granted_by) values
  ('20000000-0000-0000-0000-000000000001', 'admin', null);

insert into worker_position_eligibilities (profile_id, position_id, granted_by) values
  (
    '20000000-0000-0000-0000-000000000017',
    (select id from positions where name = '드레스'),
    '20000000-0000-0000-0000-000000000001'
  );

insert into schedules (work_date, application_deadline, status) values
  ('2099-10-01', '2099-09-24', 'OPEN'),
  ('2099-10-02', '2099-09-25', 'CLOSED'),
  ('2099-10-03', '2099-09-26', 'PREPARING');

-- =====================================================================
-- RLS: assignment_trainees는 select 전용, 쓰기는 DEFINER 함수로만
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select count(*) from assignment_trainees$$,
  'RLS: admin은 assignment_trainees를 select할 수 있다'
);
select throws_ok(
  $$insert into assignment_trainees (schedule_id, position_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-10-01'),
      (select id from positions where name = '드레스'),
      '20000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'RLS: admin의 assignment_trainees 직접 insert도 42501로 거부된다(DEFINER 함수 경로만 허용)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select 1 from assignment_trainees$$,
  'RLS: 비관리자는 assignment_trainees를 읽을 수 없다'
);
reset role;

set local role anon;
select is_empty($$select 1 from assignment_trainees$$, 'RLS: anon은 assignment_trainees를 읽을 수 없다');
reset role;

-- =====================================================================
-- AC1: 가능 포지션이 없어도 교육생으로 저장할 수 있다(성별은 통과)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'AC1 happy path: 가능 포지션이 없는 F1을 드레스 교육생으로 저장한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '드레스')
      and profile_id = '20000000-0000-0000-0000-000000000002'
  ),
  1,
  'AC1: F1의 드레스 교육생 행이 실제로 생겼다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select is(
  (
    select currently_trainee from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-10-01'),
      (select id from positions where name = '드레스')
    ) where profile_id = '20000000-0000-0000-0000-000000000002'
  ),
  true,
  'AC1: 드레스 후보 목록에서 F1의 currently_trainee가 true다'
);
select is(
  (
    select currently_trainee from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-10-01'),
      (select id from positions where name = '스캔')
    ) where profile_id = '20000000-0000-0000-0000-000000000002'
  ),
  false,
  'AC1: 교육생 표시는 포지션 범위다 — 스캔 후보 목록에서는 F1의 currently_trainee가 false다'
);
reset role;

-- =====================================================================
-- AC1 경계값: 한 포지션에 교육생 셋도 상한 없이 저장된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array[]::uuid[],
    array[
      '20000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000009',
      '20000000-0000-0000-0000-000000000010',
      '20000000-0000-0000-0000-000000000011'
    ]::uuid[]
  )$$,
  'AC1 경계값: 드레스에 교육생 넷(F1·F6·F7·F8)을 한 번에 저장해도 상한 없이 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '드레스')
  ),
  4,
  'AC1 경계값: 드레스 교육생이 4명으로 늘었다(상한 없음)'
);

-- =====================================================================
-- AC1 중복 요청: 같은 집합 재저장은 멱등이다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array[]::uuid[],
    array[
      '20000000-0000-0000-0000-000000000002',
      '20000000-0000-0000-0000-000000000009',
      '20000000-0000-0000-0000-000000000010',
      '20000000-0000-0000-0000-000000000011'
    ]::uuid[]
  )$$,
  'AC1 중복 요청: 같은 교육생 집합 재저장도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'assignment_trainees_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '드레스')
  ),
  2,
  'AC1 멱등: 같은 집합 재저장은 감사를 추가하지 않는다(무변경, happy path 1행 + 경계값 1행에서 안 늘어남)'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'assignment_trainees_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '드레스')
    order by seq desc limit 1
  ),
  jsonb_build_object(
    'position_id', (select id from positions where name = '드레스'),
    'added_count', 3, 'removed_count', 0, 'previous_count', 1, 'new_count', 4
  ),
  'F-05류 감사: 드레스 교육생 감사 detail에 추가 3(F1은 이미 있었다)·제거 0·이전 1·이후 4가 수치로만 담긴다(PII 없음)'
);
select is(
  (
    select actor_profile_id from scheduling_audit_logs
    where event = 'assignment_trainees_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '드레스')
    order by seq desc limit 1
  ),
  '20000000-0000-0000-0000-000000000001',
  'P3-T08: assignment_trainees_replaced 감사의 actor_profile_id가 호출 관리자다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'assignment_positions_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '드레스')
  ),
  0,
  '감사 격리: 교육생만 바뀐 저장은 assignment_positions_replaced를 남기지 않는다'
);

-- =====================================================================
-- AC2: 성별 조건은 정식 배정과 같은 함수로 강제된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000003']::uuid[]
  )$$,
  'LB023',
  '포지션 성별 조건에 맞지 않습니다',
  'AC2: 성별 불일치(M1→드레스 교육생)는 LB023과 성별 사유 메시지로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'LB023',
  '활성 근무자만 배정할 수 있습니다',
  'AC2: 비활성(pending) 계정의 교육생 시도는 LB023과 활성 계정 사유 메시지로 거부된다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000005']::uuid[]
  )$$,
  'AC2 경계값: 성별 조건이 any인 스캔은 가능 포지션 없는 F2도 교육생으로 통과한다'
);
reset role;

-- =====================================================================
-- AC3: 정식 배정과 교육생은 양방향으로 겸함이 거부된다(서로 다른 오류 메시지)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '매니저'),
    array['20000000-0000-0000-0000-000000000005']::uuid[],
    array[]::uuid[]
  )$$,
  'LB024',
  '이미 교육생으로 등록되어 있어 정식 배정할 수 없습니다',
  'AC3 방향1(revision 3 — 메시지 일반화): 이미 스캔 교육생인 F2를 매니저에 정식 배정하면 LB024로 거부된다'
);

select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '매니저'),
    array['20000000-0000-0000-0000-000000000006']::uuid[],
    array[]::uuid[]
  )$$,
  'AC3 준비: F3을 매니저(기본 포지션)에 정식 배정한다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000006']::uuid[]
  )$$,
  'LB024',
  '이미 다른 포지션에 정식 배정되어 있어 교육생으로 지정할 수 없습니다',
  'AC3 방향2: 이미 매니저에 정식 배정된 F3을 스캔 교육생으로 넣으면 LB024로 거부되고 방향1과 메시지가 다르다'
);

select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array['20000000-0000-0000-0000-000000000007']::uuid[],
    array['20000000-0000-0000-0000-000000000007']::uuid[]
  )$$,
  'LB024',
  '정식 배정과 교육생을 동시에 선택할 수 없습니다',
  'AC3 경계값: 같은 요청에서 정식·교육 두 배열에 동시에 든 F4는 LB024로 거부된다'
);

select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000017']::uuid[]
  )$$,
  'AC3 revision 3(교차 검증 F-01 정정, P3-T08): F14를 드레스 교육생으로 저장한다 — trainee_profile_ids가 [F14]뿐이라 드레스의 기존 교육생 4명(F1·F6·F7·F8)이 이 호출로 함께 제거된다(전체 교체 계약)'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array['20000000-0000-0000-0000-000000000017']::uuid[]
  )$$,
  'LB024',
  '이미 교육생으로 등록되어 있어 정식 배정할 수 없습니다',
  'AC3 revision 3(교차 검증 F-01): 같은 포지션(드레스) 교육생인 F14를 네번째 인자 없는 3-인자 호출로 정식 배정해도 LB024로 거부된다(3-인자 겸직 구멍 차단)'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-10-01')
      and ap.position_id = (select id from positions where name = '스캔')
      and asg.profile_id = '20000000-0000-0000-0000-000000000006'
  ),
  0,
  'AC3: 거부된 시도 이후에도 F3의 스캔 정식 배정은 생기지 않았다(부분 반영 없음)'
);

-- =====================================================================
-- AC4: 같은 사람이 두 번째 포지션의 교육생이 될 수 없다(LB025, AC3과 다른 코드)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000008']::uuid[]
  )$$,
  'AC4 준비: F5를 스캔 교육생으로 저장한다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '메인'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000008']::uuid[]
  )$$,
  'LB025',
  '이미 다른 포지션의 교육생으로 등록되어 있습니다',
  'AC4: 이미 스캔 교육생인 F5를 메인 교육생으로 추가하면 LB025로 거부되고 LB024와 메시지가 다르다'
);
reset role;

-- =====================================================================
-- AC4 경계값: 첫 포지션 교육을 풀고 두 번째로 옮기는 것은 통과한다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array[]::uuid[],
    array[]::uuid[]
  )$$,
  'AC4 경계값: F5를 스캔 교육생에서 뺀다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '메인'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000008']::uuid[]
  )$$,
  'AC4 경계값: 스캔에서 빠진 F5는 메인 교육생으로 옮겨질 수 있다'
);
reset role;

select is(
  (
    select position_id from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and profile_id = '20000000-0000-0000-0000-000000000008'
  ),
  (select id from positions where name = '메인'),
  'AC4 경계값: F5의 교육생 행이 스캔에서 메인으로 옮겨졌다(행은 여전히 하나)'
);

-- =====================================================================
-- AC8 회귀 경계값(revision 2): 네번째 인자를 아예 안 주는 옛 3-인자 호출은
-- null 기본값으로 풀려 그 포지션의 기존 교육생 행을 건드리지 않는다.
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '축가'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000013']::uuid[]
  )$$,
  'AC8 준비: F10을 축가 교육생으로 저장한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '축가'),
    array['20000000-0000-0000-0000-000000000014']::uuid[]
  )$$,
  'AC8: 네번째 인자 없이 옛 3-인자로 F11을 축가에 정식 배정해도 성공한다(null 기본값)'
);
reset role;

select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '축가')
      and profile_id = '20000000-0000-0000-0000-000000000013'
  ),
  1,
  'AC8: 3-인자 호출 뒤에도 F10의 축가 교육생 행이 그대로 남아 있다(null = 무변경 계약)'
);
select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-10-01')
      and ap.position_id = (select id from positions where name = '축가')
      and asg.profile_id = '20000000-0000-0000-0000-000000000014'
  ),
  1,
  'AC8: 3-인자 호출로 F11은 축가에 실제로 정식 배정됐다'
);
select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '축가')
  ),
  1,
  'AC8: 축가 교육생 수는 여전히 1명이다(3-인자 호출이 교육생 집합을 늘리거나 줄이지 않았다)'
);

-- =====================================================================
-- AC7 전이(revision 3, 교차 검증 F-03): 정식 배정 전원 제거 호출 뒤에도
-- 교육생 행은 남는다. 이전 기록은 e2e로 최종 상태만 확인했다.
-- =====================================================================

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-000000000015', 'trn-f12@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000016', 'trn-f13@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('20000000-0000-0000-0000-000000000015', '교육F12', '01091000015', 'female', '1994-01-14', 'active', now()),
  ('20000000-0000-0000-0000-000000000016', '교육F13', '01091000016', 'female', '1994-01-15', 'active', now());

insert into worker_position_eligibilities (profile_id, position_id, granted_by) values
  (
    '20000000-0000-0000-0000-000000000015',
    (select id from positions where name = '스캔'),
    '20000000-0000-0000-0000-000000000001'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array['20000000-0000-0000-0000-000000000015']::uuid[],
    array[]::uuid[]
  )$$,
  'AC7 전이 준비: F12를 스캔에 정식 배정한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array['20000000-0000-0000-0000-000000000015']::uuid[],
    array['20000000-0000-0000-0000-000000000016']::uuid[]
  )$$,
  'AC7 전이 준비: F13을 스캔 교육생으로 추가하며 F12의 정식 배정은 그대로 둔다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '스캔'),
    array[]::uuid[]
  )$$,
  'AC7 전이: 스캔의 정식 배정자 F12를 네번째 인자 없는 3-인자 호출로 전원 제거한다(null 기본값 = 교육생 무변경)'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-10-01')
      and ap.position_id = (select id from positions where name = '스캔')
      and asg.profile_id = '20000000-0000-0000-0000-000000000015'
  ),
  0,
  'AC7 전이: F12의 스캔 정식 배정이 실제로 제거됐다'
);
select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '스캔')
      and profile_id = '20000000-0000-0000-0000-000000000016'
  ),
  1,
  'AC7 전이(교차 검증 F-03): 정식 배정자 전원 제거 호출 뒤에도 F13의 스캔 교육생 행은 그대로 남는다'
);

-- =====================================================================
-- P3-T08 backlog 흡수(F-12): 같은 포지션 안에서 4-인자 호출로 교육→정식
-- 전환(스왑)하는 분기가 어느 계층에서도 단언되지 않았다. F14는 드레스의
-- 유일한 교육생이라(위 준비에서 다른 교육생 4명이 대체됨) 여기서 그 상태를
-- 그대로 넘겨받는다.
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '드레스'),
    array['20000000-0000-0000-0000-000000000017']::uuid[],
    array[]::uuid[]
  )$$,
  'P3-T08 F-12: 같은 포지션(드레스) 교육생 F14를 4-인자 호출로 정식 배정 전환한다(교육→정식 스왑 허용)'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-10-01')
      and ap.position_id = (select id from positions where name = '드레스')
      and asg.profile_id = '20000000-0000-0000-0000-000000000017'
  ),
  1,
  'P3-T08 F-12: F14가 드레스에 정식 배정됐다'
);
select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '드레스')
      and profile_id = '20000000-0000-0000-0000-000000000017'
  ),
  0,
  'P3-T08 F-12: F14의 드레스 교육생 행은 스왑으로 사라졌다'
);

-- =====================================================================
-- P3-T08 backlog 흡수(F-13): AC7 전이는 지금까지 프로덕션이 쓰지 않는
-- 3-인자 경로로만 실증됐다. 프로덕션이 실제로 쓰는 4-인자 경로(교육생
-- 배열을 명시적으로 그대로 넘김)로 같은 전이를 재현한다.
-- =====================================================================

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-000000000018', 'trn-f15@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('20000000-0000-0000-0000-000000000018', '교육F15', '01091000018', 'female', '1994-01-17', 'active', now());

insert into worker_position_eligibilities (profile_id, position_id, granted_by) values
  (
    '20000000-0000-0000-0000-000000000018',
    (select id from positions where name = '메인'),
    '20000000-0000-0000-0000-000000000001'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '메인'),
    array['20000000-0000-0000-0000-000000000018']::uuid[],
    array['20000000-0000-0000-0000-000000000008']::uuid[]
  )$$,
  'P3-T08 F-13 준비: F15를 메인에 정식 배정하며 4-인자 호출로 기존 F5의 메인 교육생 상태를 명시 유지한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '메인'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000008']::uuid[]
  )$$,
  'P3-T08 F-13(AC7 4-인자 경로): 프로덕션이 실제로 쓰는 4-인자 호출로 정식 배정자 F15 전원을 제거하며 교육생 배열은 그대로 넘긴다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-10-01')
      and ap.position_id = (select id from positions where name = '메인')
      and asg.profile_id = '20000000-0000-0000-0000-000000000018'
  ),
  0,
  'P3-T08 F-13: F15의 메인 정식 배정이 실제로 제거됐다'
);
select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-01')
      and position_id = (select id from positions where name = '메인')
      and profile_id = '20000000-0000-0000-0000-000000000008'
  ),
  1,
  'P3-T08 F-13(AC7): 4-인자 경로로도 정식 배정자 전원 제거 후 F5의 메인 교육생 행이 그대로 남는다'
);

-- =====================================================================
-- P3-T08 축 단위 공백: CLOSED·PREPARING도 교육생 인자를 포함한
-- replace_position_assignments를 허용한다
-- =====================================================================

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-000000000020', 'trn-f17@labiebelle.test'),
  ('20000000-0000-0000-0000-000000000021', 'trn-f18@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('20000000-0000-0000-0000-000000000020', '교육F17', '01091000020', 'male', '1994-01-19', 'active', now()),
  ('20000000-0000-0000-0000-000000000021', '교육F18', '01091000021', 'male', '1994-01-20', 'active', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-02'),
    (select id from positions where name = '매니저'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000020']::uuid[]
  )$$,
  'P3-T08 CLOSED: 교육생 인자를 포함한 replace_position_assignments가 CLOSED 스케줄에서도 성공한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-03'),
    (select id from positions where name = '매니저'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000021']::uuid[]
  )$$,
  'P3-T08 PREPARING: 교육생 인자를 포함한 replace_position_assignments가 PREPARING 스케줄에서도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-02')
      and position_id = (select id from positions where name = '매니저')
      and profile_id = '20000000-0000-0000-0000-000000000020'
  ),
  1,
  'P3-T08 CLOSED: 교육생 F17 행이 실제로 생겼다'
);
select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-10-03')
      and position_id = (select id from positions where name = '매니저')
      and profile_id = '20000000-0000-0000-0000-000000000021'
  ),
  1,
  'P3-T08 PREPARING: 교육생 F18 행이 실제로 생겼다'
);

-- =====================================================================
-- 삭제 판정: assignment_trainees.position_id FK restrict
-- =====================================================================

insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('임시교육삭제판정포지션', 1, 'any', false, true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-10-01'),
    (select id from positions where name = '임시교육삭제판정포지션'),
    array[]::uuid[],
    array['20000000-0000-0000-0000-000000000012']::uuid[]
  )$$,
  '삭제 판정 준비: F9를 임시 포지션 교육생으로 저장한다'
);
select throws_ok(
  $$delete from positions where name = '임시교육삭제판정포지션'$$,
  '23503',
  null,
  '삭제 판정: 교육생이 붙은 포지션 delete는 23503으로 차단된다(assignment_trainees FK restrict)'
);
reset role;

select * from finish();
rollback;
