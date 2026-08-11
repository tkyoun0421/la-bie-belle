begin;
select plan(95);

-- =====================================================================
-- 스키마 노출: 테이블·컬럼·제약·RLS·함수 시그니처
-- =====================================================================

select has_table('public', 'assignments', 'assignments table');
select has_table('public', 'assignment_positions', 'assignment_positions table');

select col_not_null('public', 'assignments', 'schedule_id', 'assignments.schedule_id not null');
select col_not_null('public', 'assignments', 'profile_id', 'assignments.profile_id not null');
select col_is_fk('public', 'assignments', 'schedule_id', 'assignments.schedule_id fk');
select col_is_fk('public', 'assignments', 'profile_id', 'assignments.profile_id fk');
select col_is_unique(
  'public', 'assignments', array['schedule_id', 'profile_id'],
  'assignments unique(schedule_id, profile_id)'
);

select col_is_pk(
  'public', 'assignment_positions', array['assignment_id', 'position_id'],
  'assignment_positions composite pk(assignment_id, position_id)'
);
select col_is_fk(
  'public', 'assignment_positions', 'assignment_id', 'assignment_positions.assignment_id fk'
);
select col_is_fk(
  'public', 'assignment_positions', 'position_id', 'assignment_positions.position_id fk'
);
select is(
  (
    select confdeltype from pg_constraint
    where conrelid = 'assignment_positions'::regclass
      and confrelid = 'assignments'::regclass
  ),
  'c',
  'assignment_positions.assignment_id fk는 on delete cascade다'
);
select is(
  (
    select confdeltype from pg_constraint
    where conrelid = 'assignment_positions'::regclass
      and confrelid = 'positions'::regclass
  ),
  'r',
  'assignment_positions.position_id fk는 on delete restrict다'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.assignments'::regclass),
  'assignments has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.assignment_positions'::regclass),
  'assignment_positions has row level security enabled'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'assignments'),
  1,
  'assignments has exactly one policy(select 전용, 쓰기는 DEFINER 함수로만, F-01)'
);
select is(
  (
    select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'assignment_positions'
  ),
  1,
  'assignment_positions has exactly one policy(select 전용)'
);

select has_function(
  'public', 'list_position_assignment_candidates', array['uuid', 'uuid'],
  'list_position_assignment_candidates(uuid, uuid) exists'
);
select has_function(
  'public', 'replace_position_assignments', array['uuid', 'uuid', 'uuid[]', 'uuid[]'],
  'replace_position_assignments(uuid, uuid, uuid[], uuid[]) exists'
);
select ok(
  has_function_privilege(
    'authenticated', 'list_position_assignment_candidates(uuid, uuid)', 'execute'
  ),
  'authenticated는 list_position_assignment_candidates 실행 권한이 있고 admin 여부는 내부 is_admin이 강제한다'
);
select ok(
  has_function_privilege(
    'authenticated', 'replace_position_assignments(uuid, uuid, uuid[], uuid[])', 'execute'
  ),
  'authenticated는 replace_position_assignments 실행 권한이 있고 admin 여부는 내부 is_admin이 강제한다'
);
select ok(
  pg_get_functiondef('replace_position_assignments(uuid, uuid, uuid[], uuid[])'::regprocedure)
    ~* 'for update',
  '동시성: replace_position_assignments 정의가 for update 잠금을 사용한다'
);

-- =====================================================================
-- 픽스처: 관리자·근무자 5명, 스케줄 3종, 포지션 신청·자격
-- =====================================================================

insert into auth.users (id, email) values
  ('19000000-0000-0000-0000-000000000001', 'asg-admin@labiebelle.test'),
  ('19000000-0000-0000-0000-000000000002', 'asg-f1@labiebelle.test'),
  ('19000000-0000-0000-0000-000000000003', 'asg-f2@labiebelle.test'),
  ('19000000-0000-0000-0000-000000000004', 'asg-m1@labiebelle.test'),
  ('19000000-0000-0000-0000-000000000005', 'asg-pending@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('19000000-0000-0000-0000-000000000001', '배정관리자', '01090000001', 'male', '1985-01-01', 'active', now()),
  ('19000000-0000-0000-0000-000000000002', '배정F1', '01090000002', 'female', '1992-02-02', 'active', now()),
  ('19000000-0000-0000-0000-000000000003', '배정F2', '01090000003', 'female', '1993-03-03', 'active', now()),
  ('19000000-0000-0000-0000-000000000004', '배정M1', '01090000004', 'male', '1994-04-04', 'active', now()),
  (
    '19000000-0000-0000-0000-000000000005', '배정대기', '01090000005', 'female', '1995-05-05', 'pending', null
  );

insert into public.profile_roles (profile_id, role, granted_by) values
  ('19000000-0000-0000-0000-000000000001', 'admin', null);

insert into schedules (work_date, application_deadline, status) values
  ('2099-09-01', '2099-08-25', 'OPEN'),
  ('2099-09-02', '2099-08-26', 'CONFIRMED'),
  ('2099-09-03', '2099-08-27', 'CANCELLED');

insert into applications (schedule_id, profile_id, status) values
  (
    (select id from schedules where work_date = '2099-09-01'),
    '19000000-0000-0000-0000-000000000002',
    'applied'
  ),
  (
    (select id from schedules where work_date = '2099-09-01'),
    '19000000-0000-0000-0000-000000000004',
    'applied'
  );

insert into worker_position_eligibilities (profile_id, position_id, granted_by) values
  (
    '19000000-0000-0000-0000-000000000002',
    (select id from positions where name = '팀장'),
    '19000000-0000-0000-0000-000000000001'
  ),
  (
    '19000000-0000-0000-0000-000000000003',
    (select id from positions where name = '팀장'),
    '19000000-0000-0000-0000-000000000001'
  );

-- =====================================================================
-- F-01·F-04: assignments·assignment_positions 쓰기는 DEFINER 함수로만 허용된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select count(*) from assignments$$,
  'F-01: admin은 assignments를 select할 수 있다'
);
select lives_ok(
  $$select count(*) from assignment_positions$$,
  'F-01: admin은 assignment_positions를 select할 수 있다'
);
select throws_ok(
  $$insert into assignments (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-09-01'),
      '19000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'F-01: admin의 assignments 직접 insert는 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select 1 from assignments$$,
  'F-04: 비관리자(active 근무자)는 assignments를 읽을 수 없다'
);
select is_empty(
  $$select 1 from assignment_positions$$,
  'F-04: 비관리자(active 근무자)는 assignment_positions를 읽을 수 없다'
);
select throws_ok(
  $$insert into assignments (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-09-01'),
      '19000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'F-04: 비관리자의 assignments insert는 42501로 거부된다'
);
reset role;

set local role anon;
select is_empty($$select 1 from assignments$$, 'F-04: anon은 assignments를 읽을 수 없다');
select throws_ok(
  $$insert into assignments (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-09-01'),
      '19000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'F-04: anon의 assignments insert는 42501로 거부된다'
);
reset role;

-- =====================================================================
-- AC2 권한: list_position_assignment_candidates
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select * from list_position_assignment_candidates(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장')
  )$$,
  '42501',
  null,
  'AC2 권한: 비관리자의 list_position_assignment_candidates는 42501로 거부된다'
);
reset role;

-- =====================================================================
-- AC2: 신청·자격·다른 포지션 배정을 붙인 후보 목록(팀장 대상)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);

select is(
  (
    select applied from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정F1'
  ),
  true,
  'AC2: 신청한 F1은 applied = true다'
);
select is(
  (
    select applied from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정F2'
  ),
  false,
  'AC2: 신청하지 않은 F2는 applied = false다'
);
select is(
  (
    select eligible from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정F1'
  ),
  true,
  'AC2: 가능 포지션이 부여된 F1은 팀장에 eligible = true다'
);
select is(
  (
    select eligible from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정M1'
  ),
  false,
  'AC2 주요 실패: 가능 포지션이 없는 M1은 팀장에 eligible = false다'
);
select is(
  (
    select ineligible_reason from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정M1'
  ),
  'NOT_ELIGIBLE',
  'AC2: M1의 ineligible_reason은 NOT_ELIGIBLE이다'
);
select is(
  (
    select currently_assigned from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정F1'
  ),
  false,
  'AC2: 아직 배정 전이므로 F1의 currently_assigned는 false다'
);
select is(
  (
    select count(*)::int from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정대기'
  ),
  0,
  'AC2: 비활성(pending) 계정은 후보 목록에서 아예 제외된다'
);

-- =====================================================================
-- AC2 경계값: 기본 포지션도 성별 조건을 통과해야 한다(안내: 기본·남성 전용)
-- =====================================================================

select is(
  (
    select eligible from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '안내')
    ) where name = '배정F1'
  ),
  false,
  'AC2 경계값: 기본 포지션(안내)도 성별 불일치면 eligible = false다'
);
select is(
  (
    select ineligible_reason from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '안내')
    ) where name = '배정F1'
  ),
  'GENDER_MISMATCH',
  'AC2 경계값: F1의 안내 ineligible_reason은 GENDER_MISMATCH다(NOT_ELIGIBLE 아님, 우선순위)'
);
select is(
  (
    select eligible from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '안내')
    ) where name = '배정M1'
  ),
  true,
  'AC2: 기본 포지션(안내)은 성별이 맞으면 가능 포지션 보유 없이도 eligible = true다'
);
select is(
  (
    select ineligible_reason from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '드레스')
    ) where name = '배정M1'
  ),
  'GENDER_MISMATCH',
  'AC2 경계값: 여성 전용(드레스, 비기본)도 성별 불일치는 GENDER_MISMATCH다'
);

-- =====================================================================
-- AC3: replace_position_assignments 권한·상태·happy path
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  '42501',
  null,
  'AC3 권한: 비관리자의 replace_position_assignments는 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-02'),
    (select id from positions where name = '팀장'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'LB020',
  null,
  'AC3: CONFIRMED 스케줄의 배정 교체는 LB020으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-03'),
    (select id from positions where name = '팀장'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'LB020',
  null,
  'AC3: CANCELLED 스케줄의 배정 교체는 LB020으로 거부된다'
);

insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('임시비활성배정포지션', 1, 'any', false, false);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시비활성배정포지션'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  '22023',
  null,
  'AC3 주요 실패: 비활성 포지션에는 배정을 새로 만들 수 없다(22023)'
);

select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array[
      '19000000-0000-0000-0000-000000000002',
      '19000000-0000-0000-0000-000000000003'
    ]::uuid[]
  )$$,
  'AC3 happy path: 신청자 2명(F1·F2) 배정이 성공한다(필요 인원 1명을 넘는 초과 배정)'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '팀장')
  ),
  2,
  'AC3: 팀장에 2명이 배정됐다(필요 인원 초과 허용)'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'assignment_positions_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '팀장')
  ),
  1,
  'AC3: happy path 배정으로 감사가 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'assignment_positions_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '팀장')
    order by seq desc limit 1
  ),
  jsonb_build_object(
    'position_id', (select id from positions where name = '팀장'),
    'added_count', 2, 'removed_count', 0, 'previous_count', 0, 'new_count', 2
  ),
  'F-05: 감사 detail에 추가 2·제거 0·이전 0·이후 2가 수치로만 담긴다(PII 없음)'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select is(
  (
    select currently_assigned from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '팀장')
    ) where name = '배정F1'
  ),
  true,
  'AC2: 배정 후 F1의 currently_assigned가 true로 반영된다'
);

select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array[
      '19000000-0000-0000-0000-000000000002',
      '19000000-0000-0000-0000-000000000003'
    ]::uuid[]
  )$$,
  'AC3 중복 요청: 같은 집합 재호출도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'assignment_positions_replaced'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '팀장')
  ),
  1,
  'AC3 멱등: 같은 집합 재호출은 감사를 추가하지 않는다(무변경)'
);

-- =====================================================================
-- AC3: 기존 1명 해제 + 신규 1명 추가를 한 번에 교체
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '매니저'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'F1을 매니저(기본 포지션)에 배정해 다른 포지션 배정 배지 픽스처를 만든다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array['19000000-0000-0000-0000-000000000003']::uuid[]
  )$$,
  'AC3 happy path: F1 해제 + 신규 배정 없음(F2만 유지)을 한 번의 교체로 반영한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '팀장')
      and asg.profile_id = '19000000-0000-0000-0000-000000000002'
  ),
  0,
  'AC3: F1의 팀장 배정이 해제됐다'
);
select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '매니저')
      and asg.profile_id = '19000000-0000-0000-0000-000000000002'
  ),
  1,
  'AC3: F1은 매니저 배정을 그대로 유지한다(팀장만 해제됐다는 근거)'
);
select is(
  (
    select other_position_names from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '매니저')
    ) where profile_id = '19000000-0000-0000-0000-000000000002'
  ),
  array[]::text[],
  'AC2: F1의 매니저 조회 other_position_names는 빈 배열이다(팀장 해제 반영)'
);

-- =====================================================================
-- AC3 경계값: 빈 배열로 전원 해제
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array[]::uuid[]
  )$$,
  'AC3 경계값: 빈 배열로 팀장 전원 해제가 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '팀장')
  ),
  0,
  'AC3 경계값: 팀장 담당자가 0명이 됐다'
);
select is(
  (
    select count(*)::int from assignments
    where schedule_id = (select id from schedules where work_date = '2099-09-01')
      and profile_id = '19000000-0000-0000-0000-000000000003'
  ),
  0,
  '두 층은 함께 움직인다: F2의 담당 포지션이 0개가 되어 assignments 행도 함께 삭제됐다'
);
select is(
  (
    select count(*)::int from assignments
    where schedule_id = (select id from schedules where work_date = '2099-09-01')
      and profile_id = '19000000-0000-0000-0000-000000000002'
  ),
  1,
  '두 층은 함께 움직인다: F1은 매니저 배정이 남아 있어 assignments 행이 삭제되지 않는다'
);

-- =====================================================================
-- AC4: 자격 강제 5종 거부(함수 경로) — 성별·가능 포지션·비활성 계정·비활성 포지션·확정 스케줄
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '드레스'),
    array['19000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'LB023',
  null,
  'AC4 자격 강제 1/5: 성별 불일치(M1→드레스)는 LB023으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array['19000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'LB023',
  null,
  'AC4 자격 강제 2/5: 가능 포지션 없음(M1→팀장, 비기본)은 LB023으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '매니저'),
    array['19000000-0000-0000-0000-000000000005']::uuid[]
  )$$,
  'LB023',
  null,
  'AC4 자격 강제 3/5: 비활성(pending) 계정 배정 시도는 LB023으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시비활성배정포지션'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  '22023',
  null,
  'AC4 자격 강제 4/5: 비활성 포지션 배정 시도는 22023으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-02'),
    (select id from positions where name = '팀장'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'LB020',
  null,
  'AC4 자격 강제 5/5: 확정 스케줄 배정 시도는 LB020으로 거부된다'
);

select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '팀장'),
    array[
      '19000000-0000-0000-0000-000000000003',
      '19000000-0000-0000-0000-000000000004'
    ]::uuid[]
  )$$,
  'LB023',
  null,
  'AC4: 배열에 유효 profile과 무자격 profile이 섞이면 전체가 거부된다(부분 저장 없음)'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '팀장')
  ),
  0,
  'AC4: 전체 거부 후에도 팀장 배정은 0명 그대로다(부분 반영 없음)'
);

-- =====================================================================
-- AC4: 자격 강제 5종 거부(직접 DML 경로) — RLS가 원천 차단한다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$insert into assignments (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-09-01'),
      '19000000-0000-0000-0000-000000000004'
    )$$,
  '42501',
  null,
  'AC4 직접 DML: 관리자라도 assignments 직접 insert는 자격 유무와 무관하게 42501로 거부된다'
);
with attempted as (
  update assignment_positions set position_id = position_id
  where assignment_id = (
    select id from assignments
    where schedule_id = (select id from schedules where work_date = '2099-09-01')
      and profile_id = '19000000-0000-0000-0000-000000000002'
  )
  returning 1
)
select is(
  (select count(*)::int from attempted),
  0,
  'AC4 직접 DML: 관리자의 assignment_positions 직접 update는 0건 적용된다(자격 재검사·감사 우회 방지)'
);
with attempted as (
  delete from assignment_positions
  where assignment_id = (
    select id from assignments
    where schedule_id = (select id from schedules where work_date = '2099-09-01')
      and profile_id = '19000000-0000-0000-0000-000000000002'
  )
  returning 1
)
select is(
  (select count(*)::int from attempted),
  0,
  'AC4 직접 DML: 관리자의 assignment_positions 직접 delete는 0건 적용된다(교체 함수 경로만 허용)'
);
reset role;

-- =====================================================================
-- 삭제 판정: assignment_positions.position_id FK restrict
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$delete from positions where name = '매니저'$$,
  '23503',
  null,
  '삭제 판정: 배정에 쓰이고 있는 포지션 delete는 23503으로 차단된다(assignment_positions FK restrict)'
);
reset role;

-- =====================================================================
-- 교차 검증 수정 라운드 F-05: 사후 자격 회수 회귀(F-01·F-03·F-04 고정)
-- 대상: 배정을 만든 뒤 그 사람의 자격이 사라지는 세 경로 각각에서
-- 재저장·다른 사람 추가·본인 해제가 계속 동작하는지 고정한다.
-- =====================================================================

insert into worker_position_eligibilities (profile_id, position_id, granted_by) values
  (
    '19000000-0000-0000-0000-000000000004',
    (select id from positions where name = '스캔'),
    '19000000-0000-0000-0000-000000000001'
  ),
  (
    '19000000-0000-0000-0000-000000000002',
    (select id from positions where name = '스캔'),
    '19000000-0000-0000-0000-000000000001'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '스캔'),
    array['19000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'F-05 준비: M1을 스캔에 배정한다(가능 포지션 보유)'
);
reset role;

delete from worker_position_eligibilities
where profile_id = '19000000-0000-0000-0000-000000000004'
  and position_id = (select id from positions where name = '스캔');

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '스캔'),
    array['19000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'F-05/1①: 가능 포지션을 잃은 M1을 포함한 같은 집합 재저장이 LB023 없이 성공한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '스캔'),
    array[
      '19000000-0000-0000-0000-000000000004',
      '19000000-0000-0000-0000-000000000002'
    ]::uuid[]
  )$$,
  'F-05/1②: M1을 유지한 채 자격 있는 F1을 추가하는 저장이 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '스캔')
  ),
  2,
  'F-05/1②: 스캔에 M1·F1 2명이 배정됐다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '스캔'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'F-05/1③: 자격을 잃은 M1만 빼는 저장이 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '스캔')
      and asg.profile_id = '19000000-0000-0000-0000-000000000004'
  ),
  0,
  'F-05/1③: M1이 스캔 배정에서 실제로 제거됐다'
);
select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '스캔')
      and asg.profile_id = '19000000-0000-0000-0000-000000000002'
  ),
  1,
  'F-05/1③: F1은 스캔 배정을 유지한다'
);

insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('임시성별회귀포지션', 1, 'any', true, true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시성별회귀포지션'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'F-05 준비: F1을 임시성별회귀포지션(당시 any)에 배정한다'
);
reset role;

update positions set gender_requirement = 'male' where name = '임시성별회귀포지션';

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시성별회귀포지션'),
    array['19000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'F-05/2①: 성별 조건이 바뀌어 어긋난 F1을 포함한 같은 집합 재저장이 LB023 없이 성공한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시성별회귀포지션'),
    array[
      '19000000-0000-0000-0000-000000000002',
      '19000000-0000-0000-0000-000000000004'
    ]::uuid[]
  )$$,
  'F-05/2②: F1을 유지한 채 성별이 맞는 M1을 추가하는 저장이 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '임시성별회귀포지션')
  ),
  2,
  'F-05/2②: 임시성별회귀포지션에 F1·M1 2명이 배정됐다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시성별회귀포지션'),
    array['19000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'F-05/2③: 성별 조건이 어긋난 F1만 빼는 저장이 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '임시성별회귀포지션')
      and asg.profile_id = '19000000-0000-0000-0000-000000000002'
  ),
  0,
  'F-05/2③: F1이 임시성별회귀포지션 배정에서 실제로 제거됐다'
);
select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '임시성별회귀포지션')
      and asg.profile_id = '19000000-0000-0000-0000-000000000004'
  ),
  1,
  'F-05/2③: M1은 임시성별회귀포지션 배정을 유지한다'
);

insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('임시탈퇴회귀포지션', 1, 'any', true, true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시탈퇴회귀포지션'),
    array['19000000-0000-0000-0000-000000000003']::uuid[]
  )$$,
  'F-05 준비: F2를 임시탈퇴회귀포지션에 배정한다'
);
select lives_ok(
  $$select deactivate_worker('19000000-0000-0000-0000-000000000003')$$,
  'F-05 준비: F2를 휴면으로 전환한다'
);

select is(
  (
    select currently_assigned from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '임시탈퇴회귀포지션')
    ) where profile_id = '19000000-0000-0000-0000-000000000003'
  ),
  true,
  'F-05/3①: 휴면 전환된 F2도 후보 목록에 currently_assigned = true로 나온다'
);
select is(
  (
    select eligible from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '임시탈퇴회귀포지션')
    ) where profile_id = '19000000-0000-0000-0000-000000000003'
  ),
  false,
  'F-05/3①: 휴면 전환된 F2는 eligible = false다'
);
select is(
  (
    select ineligible_reason from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '임시탈퇴회귀포지션')
    ) where profile_id = '19000000-0000-0000-0000-000000000003'
  ),
  null,
  'F-05/3①: 휴면은 GENDER_MISMATCH·NOT_ELIGIBLE 어느 쪽도 아니라 ineligible_reason이 null이다'
);

select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시탈퇴회귀포지션'),
    array['19000000-0000-0000-0000-000000000003']::uuid[]
  )$$,
  'F-05/3②: 휴면 전환된 F2를 포함한 같은 집합 재저장이 LB023 없이 성공한다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2099-09-01'),
    (select id from positions where name = '임시탈퇴회귀포지션'),
    array[]::uuid[]
  )$$,
  'F-05/3③: 휴면 전환된 F2만 빼는 저장(전원 해제)이 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-09-01')
      and ap.position_id = (select id from positions where name = '임시탈퇴회귀포지션')
  ),
  0,
  'F-05/3③: 휴면 전환된 F2가 임시탈퇴회귀포지션 배정에서 실제로 제거됐다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select is(
  (
    select count(*)::int from list_position_assignment_candidates(
      (select id from schedules where work_date = '2099-09-01'),
      (select id from positions where name = '스캔')
    ) where name = '배정대기'
  ),
  0,
  'F-05/4: 배정된 적 없는 비활성(pending) 계정은 여전히 후보 목록에 없다'
);
reset role;

select * from finish();
rollback;
