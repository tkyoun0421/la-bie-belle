begin;
select plan(86);

-- =====================================================================
-- 스키마 노출: 테이블·컬럼·제약·RLS·함수 시그니처
-- =====================================================================

select has_table('public', 'schedule_position_requirements', 'schedule_position_requirements table');
select col_is_pk(
  'public', 'schedule_position_requirements', array['schedule_id', 'position_id'],
  'schedule_position_requirements composite pk(schedule_id, position_id)'
);
select col_not_null(
  'public', 'schedule_position_requirements', 'schedule_id',
  'schedule_position_requirements.schedule_id not null'
);
select col_not_null(
  'public', 'schedule_position_requirements', 'position_id',
  'schedule_position_requirements.position_id not null'
);
select col_not_null(
  'public', 'schedule_position_requirements', 'required_count',
  'schedule_position_requirements.required_count not null'
);
select col_is_fk(
  'public', 'schedule_position_requirements', 'schedule_id',
  'schedule_position_requirements.schedule_id fk'
);
select col_is_fk(
  'public', 'schedule_position_requirements', 'position_id',
  'schedule_position_requirements.position_id fk'
);
select is(
  (
    select confdeltype from pg_constraint
    where conrelid = 'schedule_position_requirements'::regclass
      and confrelid = 'positions'::regclass
  ),
  'r',
  'schedule_position_requirements.position_id fk는 on delete restrict다'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.schedule_position_requirements'::regclass),
  'schedule_position_requirements has row level security enabled'
);
select is(
  (
    select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'schedule_position_requirements'
  ),
  1,
  'schedule_position_requirements has exactly one policy(select 전용, 쓰기는 DEFINER 함수로만, F-01)'
);

select has_function(
  'public', 'copy_schedule_requirements', array['uuid'],
  'copy_schedule_requirements(uuid) exists'
);
select has_function(
  'public', 'set_position_requirement', array['uuid', 'uuid', 'integer'],
  'set_position_requirement(uuid, uuid, integer) exists'
);
select has_function(
  'public', 'remove_position_requirement', array['uuid', 'uuid'],
  'remove_position_requirement(uuid, uuid) exists'
);
select has_trigger(
  'public', 'positions', 'positions_apply_to_open_schedules',
  'positions_apply_to_open_schedules trigger exists'
);

select ok(
  has_function_privilege('authenticated', 'copy_schedule_requirements(uuid)', 'execute'),
  'authenticated는 copy_schedule_requirements 실행 권한이 있고 admin 여부는 내부 is_admin이 강제한다'
);
select ok(
  has_function_privilege('authenticated', 'set_position_requirement(uuid, uuid, integer)', 'execute'),
  'authenticated는 set_position_requirement 실행 권한이 있고 admin 여부는 내부 is_admin이 강제한다'
);
select ok(
  has_function_privilege('authenticated', 'remove_position_requirement(uuid, uuid)', 'execute'),
  'authenticated는 remove_position_requirement 실행 권한이 있고 admin 여부는 내부 is_admin이 강제한다'
);
select ok(
  pg_get_functiondef('set_position_requirement(uuid, uuid, integer)'::regprocedure) ~* 'for update',
  '동시성: set_position_requirement 정의가 for update 잠금을 사용한다'
);
select ok(
  pg_get_functiondef('remove_position_requirement(uuid, uuid)'::regprocedure) ~* 'for update',
  '동시성: remove_position_requirement 정의가 for update 잠금을 사용한다'
);

-- =====================================================================
-- 픽스처: 관리자·근무자, 스케줄 6종
-- =====================================================================

insert into auth.users (id, email) values
  ('18000000-0000-0000-0000-000000000001', 'req-admin@labiebelle.test'),
  ('18000000-0000-0000-0000-000000000002', 'req-worker@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('18000000-0000-0000-0000-000000000001', '요건관리자', '01080000001', 'male', '1985-01-01', 'active', now()),
  ('18000000-0000-0000-0000-000000000002', '요건근무자', '01080000002', 'female', '1990-02-02', 'active', now());

insert into public.profile_roles (profile_id, role, granted_by) values
  ('18000000-0000-0000-0000-000000000001', 'admin', null);

insert into schedules (work_date, application_deadline, status) values
  ('2099-12-01', '2099-11-24', 'OPEN'),
  ('2099-12-02', '2099-11-25', 'OPEN'),
  ('2099-12-03', '2099-11-26', 'OPEN'),
  ('2099-12-04', '2099-11-27', 'OPEN'),
  ('2099-12-05', '2099-11-28', 'CONFIRMED'),
  ('2099-12-06', '2099-11-29', 'CANCELLED');

-- =====================================================================
-- AC1 기능: admin은 positions를 직접 CRUD할 수 있고 비관리자는 거부된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
    values ('임시허브포지션', 1, 'any', false, true)$$,
  'AC1: admin은 positions에 직접 insert할 수 있다'
);
select lives_ok(
  $$update positions set default_required_count = 2 where name = '임시허브포지션'$$,
  'AC1: admin은 positions를 직접 update할 수 있다'
);
select lives_ok(
  $$delete from positions where name = '임시허브포지션'$$,
  'AC1: admin은 positions를 직접 delete할 수 있다(미사용 포지션)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
    values ('비관리자포지션', 1, 'any', false, true)$$,
  '42501',
  null,
  'AC1 권한: 비관리자(active 근무자)의 positions insert는 42501로 거부된다'
);
reset role;

-- =====================================================================
-- AC1 경계값: schedule_position_requirements.required_count CHECK
-- =====================================================================

select throws_ok(
  $$insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (
      (select id from schedules where work_date = '2099-12-01'),
      (select id from positions where name = '팀장'),
      -1
    )$$,
  '23514',
  null,
  'AC1 경계값: required_count 음수는 CHECK가 거부한다'
);
select lives_ok(
  $$insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (
      (select id from schedules where work_date = '2099-12-06'),
      (select id from positions where name = '팀장'),
      0
    )$$,
  'AC1 경계값: required_count 0은 허용된다(직접 insert 경로에도 적용)'
);
select lives_ok(
  $$delete from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-06')$$,
  'AC1 경계값 정리: 취소 스케줄용 임시 행을 되돌린다'
);

-- =====================================================================
-- AC2: copy_schedule_requirements
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-01'))$$,
  '42501',
  null,
  'AC2 권한: 비관리자(active 근무자)의 copy_schedule_requirements는 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select copy_schedule_requirements('00000000-0000-0000-0000-000000000099'::uuid)$$,
  '22023',
  null,
  'AC2: 존재하지 않는 스케줄은 22023으로 거부된다'
);
select throws_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-06'))$$,
  'LB020',
  null,
  'AC2: CANCELLED 스케줄의 복사는 LB020으로 거부된다'
);
select lives_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-01'))$$,
  'AC2 happy path: OPEN 스케줄의 첫 복사가 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  9,
  'AC2: 활성 포지션 9개가 전부 복사된다'
);
select is(
  (
    select sum(required_count)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  (select sum(default_required_count)::int from positions where is_active),
  'AC2: 복사된 required_count 합이 활성 포지션의 기본 인원수 합과 같다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirements_copied'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  1,
  'AC2: 최초 복사로 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail ->> 'position_count' from scheduling_audit_logs
    where event = 'requirements_copied'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  '9',
  'AC2: 감사 detail의 position_count가 복사된 행 수와 같다'
);

-- =====================================================================
-- F-01·F-04: schedule_position_requirements 쓰기는 DEFINER 함수로만 허용된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select count(*) from schedule_position_requirements$$,
  'F-01: admin은 schedule_position_requirements를 select할 수 있다'
);
select throws_ok(
  $$insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (
      (select id from schedules where work_date = '2099-12-03'),
      (select id from positions where name = '팀장'),
      1
    )$$,
  '42501',
  null,
  'F-01: admin의 직접 insert는 42501로 거부된다(쓰기는 DEFINER 함수 경로만 허용)'
);
with attempted as (
  update schedule_position_requirements set required_count = 999
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '팀장')
    returning 1
)
select is(
  (select count(*)::int from attempted),
  0,
  'F-01: admin의 직접 update는 RLS가 대상 행을 걸러 0건 적용된다(확정·취소 잠금·감사 우회 방지)'
);
with attempted as (
  delete from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '팀장')
    returning 1
)
select is(
  (select count(*)::int from attempted),
  0,
  'F-01: admin의 직접 delete는 RLS가 대상 행을 걸러 0건 적용된다(확정·취소 잠금·감사 우회 방지)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select 1 from schedule_position_requirements$$,
  'F-04: 비관리자(active 근무자)는 schedule_position_requirements를 읽을 수 없다'
);
select throws_ok(
  $$insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (
      (select id from schedules where work_date = '2099-12-03'),
      (select id from positions where name = '팀장'),
      1
    )$$,
  '42501',
  null,
  'F-04: 비관리자의 schedule_position_requirements insert는 42501로 거부된다'
);
with attempted as (
  update schedule_position_requirements set required_count = 999
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '팀장')
    returning 1
)
select is(
  (select count(*)::int from attempted),
  0,
  'F-04: 비관리자의 schedule_position_requirements update는 0건 적용된다'
);
with attempted as (
  delete from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '팀장')
    returning 1
)
select is(
  (select count(*)::int from attempted),
  0,
  'F-04: 비관리자의 schedule_position_requirements delete는 0건 적용된다'
);
reset role;

set local role anon;
select is_empty(
  $$select 1 from schedule_position_requirements$$,
  'F-04: anon은 schedule_position_requirements를 읽을 수 없다'
);
select throws_ok(
  $$insert into schedule_position_requirements (schedule_id, position_id, required_count)
    values (
      (select id from schedules where work_date = '2099-12-03'),
      (select id from positions where name = '팀장'),
      1
    )$$,
  '42501',
  null,
  'F-04: anon의 schedule_position_requirements insert는 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-01'))$$,
  'AC2 중복 요청·동시성: 재호출(on conflict 단일 생성 경로)도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  9,
  'AC2 멱등: 재호출로 행 수가 늘지 않는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirements_copied'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
  ),
  1,
  'AC2 멱등: 재호출로 감사가 추가되지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-02'))$$,
  'AC2: 두 번째 OPEN 스케줄도 복사할 수 있다(AC4 복수 반영 픽스처)'
);
select throws_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-05'))$$,
  'LB020',
  null,
  'AC2(revision 3): CONFIRMED 스케줄의 복사는 LB020으로 거부된다(확정 스케줄은 자동으로 표를 만들지 않는다)'
);
reset role;

-- =====================================================================
-- AC3: set_position_requirement / remove_position_requirement
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '팀장'), 3
  )$$,
  '42501',
  null,
  'AC3 권한: 비관리자의 set_position_requirement는 42501로 거부된다'
);
select throws_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '스캔')
  )$$,
  '42501',
  null,
  'AC3 권한: 비관리자의 remove_position_requirement는 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select set_position_requirement(
    '00000000-0000-0000-0000-000000000098'::uuid,
    (select id from positions where name = '팀장'), 3
  )$$,
  '22023',
  null,
  'AC3: 존재하지 않는 스케줄에 대한 set_position_requirement는 22023으로 거부된다'
);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-05'),
    (select id from positions where name = '팀장'), 3
  )$$,
  'LB020',
  null,
  'AC3: CONFIRMED 스케줄의 set_position_requirement는 LB020으로 거부된다'
);
select throws_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2099-12-05'),
    (select id from positions where name = '팀장')
  )$$,
  'LB020',
  null,
  'AC3: CONFIRMED 스케줄의 remove_position_requirement는 LB020으로 거부된다'
);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-06'),
    (select id from positions where name = '팀장'), 3
  )$$,
  'LB020',
  null,
  'AC3: CANCELLED 스케줄의 set_position_requirement는 LB020으로 거부된다(표 유무와 무관)'
);
select throws_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2099-12-06'),
    (select id from positions where name = '팀장')
  )$$,
  'LB020',
  null,
  'AC3: CANCELLED 스케줄의 remove_position_requirement는 LB020으로 거부된다(표 유무와 무관)'
);

select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '팀장'), 3
  )$$,
  'AC3 happy path: 기존 행의 필요 인원 수정이 성공한다'
);
reset role;

select is(
  (
    select required_count from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '팀장')
  ),
  3,
  'AC3: 팀장 필요 인원이 3으로 갱신됐다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'requirement_set'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '팀장')
    order by seq desc limit 1
  ),
  jsonb_build_object(
    'position_id', (select id from positions where name = '팀장'), 'previous_count', 1, 'new_count', 3
  ),
  'F-05: 수정 감사 detail에 변경 전(1)·후(3) 값이 병기된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '팀장'), 3
  )$$,
  'AC3 중복 요청: 같은 값 재저장도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirement_set'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '팀장')
  ),
  1,
  'AC3 멱등: 같은 값 재저장은 감사 행을 추가하지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '드레스'), 0
  )$$,
  'AC3 경계값: 필요 인원 0은 허용된다(그날 미운영)'
);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '드레스'), -1
  )$$,
  '22023',
  null,
  'AC3 경계값: 음수 필요 인원은 22023으로 거부된다'
);
reset role;

select is(
  (
    select required_count from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '드레스')
  ),
  0,
  'AC3: 거부된 음수 시도는 값을 바꾸지 못하고 0으로 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '스캔')
  )$$,
  'AC3 happy path: 행 삭제가 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '스캔')
  ),
  0,
  'AC3: 삭제된 행은 표에서 사라진다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'requirement_removed'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '스캔')
  ),
  jsonb_build_object(
    'position_id', (select id from positions where name = '스캔'), 'previous_count', 1, 'new_count', null
  ),
  'F-05: 삭제 감사 detail에 삭제 전 값(1)이 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '스캔')
  )$$,
  'AC3 멱등: 이미 삭제된 행을 다시 삭제해도 성공한다(no-op)'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirement_removed'
      and schedule_id = (select id from schedules where work_date = '2099-12-01')
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '스캔')
  ),
  1,
  'AC3 멱등: 재삭제는 감사 행을 추가하지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '스캔'), 2
  )$$,
  'AC3: 삭제 후 재설정은 신규 행 추가 경로로 성공한다'
);
insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('비활성요건포지션', 1, 'any', false, false);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2099-12-01'),
    (select id from positions where name = '비활성요건포지션'), 1
  )$$,
  '22023',
  null,
  'AC3 주요 실패: 비활성 포지션은 새 행으로 추가할 수 없다'
);
reset role;

select is(
  (
    select required_count from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '스캔')
  ),
  2,
  'AC3: 재설정된 스캔 필요 인원이 2로 저장됐다'
);

-- =====================================================================
-- AC4 픽스처: CONFIRMED 스케줄에 표를 직접 만든다
-- (revision 3부터 copy_schedule_requirements가 CONFIRMED를 거부해 더는 복사로
-- 표를 만들 수 없다 — 트리거의 CONFIRMED 제외 분기를 "표 보유" 상태에서도
-- 검증하려면 raw insert로 그 상태를 직접 시뮬레이션해야 한다)
-- =====================================================================

insert into schedule_position_requirements (schedule_id, position_id, required_count)
values (
  (select id from schedules where work_date = '2099-12-05'),
  (select id from positions where name = '팀장'),
  1
);

-- =====================================================================
-- AC4: positions insert 트리거의 확정 전·표 보유 스케줄 자동 반영
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
    values ('신규활성포지션', 4, 'any', false, true)$$,
  'AC4: 신규 활성 포지션 추가가 성공한다'
);
reset role;

select is(
  (
    select required_count from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-01')
      and position_id = (select id from positions where name = '신규활성포지션')
  ),
  4,
  'AC4: 표를 보유한 첫 번째 OPEN 스케줄에 기본 인원수로 자동 반영된다'
);
select is(
  (
    select required_count from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-02')
      and position_id = (select id from positions where name = '신규활성포지션')
  ),
  4,
  'AC4: 표를 보유한 두 번째 OPEN 스케줄에도 자동 반영된다'
);
select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-05')
      and position_id = (select id from positions where name = '신규활성포지션')
  ),
  0,
  'AC4 주요 실패: CONFIRMED 스케줄은 표를 갖고 있어도 자동 반영에서 제외된다'
);
select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-03')
  ),
  0,
  'AC4 경계값: 표가 없는 스케줄은 여전히 표가 없다(미반영)'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirement_position_added'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '신규활성포지션')
  ),
  2,
  'AC4: 표를 보유한 스케줄 수만큼(2건) 감사가 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
    values ('신규비활성포지션', 5, 'any', false, false)$$,
  'AC4 경계값: 신규 비활성 포지션 추가가 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from schedule_position_requirements
    where position_id = (select id from positions where name = '신규비활성포지션')
  ),
  0,
  'AC4 경계값: 비활성 포지션은 어떤 스케줄에도 반영되지 않는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirement_position_added'
      and (detail ->> 'position_id')::uuid = (select id from positions where name = '신규비활성포지션')
  ),
  0,
  'AC4 경계값: 비활성 포지션 추가는 감사도 남기지 않는다'
);

-- =====================================================================
-- 삭제 판정: position_id FK restrict
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$delete from positions where name = '매니저'$$,
  '23503',
  null,
  '삭제 판정: 필요 인원 표에서 쓰이는 포지션 delete는 23503으로 차단된다'
);
select lives_ok(
  $$delete from positions where name = '비활성요건포지션'$$,
  '삭제 판정: 어떤 표에도 없는(미사용) 포지션 delete는 허용된다'
);
reset role;

-- =====================================================================
-- AC2 경계값: 활성 포지션이 0개면 빈 표가 만들어진다
-- =====================================================================

alter table positions disable trigger positions_protect_system_update;
update positions set is_active = false;
alter table positions enable trigger positions_protect_system_update;

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select copy_schedule_requirements((select id from schedules where work_date = '2099-12-04'))$$,
  'AC2 경계값: 활성 포지션이 0개여도 복사 호출 자체는 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2099-12-04')
  ),
  0,
  'AC2 경계값: 활성 포지션이 0개면 표가 빈 채로 만들어진다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'requirements_copied'
      and schedule_id = (select id from schedules where work_date = '2099-12-04')
  ),
  0,
  'AC2 경계값: 빈 복사는 감사를 남기지 않는다'
);

select * from finish();
rollback;
