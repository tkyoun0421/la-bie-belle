begin;
select plan(91);

-- =====================================================================
-- 스키마: 신규 함수 시그니처·동시성 관례
-- =====================================================================

select has_function(
  'public', 'bump_confirmed_revision', array['uuid', 'text', 'jsonb', 'jsonb'],
  'bump_confirmed_revision(uuid, text, jsonb, jsonb) exists'
);
select has_function(
  'public', 'cancel_confirmed_schedule', array['uuid'], 'cancel_confirmed_schedule(uuid) exists'
);
select ok(
  pg_get_functiondef('cancel_confirmed_schedule(uuid)'::regprocedure) ~* 'for update',
  '동시성: cancel_confirmed_schedule 정의가 for update 잠금을 사용한다'
);

-- =====================================================================
-- P3-T08 backlog 흡수(F-06): bump_confirmed_revision 회수·cancel_confirmed_schedule 부여 회귀
-- =====================================================================

select ok(
  not has_function_privilege(
    'authenticated', 'bump_confirmed_revision(uuid, text, jsonb, jsonb)', 'execute'
  ),
  'P3-T08 F-06: authenticated는 bump_confirmed_revision 실행 권한이 없다(내부 전용)'
);
select ok(
  not has_function_privilege(
    'service_role', 'bump_confirmed_revision(uuid, text, jsonb, jsonb)', 'execute'
  ),
  'P3-T08 F-06: service_role도 bump_confirmed_revision 실행 권한이 없다(전 롤 회수)'
);
select ok(
  has_function_privilege('authenticated', 'cancel_confirmed_schedule(uuid)', 'execute'),
  'P3-T08 F-06: authenticated는 cancel_confirmed_schedule 실행 권한을 가진다'
);

-- =====================================================================
-- 픽스처: 관리자·비관리자·정식/교육 근무자 8명, CONFIRMED 스케줄 6종 + 상태별 3종
-- =====================================================================

insert into auth.users (id, email) values
  ('23000000-0000-0000-0000-000000000001', 'pcc-admin@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000002', 'pcc-regular-a@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000003', 'pcc-regular-b@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000004', 'pcc-trainee-c@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000005', 'pcc-wageless-assignee@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000006', 'pcc-wageless-trainee@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000007', 'pcc-resnapshot@labiebelle.test'),
  ('23000000-0000-0000-0000-000000000008', 'pcc-nonadmin@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '23000000-0000-0000-0000-000000000001', '변경관리자', '01094000001', 'male', '1985-01-01',
    'active', now(), null
  ),
  (
    '23000000-0000-0000-0000-000000000002', '정식A', '01094000002', 'female', '1990-01-01',
    'active', now(), 13000
  ),
  (
    '23000000-0000-0000-0000-000000000003', '정식B', '01094000003', 'male', '1991-01-01',
    'active', now(), 14000
  ),
  (
    '23000000-0000-0000-0000-000000000004', '교육C', '01094000004', 'female', '1992-01-01',
    'active', now(), 15000
  ),
  (
    '23000000-0000-0000-0000-000000000005', '시급없음배정', '01094000005', 'male', '1993-01-01',
    'active', now(), null
  ),
  (
    '23000000-0000-0000-0000-000000000006', '시급없음교육', '01094000006', 'female', '1994-01-01',
    'active', now(), null
  ),
  (
    '23000000-0000-0000-0000-000000000007', '재배정자', '01094000007', 'male', '1995-01-01',
    'active', now(), 16000
  ),
  (
    '23000000-0000-0000-0000-000000000008', '변경비관리자', '01094000008', 'female', '1996-01-01',
    'active', now(), 13000
  );

insert into public.profile_roles (profile_id, role, granted_by) values
  ('23000000-0000-0000-0000-000000000001', 'admin', null);

insert into schedules (work_date, application_deadline, status) values
  ('2097-10-01', '2097-09-24', 'CONFIRMED'),
  ('2097-10-02', '2097-09-25', 'CONFIRMED'),
  ('2097-10-03', '2097-09-26', 'CONFIRMED'),
  ('2097-10-04', '2097-09-27', 'CONFIRMED'),
  ('2097-10-05', '2097-09-28', 'CONFIRMED'),
  ('2097-10-06', '2097-09-29', 'CONFIRMED'),
  ('2097-10-07', '2097-09-30', 'OPEN'),
  ('2097-10-08', '2097-10-01', 'CLOSED'),
  ('2097-10-09', '2097-10-02', 'PREPARING'),
  ('2097-10-10', '2097-10-03', 'CONFIRMED');

-- cf-happy(01): ceremonies 10:00·11:00, planned 09:00-18:00, 요건 매니저2·축가1,
-- 배정 정식A@매니저(스냅샷 13000)
insert into ceremonies (schedule_id, starts_at)
select (select id from schedules where work_date = '2097-10-01'), t
  from unnest(array['10:00'::time, '11:00'::time]) as t;

update schedules
  set planned_checkin = '09:00', planned_checkout = '18:00'
  where work_date = '2097-10-01';

insert into schedule_position_requirements (schedule_id, position_id, required_count) values
  (
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '매니저'), 2
  ),
  (
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '축가'), 1
  );

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2097-10-01'),
    '23000000-0000-0000-0000-000000000002', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2097-10-01')
        and profile_id = '23000000-0000-0000-0000-000000000002'
    ),
    (select id from positions where name = '매니저')
  );

-- cf-single-ceremony(02): 예식 1개뿐
insert into ceremonies (schedule_id, starts_at)
values ((select id from schedules where work_date = '2097-10-02'), '10:00');

-- cf-single-requirement(03): 필요 인원 행 1개뿐
insert into schedule_position_requirements (schedule_id, position_id, required_count)
values (
  (select id from schedules where work_date = '2097-10-03'),
  (select id from positions where name = '매니저'), 1
);

-- cf-wageless(04): 시급 없는 근무자 추가 시도용, 요건 매니저1·축가1
insert into schedule_position_requirements (schedule_id, position_id, required_count) values
  (
    (select id from schedules where work_date = '2097-10-04'),
    (select id from positions where name = '매니저'), 1
  ),
  (
    (select id from schedules where work_date = '2097-10-04'),
    (select id from positions where name = '축가'), 1
  );

-- cf-resnapshot(05): 재배정자@매니저(스냅샷 16000)
insert into schedule_position_requirements (schedule_id, position_id, required_count)
values (
  (select id from schedules where work_date = '2097-10-05'),
  (select id from positions where name = '매니저'), 1
);

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2097-10-05'),
    '23000000-0000-0000-0000-000000000007', 16000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2097-10-05')
        and profile_id = '23000000-0000-0000-0000-000000000007'
    ),
    (select id from positions where name = '매니저')
  );

-- cf-cancel(06): 정식A@매니저(스냅샷 13000)·교육C@축가(스냅샷 15000)
insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2097-10-06'),
    '23000000-0000-0000-0000-000000000002', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2097-10-06')
        and profile_id = '23000000-0000-0000-0000-000000000002'
    ),
    (select id from positions where name = '매니저')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2097-10-06'),
    (select id from positions where name = '축가'),
    '23000000-0000-0000-0000-000000000004', 15000
  );

-- =====================================================================
-- cf-happy: 변경 5회+재저장 5회+제거 1회가 revision을 1→12로 누적 증가시킨다(AC1)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);

-- 1. 예식 교체(변경) — 첫 RED→GREEN 쌍의 표적
select lives_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2097-10-01'),
    array['10:00','11:00','12:00']::time[]
  )$$,
  'AC1: CONFIRMED 스케줄의 예식 교체(변경)가 성공한다'
);
select is(
  (select count(*)::int from ceremonies where schedule_id = (select id from schedules where work_date = '2097-10-01')),
  3,
  'AC1: 예식이 3개로 늘었다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  2,
  'AC1: 예식 교체 성공 1회로 revision이 1에서 2로 오른다'
);
reset role;
select is(
  (
    select detail from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and event = 'schedule_revised'
    order by seq desc limit 1
  ),
  jsonb_build_object(
    'section', 'ceremonies',
    'before', jsonb_build_object('ceremony_times', jsonb_build_array('10:00', '11:00')),
    'after', jsonb_build_object('ceremony_times', jsonb_build_array('10:00', '11:00', '12:00')),
    'revision', 2
  ),
  'AC1: schedule_revised 감사 detail이 section·전후 값·새 revision을 값으로 담는다'
);
select is(
  (
    select actor_profile_id from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and event = 'schedule_revised'
    order by seq desc limit 1
  ),
  '23000000-0000-0000-0000-000000000001',
  'P3-T08: schedule_revised 감사의 actor_profile_id가 호출 관리자다'
);

-- 2. 예식 동일 내용 재저장(중복 요청)도 revision을 올린다
set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2097-10-01'),
    array['10:00','11:00','12:00']::time[]
  )$$,
  'AC1 중복 요청: 동일 내용 예식 재저장도 성공한다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  3,
  'AC1 중복 요청: 동일 내용 재저장도 저장 1회로 revision이 3으로 오른다(멱등 아님이 계약)'
);
reset role;
select is(
  (
    select detail from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and event = 'schedule_revised'
    order by seq desc limit 1
  ),
  jsonb_build_object(
    'section', 'ceremonies',
    'before', jsonb_build_object('ceremony_times', jsonb_build_array('10:00', '11:00', '12:00')),
    'after', jsonb_build_object('ceremony_times', jsonb_build_array('10:00', '11:00', '12:00')),
    'revision', 3
  ),
  'AC1 중복 요청: 재저장 감사는 전후 값이 같아도 남는다'
);

-- 3. 예정 시각 변경
set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2097-10-01'), '09:00'::time, '18:30'::time
  )$$,
  'AC1: CONFIRMED 스케줄의 예정 시각 변경이 성공한다'
);
select is(
  (select planned_checkout from schedules where work_date = '2097-10-01'),
  '18:30'::time,
  'AC1: 예정 퇴근이 18:30으로 갱신됐다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  4,
  'AC1: 예정 시각 변경 성공으로 revision이 4로 오른다'
);

-- 4. 예정 시각 동일 내용 재저장
select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2097-10-01'), '09:00'::time, '18:30'::time
  )$$,
  'AC1 중복 요청: 동일 예정 시각 재저장도 성공한다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  5,
  'AC1 중복 요청: 예정 시각 재저장도 revision을 5로 올린다'
);

-- 5. 필요 인원 새 행 추가(스캔)
select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '스캔'), 1
  )$$,
  'AC1: CONFIRMED 스케줄에 새 필요 인원 행 추가가 성공한다'
);
select is(
  (
    select required_count from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and position_id = (select id from positions where name = '스캔')
  ),
  1,
  'AC1: 스캔 필요 인원 행이 1로 생성됐다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  6,
  'AC1: 필요 인원 추가 성공으로 revision이 6으로 오른다'
);

-- 6. 필요 인원 동일 값 재저장
select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '스캔'), 1
  )$$,
  'AC1 중복 요청: 동일 필요 인원 재저장도 성공한다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  7,
  'AC1 중복 요청: 필요 인원 재저장도 revision을 7로 올린다'
);

-- 7. 배정 추가(정식B@매니저) — 스냅샷 즉시 찍힘(AC3)
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '매니저'),
    array[
      '23000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000003'
    ]::uuid[]
  )$$,
  'AC1·AC3: CONFIRMED 스케줄에 정식B 배정 추가가 성공한다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and profile_id = '23000000-0000-0000-0000-000000000003'
  ),
  14000,
  'AC3: 확정 후 추가된 정식B의 스냅샷이 추가 당시 시급 14000과 일치한다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and profile_id = '23000000-0000-0000-0000-000000000002'
  ),
  13000,
  'AC3: 기존 정식A의 스냅샷은 이 저장으로 바뀌지 않는다(여전히 13000)'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  8,
  'AC1: 배정 추가 성공으로 revision이 8로 오른다'
);

-- 7b. 겸직 추가(정식A@축가) — 사람 단위 스냅샷은 재기록되지 않는다(AC3 경계값)
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '축가'),
    array['23000000-0000-0000-0000-000000000002']::uuid[]
  )$$,
  'AC3 경계값: 정식A를 두 번째 포지션(축가)에도 겸직 배정한다'
);
select is(
  (
    select count(*)::int from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and profile_id = '23000000-0000-0000-0000-000000000002'
  ),
  1,
  'AC3 경계값: 겸직자의 assignments 행은 여전히 하나다(사람 단위)'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and profile_id = '23000000-0000-0000-0000-000000000002'
  ),
  13000,
  'AC3 경계값: 겸직 추가는 이미 있는 스냅샷을 재기록하지 않는다(여전히 13000)'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  9,
  'AC1: 겸직 추가 성공으로 revision이 9로 오른다'
);

-- 8. 매니저 배정 동일 내용 재저장(중복 요청)
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '매니저'),
    array[
      '23000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000003'
    ]::uuid[]
  )$$,
  'AC1 중복 요청: 동일 배정 재저장도 성공한다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  10,
  'AC1 중복 요청: 배정 재저장도 revision을 10으로 올린다'
);

-- 9. 축가에 교육생 추가(정식A는 유지)
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '축가'),
    array['23000000-0000-0000-0000-000000000002']::uuid[],
    array['23000000-0000-0000-0000-000000000004']::uuid[]
  )$$,
  'AC1·AC3: CONFIRMED 스케줄에 교육생 추가가 성공한다'
);
select is(
  (
    select hourly_wage_snapshot from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and profile_id = '23000000-0000-0000-0000-000000000004'
  ),
  15000,
  'AC3: 확정 후 추가된 교육C의 스냅샷이 추가 당시 시급 15000과 일치한다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  11,
  'AC1: 교육생 추가 성공으로 revision이 11로 오른다'
);

-- 10. 필요 인원 행 삭제(2개 중 1개, 마지막 아님)
select lives_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2097-10-01'),
    (select id from positions where name = '스캔')
  )$$,
  'AC1·AC2 경계값: 필요 인원 3행 중 1행(스캔) 삭제는 마지막이 아니라 성공한다'
);
select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
  ),
  2,
  'AC2 경계값: 매니저·축가 2행이 남는다'
);
select is(
  (select revision from schedules where work_date = '2097-10-01'),
  12,
  'AC1: 필요 인원 삭제 성공으로 revision이 12로 오른다'
);

-- 11. 확정 후 시급 변경은 이미 찍힌 스냅샷을 바꾸지 않는다(AC3)
select lives_ok(
  $$select set_hourly_wage('23000000-0000-0000-0000-000000000003', 20000)$$,
  'AC3: 확정 후 관리자가 정식B의 시급을 20000으로 바꾼다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and profile_id = '23000000-0000-0000-0000-000000000003'
  ),
  14000,
  'AC3: 확정 후 시급 변경은 정식B의 스냅샷을 바꾸지 않는다(여전히 14000)'
);
reset role;

-- =====================================================================
-- AC6: get_confirmed_roster가 누적된 revision과 최종 변경 시각을 반환한다
-- =====================================================================

select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000002', true);
select is(
  (
    (select get_confirmed_roster((select id from schedules where work_date = '2097-10-01')) ->> 'revision')::int
  ),
  12,
  'AC6: get_confirmed_roster가 누적 revision 12를 반환한다'
);
select is(
  (
    (select get_confirmed_roster((select id from schedules where work_date = '2097-10-01')) ->> 'revised_at')::timestamptz
  ),
  (
    select created_at from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-01')
      and event = 'schedule_revised'
    order by seq desc limit 1
  ),
  'AC6: get_confirmed_roster의 revised_at이 최신 schedule_revised 감사 시각과 값으로 일치한다'
);

-- =====================================================================
-- AC2: 구조 보증 — 예식 0개(LB033)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2097-10-02'), array[]::time[]
  )$$,
  'LB033',
  '확정된 스케줄에는 예식이 하나 이상 필요해요',
  'AC2: CONFIRMED 스케줄에서 예식을 0개로 만드는 교체는 LB033으로 거부된다'
);
select is(
  (select count(*)::int from ceremonies where schedule_id = (select id from schedules where work_date = '2097-10-02')),
  1,
  'AC2 원자성: LB033 거부 뒤에도 예식은 1개 그대로다'
);
select is(
  (select revision from schedules where work_date = '2097-10-02'),
  1,
  'AC2 원자성: LB033 거부 뒤에도 revision은 그대로다'
);
select lives_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2097-10-02'), array['11:00']::time[]
  )$$,
  'AC2 경계값: 예식 1개를 남기는 교체는 통과한다'
);
select is(
  (select revision from schedules where work_date = '2097-10-02'),
  2,
  'AC2 경계값: 통과한 교체는 revision을 2로 올린다'
);
reset role;

-- =====================================================================
-- AC2: 구조 보증 — 마지막 필요 인원 행 삭제(LB034)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2097-10-03'),
    (select id from positions where name = '매니저')
  )$$,
  'LB034',
  '확정된 스케줄에는 필요 인원 표가 필요해요',
  'AC2: CONFIRMED 스케줄에서 마지막 필요 인원 행 삭제는 LB034로 거부된다'
);
reset role;

select is(
  (
    select count(*)::int from schedule_position_requirements
    where schedule_id = (select id from schedules where work_date = '2097-10-03')
  ),
  1,
  'AC2 원자성: LB034 거부 뒤에도 필요 인원 행은 1개 그대로다'
);
select is(
  (select revision from schedules where work_date = '2097-10-03'),
  1,
  'AC2 원자성: LB034 거부 뒤에도 revision은 그대로다'
);

-- =====================================================================
-- AC2: 구조 보증 — 시급 미설정 근무자 추가(LB030 재사용)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-04'),
    (select id from positions where name = '매니저'),
    array['23000000-0000-0000-0000-000000000005']::uuid[]
  )$$,
  'LB030',
  '시급이 설정되지 않은 근무자가 있어요',
  'AC2: CONFIRMED 스케줄에 시급 미설정 정식 배정 추가는 LB030으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-04'),
    (select id from positions where name = '축가'),
    array[]::uuid[],
    array['23000000-0000-0000-0000-000000000006']::uuid[]
  )$$,
  'LB030',
  '시급이 설정되지 않은 근무자가 있어요',
  'AC2: CONFIRMED 스케줄에 시급 미설정 교육생 추가는 LB030으로 거부된다'
);
reset role;

select is(
  (
    select count(*)::int from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-04')
      and profile_id = '23000000-0000-0000-0000-000000000005'
  ),
  0,
  'AC2 원자성: LB030 거부 뒤 시급없음배정의 assignments 행이 생기지 않았다'
);
select is(
  (
    select count(*)::int from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2097-10-04')
      and profile_id = '23000000-0000-0000-0000-000000000006'
  ),
  0,
  'AC2 원자성: LB030 거부 뒤 시급없음교육의 assignment_trainees 행이 생기지 않았다'
);
select is(
  (select revision from schedules where work_date = '2097-10-04'),
  1,
  'AC2 원자성: 두 LB030 거부 뒤에도 revision은 그대로다'
);

-- =====================================================================
-- AC3 경계값: 제거→재추가된 행은 재추가 시점의 시급으로 새로 찍힌다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-05'),
    (select id from positions where name = '매니저'),
    array[]::uuid[]
  )$$,
  'AC3 준비: 재배정자를 매니저에서 제거한다'
);
reset role;

select is(
  (
    select count(*)::int from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-05')
      and profile_id = '23000000-0000-0000-0000-000000000007'
  ),
  0,
  'AC3 준비: 제거 후 재배정자의 assignments 행이 사라졌다'
);
select is(
  (select revision from schedules where work_date = '2097-10-05'),
  2,
  'AC1: 배정 제거 성공으로 revision이 2로 오른다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_hourly_wage('23000000-0000-0000-0000-000000000007', 20000)$$,
  'AC3 준비: 제거된 재배정자의 시급을 20000으로 바꾼다'
);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-05'),
    (select id from positions where name = '매니저'),
    array['23000000-0000-0000-0000-000000000007']::uuid[]
  )$$,
  'AC3: 재배정자를 매니저에 재추가한다'
);
reset role;

select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-05')
      and profile_id = '23000000-0000-0000-0000-000000000007'
  ),
  20000,
  'AC3 경계값: 재추가된 행은 이전 스냅샷(16000)이 아닌 재추가 시점 시급 20000으로 새로 찍힌다'
);
select is(
  (select revision from schedules where work_date = '2097-10-05'),
  3,
  'AC1: 재추가 성공으로 revision이 3으로 오른다'
);

-- =====================================================================
-- AC4: 확정 후 취소 — 전이·보존·감사
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2097-10-06'))$$,
  'AC4 happy path: CONFIRMED 스케줄의 취소가 성공한다'
);
reset role;

select is(
  (select status from schedules where work_date = '2097-10-06'),
  'CANCELLED'::schedule_status,
  'AC4: 취소 후 상태가 CANCELLED다'
);
select is(
  (select revision from schedules where work_date = '2097-10-06'),
  1,
  'AC4: 취소는 revision을 올리지 않는다(저장 4종과 분리된 전이)'
);
select is(
  (
    select detail from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-06')
      and event = 'schedule_cancelled'
  ),
  jsonb_build_object('revision', 1, 'assigned_count', 1, 'trainee_count', 1),
  'AC4: schedule_cancelled 감사 detail이 당시 revision·배정·교육생 수를 값으로 담는다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2097-10-06')
      and profile_id = '23000000-0000-0000-0000-000000000002'
  ),
  13000,
  'AC4: 취소 후에도 정식A의 배정·스냅샷이 보존된다'
);
select is(
  (
    select hourly_wage_snapshot from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2097-10-06')
      and profile_id = '23000000-0000-0000-0000-000000000004'
  ),
  15000,
  'AC4: 취소 후에도 교육C의 교육 배정·스냅샷이 보존된다'
);

-- =====================================================================
-- AC4: 취소된 스케줄은 모든 수정·재확정·재취소를 거부한다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2097-10-06'), array['10:00']::time[]
  )$$,
  'LB020',
  null,
  'AC4: CANCELLED 스케줄의 예식 변경은 LB020으로 거부된다'
);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2097-10-06'), '09:00'::time, '18:00'::time
  )$$,
  'LB020',
  null,
  'AC4: CANCELLED 스케줄의 예정 시각 변경은 LB020으로 거부된다'
);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2097-10-06'),
    (select id from positions where name = '매니저'), 1
  )$$,
  'LB020',
  null,
  'AC4: CANCELLED 스케줄의 필요 인원 설정은 LB020으로 거부된다'
);
select throws_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2097-10-06'),
    (select id from positions where name = '매니저')
  )$$,
  'LB020',
  null,
  'AC4: CANCELLED 스케줄의 필요 인원 삭제는 LB020으로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-06'),
    (select id from positions where name = '매니저'),
    array[]::uuid[]
  )$$,
  'LB020',
  null,
  'AC4: CANCELLED 스케줄의 배정 변경은 LB020으로 거부된다'
);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2097-10-06'))$$,
  'LB029',
  '확정할 수 없는 상태예요',
  'AC4: CANCELLED 스케줄의 재확정 시도는 LB029로 거부된다'
);
select throws_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2097-10-06'))$$,
  'LB032',
  '취소할 수 없는 상태예요',
  'AC4: CANCELLED 스케줄의 재취소 시도는 LB032로 거부된다'
);
reset role;

-- =====================================================================
-- AC4: CONFIRMED가 아닌 상태의 취소 시도는 LB032로 거부된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2097-10-07'))$$,
  'LB032',
  '취소할 수 없는 상태예요',
  'AC4: OPEN 스케줄의 취소 시도는 LB032로 거부된다'
);
select throws_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2097-10-08'))$$,
  'LB032',
  '취소할 수 없는 상태예요',
  'AC4: CLOSED 스케줄의 취소 시도는 LB032로 거부된다'
);
select throws_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2097-10-09'))$$,
  'LB032',
  '취소할 수 없는 상태예요',
  'AC4: PREPARING 스케줄의 취소 시도는 LB032로 거부된다'
);
reset role;

-- =====================================================================
-- AC5: 비관리자는 6개 함수 모두 42501로 거부된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000008', true);
select throws_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2097-10-10'), array['10:00']::time[]
  )$$,
  '42501',
  null,
  'AC5: 비관리자의 replace_schedule_ceremonies는 42501로 거부된다'
);
select throws_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2097-10-10'), '09:00'::time, '18:00'::time
  )$$,
  '42501',
  null,
  'AC5: 비관리자의 set_schedule_planned_times는 42501로 거부된다'
);
select throws_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2097-10-10'),
    (select id from positions where name = '매니저'), 1
  )$$,
  '42501',
  null,
  'AC5: 비관리자의 set_position_requirement는 42501로 거부된다'
);
select throws_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2097-10-10'),
    (select id from positions where name = '매니저')
  )$$,
  '42501',
  null,
  'AC5: 비관리자의 remove_position_requirement는 42501로 거부된다'
);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-10'),
    (select id from positions where name = '매니저'),
    array[]::uuid[]
  )$$,
  '42501',
  null,
  'AC5: 비관리자의 replace_position_assignments는 42501로 거부된다'
);
select throws_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2097-10-10'))$$,
  '42501',
  null,
  'AC5: 비관리자의 cancel_confirmed_schedule은 42501로 거부된다'
);
reset role;

-- =====================================================================
-- P3-T11: CONFIRMED 스케줄에서도 비활성 포지션 축소는 성공하고 revision·감사가 따라온다
-- =====================================================================

insert into positions (name, default_required_count, gender_requirement, is_default, is_active)
values ('임시비활성확정축소포지션', 1, 'any', false, false);

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2097-10-10'),
    '23000000-0000-0000-0000-000000000002', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2097-10-10')
        and profile_id = '23000000-0000-0000-0000-000000000002'
    ),
    (select id from positions where name = '임시비활성확정축소포지션')
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2097-10-10'),
    (select id from positions where name = '임시비활성확정축소포지션'),
    array[]::uuid[]
  )$$,
  'P3-T11: CONFIRMED 스케줄의 비활성 포지션 전원 해제(축소)도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2097-10-10')
      and ap.position_id = (select id from positions where name = '임시비활성확정축소포지션')
  ),
  0,
  'P3-T11: CONFIRMED 스케줄에서도 비활성 포지션 축소 후 배정은 0명이다'
);
select is(
  (select revision from schedules where work_date = '2097-10-10'),
  2,
  'P3-T11: CONFIRMED 스케줄의 비활성 포지션 축소 성공은 revision을 1에서 2로 올린다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-10')
      and event = 'schedule_revised'
  ),
  1,
  'P3-T11: CONFIRMED 스케줄의 비활성 포지션 축소는 schedule_revised 감사를 함께 남긴다'
);
select is(
  (
    select detail ->> 'section' from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2097-10-10')
      and event = 'schedule_revised'
    order by seq desc limit 1
  ),
  'position_assignments',
  'P3-T11: 감사 detail의 section이 position_assignments다'
);

select * from finish();
rollback;
