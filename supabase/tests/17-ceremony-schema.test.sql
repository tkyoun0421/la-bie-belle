begin;
select plan(65);

-- =====================================================================
-- 스키마 노출: 테이블·컬럼·RLS·함수 시그니처
-- =====================================================================

select has_table('public', 'ceremonies', 'ceremonies table');
select col_is_pk('public', 'ceremonies', 'id', 'ceremonies pk');
select col_not_null('public', 'ceremonies', 'schedule_id', 'ceremonies.schedule_id not null');
select col_not_null('public', 'ceremonies', 'starts_at', 'ceremonies.starts_at not null');
select col_is_fk('public', 'ceremonies', 'schedule_id', 'ceremonies.schedule_id fk');
select col_type_is('public', 'ceremonies', 'starts_at', 'time without time zone', 'ceremonies.starts_at type');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ceremonies'::regclass),
  'ceremonies has row level security enabled'
);

select col_type_is(
  'public', 'schedules', 'planned_checkin', 'time without time zone', 'schedules.planned_checkin type'
);
select col_type_is(
  'public', 'schedules', 'planned_checkout', 'time without time zone', 'schedules.planned_checkout type'
);

select has_function(
  'public', 'replace_schedule_ceremonies', array['uuid', 'time[]'],
  'replace_schedule_ceremonies(uuid, time[]) exists'
);
select has_function(
  'public', 'set_schedule_planned_times', array['uuid', 'time', 'time'],
  'set_schedule_planned_times(uuid, time, time) exists'
);

select ok(
  has_function_privilege('authenticated', 'replace_schedule_ceremonies(uuid, time[])', 'execute'),
  'authenticated는 실행 권한이 있고 admin 여부는 함수 내부 is_admin이 강제한다'
);

select ok(
  pg_get_functiondef('replace_schedule_ceremonies(uuid, time[])'::regprocedure) ~* 'for update',
  '동시성: replace_schedule_ceremonies 정의가 for update 잠금을 사용한다'
);
select ok(
  pg_get_functiondef('set_schedule_planned_times(uuid, time, time)'::regprocedure) ~* 'for update',
  '동시성: set_schedule_planned_times 정의가 for update 잠금을 사용한다'
);

-- =====================================================================
-- 픽스처: 관리자·활성 근무자, 스케줄 4종(OPEN·PREPARING·CONFIRMED·CANCELLED)
-- =====================================================================

insert into auth.users (id, email) values
  ('17000000-0000-0000-0000-000000000001', 'ceremony-admin@labiebelle.test'),
  ('17000000-0000-0000-0000-000000000002', 'ceremony-worker@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('17000000-0000-0000-0000-000000000001', '예식관리자', '01070000001', 'male', '1985-01-01', 'active', now()),
  ('17000000-0000-0000-0000-000000000002', '예식근무자', '01070000002', 'female', '1990-02-02', 'active', now());

insert into public.profile_roles (profile_id, role, granted_by) values
  ('17000000-0000-0000-0000-000000000001', 'admin', null);

insert into schedules (work_date, application_deadline, status) values
  ('2099-11-01', '2099-10-25', 'OPEN'),
  ('2099-11-02', '2099-10-26', 'PREPARING'),
  ('2099-11-03', '2099-10-27', 'CONFIRMED'),
  ('2099-11-04', '2099-10-28', 'CANCELLED');

-- =====================================================================
-- AC3: check_in_rules 재사용 검증(기존 seed·유니크·admin CRUD)
-- =====================================================================

select is(
  (select count(*)::int from check_in_rules),
  2,
  'AC3: 기존 check_in_rules seed 2행이 그대로 유지된다'
);
select is(
  (select recommended_check_in from check_in_rules where first_ceremony_at = '10:00'),
  '08:20'::time,
  'AC3: 10:00 규칙의 추천 출근이 08:20으로 유지된다'
);
select is(
  (select recommended_check_in from check_in_rules where first_ceremony_at = '11:00'),
  '09:10'::time,
  'AC3: 11:00 규칙의 추천 출근이 09:10으로 유지된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in) values ('12:00', '10:10')$$,
  'AC3: admin은 check_in_rules에 직접 insert할 수 있다'
);
select lives_ok(
  $$update check_in_rules set recommended_check_in = '10:15' where first_ceremony_at = '12:00'$$,
  'AC3: admin은 check_in_rules를 직접 update할 수 있다'
);
select lives_ok(
  $$delete from check_in_rules where first_ceremony_at = '12:00'$$,
  'AC3: admin은 check_in_rules를 직접 delete할 수 있다'
);
select throws_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in) values ('10:00', '08:00')$$,
  '23505',
  null,
  'AC3 경계값: first_ceremony_at 유니크 위반은 23505로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select 1 from check_in_rules$$,
  'AC3 권한: 비관리자(active 근무자)는 check_in_rules를 읽을 수 없다'
);
select throws_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in) values ('13:00', '11:00')$$,
  '42501',
  null,
  'AC3 권한: 비관리자(active 근무자)의 check_in_rules insert는 42501로 거부된다'
);
reset role;

-- =====================================================================
-- AC1 happy path: 예식 생성·정렬·재저장
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select is(
  replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-01'),
    array['11:00', '10:00', '12:10']::time[]
  ),
  '{"changed": true, "ceremony_times": ["10:00", "11:00", "12:10"]}'::jsonb,
  'AC1 happy path: 뒤섞인 입력이 시각순으로 정렬되어 반환된다'
);
reset role;

-- scheduling_audit_logs는 admin에게도 select 정책이 없다(백엔드 전용) — 감사 확인은 postgres 세션(RLS 우회)에서 한다
select is(
  (
    select array_agg(starts_at order by starts_at)
    from ceremonies
    where schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  array['10:00', '11:00', '12:10']::time[],
  'AC1: ceremonies 테이블에 시각순으로 저장된다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'ceremonies_replaced'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  1,
  'AC1: 최초 저장으로 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'ceremonies_replaced'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
    order by seq
    limit 1
  ),
  '{"previous_ceremony_times": [], "new_ceremony_times": ["10:00", "11:00", "12:10"]}'::jsonb,
  'F-05: 최초 저장의 감사 detail에 이전(빈 배열)·새 예식 시각이 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select is(
  replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-01'),
    array['10:00', '11:00', '12:10']::time[]
  ),
  '{"changed": false, "ceremony_times": ["10:00", "11:00", "12:10"]}'::jsonb,
  'AC1 중복 요청: 같은 목록 재저장은 changed:false로 수렴한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'ceremonies_replaced'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  1,
  'AC1 멱등: 같은 목록 재저장은 감사 행을 추가하지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select is(
  replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-01'),
    array['12:10', '09:30']::time[]
  ),
  '{"changed": true, "ceremony_times": ["09:30", "12:10"]}'::jsonb,
  'AC1: 목록이 바뀌면 전체 교체되고 재정렬된다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'ceremonies_replaced'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  2,
  'AC1: 실제 변경 시에만 감사가 누적된다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'ceremonies_replaced'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
    order by seq desc
    limit 1
  ),
  '{"previous_ceremony_times": ["10:00", "11:00", "12:10"], "new_ceremony_times": ["09:30", "12:10"]}'::jsonb,
  'F-05: 두 번째 실제 변경의 감사 detail에 이전 목록(교체 전 값)이 남는다'
);

-- =====================================================================
-- AC1 경계값: 개수 1~12, 중복 거부
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-02'), array['09:00']::time[]
  )$$,
  'AC1 경계값: 예식 1개는 허용된다'
);
select lives_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-02'),
    array['01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00']::time[]
  )$$,
  'AC1 경계값: 예식 12개는 허용된다'
);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-02'), array[]::time[]
  )$$,
  '22023',
  null,
  'AC1 경계값: 예식 0개는 22023으로 거부된다'
);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-02'),
    array['01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00']::time[]
  )$$,
  '22023',
  null,
  'AC1 경계값: 예식 13개는 22023으로 거부된다'
);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-02'), array['10:00', '10:00']::time[]
  )$$,
  '22023',
  null,
  'AC1 경계값: 동시각 중복 예식은 22023으로 거부된다'
);
reset role;

-- =====================================================================
-- AC1 주요 실패: 상태 검증·존재하지 않는 스케줄
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-03'), array['10:00']::time[]
  )$$,
  'LB020',
  null,
  'AC1: CONFIRMED 스케줄의 예식 변경은 LB020으로 거부된다'
);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-04'), array['10:00']::time[]
  )$$,
  'LB020',
  null,
  'AC1: CANCELLED 스케줄의 예식 변경은 LB020으로 거부된다'
);
select throws_ok(
  $$select replace_schedule_ceremonies(
    '00000000-0000-0000-0000-000000000099'::uuid, array['10:00']::time[]
  )$$,
  '22023',
  null,
  'AC1: 존재하지 않는 스케줄은 22023으로 거부된다'
);
reset role;

-- =====================================================================
-- AC1 권한: 비관리자·anon 거부
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-01'), array['10:00']::time[]
  )$$,
  '42501',
  null,
  'AC1 권한: 비관리자(active 근무자)의 예식 교체는 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2099-11-01'), array['10:00']::time[]
  )$$,
  '42501',
  null,
  'AC1 권한: anon의 예식 교체는 42501로 거부된다'
);
reset role;

select is(
  (
    select array_agg(starts_at order by starts_at)
    from ceremonies
    where schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  array['09:30', '12:10']::time[],
  'AC1: 거부된 호출들은 예식 목록을 바꾸지 못했다'
);

-- =====================================================================
-- AC2 happy path·멱등·경계값·주요 실패·권한
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '08:20'::time, '15:30'::time
  )$$,
  'AC2 happy path: admin의 예정 시각 저장이 성공한다'
);
reset role;

select is(
  (select planned_checkin from schedules where work_date = '2099-11-01'),
  '08:20'::time,
  'AC2: planned_checkin이 저장됐다'
);
select is(
  (select planned_checkout from schedules where work_date = '2099-11-01'),
  '15:30'::time,
  'AC2: planned_checkout이 저장됐다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'planned_times_set'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  1,
  'AC2: 예정 시각 저장으로 감사가 정확히 1행 남는다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'planned_times_set'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
    order by seq
    limit 1
  ),
  '{"previous_checkin": null, "previous_checkout": null, "new_checkin": "08:20", "new_checkout": "15:30"}'::jsonb,
  'F-05: 최초 저장의 감사 detail에 이전(NULL)·새 예정 시각이 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '08:20'::time, '15:30'::time
  )$$,
  'AC2 중복 요청: 같은 값 재저장도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'planned_times_set'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  1,
  'AC2 멱등: 같은 값 재저장은 감사 행을 추가하지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '08:30'::time, '15:45'::time
  )$$,
  'AC2: 실제로 값이 바뀌는 재저장은 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from scheduling_audit_logs
    where event = 'planned_times_set'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
  ),
  2,
  'AC2: 실제 변경 시에만 감사가 누적된다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where event = 'planned_times_set'
      and schedule_id = (select id from schedules where work_date = '2099-11-01')
    order by seq desc
    limit 1
  ),
  '{"previous_checkin": "08:20", "previous_checkout": "15:30", "new_checkin": "08:30", "new_checkout": "15:45"}'::jsonb,
  'F-05: 두 번째 실제 변경의 감사 detail에 이전 값(교체 전 시각)이 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), null::time, '15:30'::time
  )$$,
  '22023',
  null,
  'F-02 경계값: checkin이 NULL이면 22023으로 거부된다(한쪽만 NULL 저장 방지)'
);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '08:20'::time, null::time
  )$$,
  '22023',
  null,
  'F-02 경계값: checkout이 NULL이면 22023으로 거부된다(한쪽만 NULL 저장 방지)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '15:30'::time, '08:20'::time
  )$$,
  '22023',
  null,
  'AC2 경계값: checkin >= checkout은 22023으로 거부된다'
);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '15:30'::time, '15:30'::time
  )$$,
  '22023',
  null,
  'AC2 경계값: checkin == checkout도 22023으로 거부된다'
);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-03'), '08:20'::time, '15:30'::time
  )$$,
  'LB020',
  null,
  'AC2: CONFIRMED 스케줄의 예정 시각 변경은 LB020으로 거부된다'
);
select throws_ok(
  $$select set_schedule_planned_times(
    '00000000-0000-0000-0000-000000000098'::uuid, '08:20'::time, '15:30'::time
  )$$,
  '22023',
  null,
  'AC2: 존재하지 않는 스케줄은 22023으로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '08:20'::time, '15:30'::time
  )$$,
  '42501',
  null,
  'AC2 권한: 비관리자(active 근무자)의 예정 시각 저장은 42501로 거부된다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2099-11-01'), '08:20'::time, '15:30'::time
  )$$,
  '42501',
  null,
  'AC2 권한: anon의 예정 시각 저장은 42501로 거부된다'
);
reset role;

select is(
  (select planned_checkin from schedules where work_date = '2099-11-01'),
  '08:30'::time,
  'AC2: 거부된 호출들은 planned_checkin을 바꾸지 못했다'
);

-- =====================================================================
-- F-02 회귀: DB 최종 경계 — 쌍 무결성·분 단위 강제(직접 쓰기 우회 방어)
-- =====================================================================

select throws_ok(
  $$update schedules set planned_checkin = '08:00'::time, planned_checkout = null
    where work_date = '2099-11-02'$$,
  '23514',
  null,
  'F-02: 예정 출근만 채우고 퇴근을 비우면 쌍 무결성 CHECK가 거부한다'
);
select throws_ok(
  $$insert into ceremonies (schedule_id, starts_at)
    values ((select id from schedules where work_date = '2099-11-02'), '10:00:30'::time)$$,
  '23514',
  null,
  'F-02: 초 단위 예식 시각은 분 단위 CHECK가 거부한다'
);
select throws_ok(
  $$update schedules set planned_checkin = '08:00:15'::time, planned_checkout = '15:00'::time
    where work_date = '2099-11-02'$$,
  '23514',
  null,
  'F-02: 초 단위 예정 출근은 분 단위 CHECK가 거부한다'
);

select * from finish();
rollback;
