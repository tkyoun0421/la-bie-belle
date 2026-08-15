begin;
select plan(44);

-- =====================================================================
-- 스키마 노출: 스냅샷 컬럼·confirm_schedule 함수 시그니처·동시성 관례
-- =====================================================================

select col_type_is(
  'public', 'assignments', 'hourly_wage_snapshot', 'integer', 'assignments.hourly_wage_snapshot type'
);
select col_type_is(
  'public', 'assignment_trainees', 'hourly_wage_snapshot', 'integer',
  'assignment_trainees.hourly_wage_snapshot type'
);
select has_function(
  'public', 'confirm_schedule', array['uuid'], 'confirm_schedule(uuid) exists'
);
select ok(
  pg_get_functiondef('confirm_schedule(uuid)'::regprocedure) ~* 'for update',
  '동시성: confirm_schedule 정의가 for update 잠금을 사용한다'
);

-- =====================================================================
-- 픽스처: 관리자·비관리자·정식/교육 근무자 8명, 스케줄 12종
-- =====================================================================

insert into auth.users (id, email) values
  ('21000000-0000-0000-0000-000000000001', 'cfm-admin@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000002', 'cfm-nonadmin@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000003', 'cfm-wageless-assignee@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000004', 'cfm-wageless-trainee@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000005', 'cfm-understaffed@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000006', 'cfm-no-manager-trainee@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000007', 'cfm-boundary-trainee@labiebelle.test'),
  ('21000000-0000-0000-0000-000000000008', 'cfm-joint@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '21000000-0000-0000-0000-000000000001', '확정관리자', '01092000001', 'male', '1985-01-01',
    'active', now(), null
  ),
  (
    '21000000-0000-0000-0000-000000000002', '확정비관리자', '01092000002', 'female', '1990-01-01',
    'active', now(), 13000
  ),
  (
    '21000000-0000-0000-0000-000000000003', '시급없음배정', '01092000003', 'male', '1994-01-01',
    'active', now(), null
  ),
  (
    '21000000-0000-0000-0000-000000000004', '시급없음교육', '01092000004', 'female', '1994-01-02',
    'active', now(), null
  ),
  (
    '21000000-0000-0000-0000-000000000005', '미달배정자', '01092000005', 'male', '1994-01-03',
    'active', now(), 13000
  ),
  (
    '21000000-0000-0000-0000-000000000006', '담당자없음교육', '01092000006', 'female', '1994-01-04',
    'active', now(), 15000
  ),
  (
    '21000000-0000-0000-0000-000000000007', '경계교육', '01092000007', 'male', '1994-01-05',
    'active', now(), 16000
  ),
  (
    '21000000-0000-0000-0000-000000000008', '겸직자', '01092000008', 'female', '1994-01-06',
    'active', now(), 17000
  );

insert into public.profile_roles (profile_id, role, granted_by) values
  ('21000000-0000-0000-0000-000000000001', 'admin', null);

insert into schedules (work_date, application_deadline, status) values
  ('2099-12-01', '2099-11-24', 'OPEN'),
  ('2099-12-02', '2099-11-25', 'OPEN'),
  ('2099-12-03', '2099-11-26', 'OPEN'),
  ('2099-12-04', '2099-11-27', 'OPEN'),
  ('2099-12-05', '2099-11-28', 'OPEN'),
  ('2099-12-06', '2099-11-29', 'OPEN'),
  ('2099-12-07', '2099-11-30', 'OPEN'),
  ('2099-12-08', '2099-12-01', 'OPEN'),
  ('2099-12-09', '2099-12-02', 'CLOSED'),
  ('2099-12-10', '2099-12-03', 'CONFIRMED'),
  ('2099-12-11', '2099-12-04', 'CANCELLED'),
  ('2099-12-12', '2099-12-05', 'OPEN');

-- 예식·예정 시각: BARE(12-01) 제외 전부. NOTIME(12-02)은 예식만.
insert into ceremonies (schedule_id, starts_at)
select id, '10:00'::time from schedules where work_date <> '2099-12-01';

update schedules
  set planned_checkin = '09:00', planned_checkout = '18:00'
  where work_date not in ('2099-12-01', '2099-12-02');

-- 필요 인원: NOREQ(12-03) 제외 전부.
insert into schedule_position_requirements (schedule_id, position_id, required_count) values
  (
    (select id from schedules where work_date = '2099-12-04'),
    (select id from positions where name = '매니저'), 2
  ),
  (
    (select id from schedules where work_date = '2099-12-05'),
    (select id from positions where name = '축가'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-06'),
    (select id from positions where name = '매니저'), 0
  ),
  (
    (select id from schedules where work_date = '2099-12-07'),
    (select id from positions where name = '매니저'), 2
  ),
  (
    (select id from schedules where work_date = '2099-12-07'),
    (select id from positions where name = '축가'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-07'),
    (select id from positions where name = '스캔'), 0
  ),
  (
    (select id from schedules where work_date = '2099-12-08'),
    (select id from positions where name = '매니저'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-08'),
    (select id from positions where name = '축가'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-09'),
    (select id from positions where name = '매니저'), 0
  ),
  (
    (select id from schedules where work_date = '2099-12-12'),
    (select id from positions where name = '매니저'), 0
  );

-- 배정·교육생: LB030(정식) 12-04, LB030(교육) 12-05, 경고 12-07, 겸직 12-08.
insert into assignments (schedule_id, profile_id) values
  (
    (select id from schedules where work_date = '2099-12-04'),
    '21000000-0000-0000-0000-000000000003'
  ),
  (
    (select id from schedules where work_date = '2099-12-07'),
    '21000000-0000-0000-0000-000000000005'
  ),
  (
    (select id from schedules where work_date = '2099-12-08'),
    '21000000-0000-0000-0000-000000000008'
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2099-12-04')
        and profile_id = '21000000-0000-0000-0000-000000000003'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2099-12-07')
        and profile_id = '21000000-0000-0000-0000-000000000005'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2099-12-08')
        and profile_id = '21000000-0000-0000-0000-000000000008'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2099-12-08')
        and profile_id = '21000000-0000-0000-0000-000000000008'
    ),
    (select id from positions where name = '축가')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id) values
  (
    (select id from schedules where work_date = '2099-12-05'),
    (select id from positions where name = '축가'),
    '21000000-0000-0000-0000-000000000004'
  ),
  (
    (select id from schedules where work_date = '2099-12-07'),
    (select id from positions where name = '축가'),
    '21000000-0000-0000-0000-000000000006'
  ),
  (
    (select id from schedules where work_date = '2099-12-07'),
    (select id from positions where name = '스캔'),
    '21000000-0000-0000-0000-000000000007'
  );

-- =====================================================================
-- AC2: 구조 오류 4종이 각각 개별 코드로 거부된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-01'))$$,
  'LB026',
  '예식을 먼저 만들어 주세요',
  'AC2: 예식 0개는 LB026으로 거부된다'
);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-02'))$$,
  'LB027',
  '예정 출퇴근 시각을 먼저 설정해 주세요',
  'AC2: 예정 출퇴근 시각 미설정은 LB027로 거부된다'
);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-03'))$$,
  'LB028',
  '필요 인원 표를 먼저 열어 주세요',
  'AC2: 필요 인원 표 미복사는 LB028로 거부된다'
);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-04'))$$,
  'LB030',
  '시급이 설정되지 않은 근무자가 있어요',
  'AC2: 시급 미설정 정식 배정자는 LB030으로 거부된다'
);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-05'))$$,
  'LB030',
  '시급이 설정되지 않은 근무자가 있어요',
  'AC2 경계값: 시급 미설정 교육생만 있어도 LB030으로 거부된다(예식 1개·필요 인원 행 1개는 통과)'
);
reset role;

-- =====================================================================
-- AC1 원자성: 구조 오류로 거부된 호출 뒤 스냅샷·상태·감사가 전부 없다
-- =====================================================================

select is(
  (select status from schedules where work_date = '2099-12-04'),
  'OPEN'::schedule_status,
  'AC1 원자성: LB030 거부 뒤에도 스케줄 상태는 OPEN 그대로다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2099-12-04')
      and profile_id = '21000000-0000-0000-0000-000000000003'
  ),
  null::integer,
  'AC1 원자성: LB030 거부 뒤에도 스냅샷은 채워지지 않았다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-04')
      and event in ('schedule_closed', 'schedule_confirmed')
  ),
  0,
  'AC1 원자성: LB030 거부 뒤에는 확정 관련 감사가 전혀 남지 않는다'
);

-- =====================================================================
-- 권한: 비관리자 호출은 42501로 거부되고 상태가 바뀌지 않는다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-12'))$$,
  '42501',
  null,
  '권한: 비관리자(admin 아님)의 confirm_schedule 호출은 42501로 거부된다'
);
reset role;

select is(
  (select status from schedules where work_date = '2099-12-12'),
  'OPEN'::schedule_status,
  '권한: 거부된 호출 뒤에도 스케줄 상태는 그대로다'
);

-- =====================================================================
-- AC1·AC3 happy path: OPEN 스케줄 확정은 CLOSED를 경유하고 경고가 비어 있다
-- (첫 RED→GREEN 쌍 — 전이 트리거의 트랜잭션 내 다단 update 가정)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-06'))$$,
  'AC1·AC3 happy path: 필요 전부 0·배정 0명인 OPEN 스케줄이 한 트랜잭션의 순차 update로 확정된다'
);
reset role;

select is(
  (select status from schedules where work_date = '2099-12-06'),
  'CONFIRMED'::schedule_status,
  'AC3: OPEN 확정 후 상태가 CLOSED·PREPARING을 거쳐 CONFIRMED에 도달한다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-06')
      and event = 'schedule_closed'
  ),
  1,
  'AC3: OPEN 확정은 schedule_closed 감사를 함께 남긴다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-06')
      and event = 'schedule_closed'
  ),
  jsonb_build_object('trigger', 'confirmation'),
  'AC3: schedule_closed 감사 detail이 trigger=confirmation이다'
);
select is(
  (
    select detail from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-06')
      and event = 'schedule_confirmed'
  ),
  jsonb_build_object(
    'revision', 1,
    'warnings', jsonb_build_object('understaffed', '[]'::jsonb, 'no_manager', '[]'::jsonb)
  ),
  'AC5 경계값: 배정 0명·필요 전부 0 스케줄은 경고 0건으로 확정되고 감사 detail이 빈 목록이다'
);

-- =====================================================================
-- AC1·AC6 재시도: 성공 직후 재확정은 LB029로 거부된다(중복 요청·동시성)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-06'))$$,
  'LB029',
  '확정할 수 없는 상태예요',
  'AC1·AC6: 성공 직후 재확정 시도는 LB029로 거부된다(for update 잠금 후 상태 재검증)'
);
reset role;

-- =====================================================================
-- AC3 경계값: CLOSED 스케줄 확정은 schedule_closed 없이 schedule_confirmed만 남긴다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-09'))$$,
  'AC3 경계값: CLOSED 스케줄도 PREPARING을 거쳐 확정된다'
);
reset role;

select is(
  (select status from schedules where work_date = '2099-12-09'),
  'CONFIRMED'::schedule_status,
  'AC3 경계값: CLOSED 스케줄 확정 후 상태가 CONFIRMED다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-09')
      and event = 'schedule_closed'
  ),
  0,
  'AC3 경계값: CLOSED 스케줄 확정은 schedule_closed 감사를 남기지 않는다'
);
select is(
  (
    select count(*)::int from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-09')
      and event = 'schedule_confirmed'
  ),
  1,
  'AC3 경계값: CLOSED 스케줄 확정은 schedule_confirmed만 남긴다'
);

-- =====================================================================
-- AC4 시급 스냅샷: 겸직자는 사람 단위 1행이라 스냅샷도 1개다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-08'))$$,
  'AC4 준비: 겸직자(매니저+축가)가 있는 스케줄을 확정한다'
);
reset role;

select is(
  (
    select count(*)::int from assignments
    where schedule_id = (select id from schedules where work_date = '2099-12-08')
      and profile_id = '21000000-0000-0000-0000-000000000008'
  ),
  1,
  'AC4 경계값: 겸직자의 assignments 행은 확정 후에도 여전히 하나다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2099-12-08')
      and profile_id = '21000000-0000-0000-0000-000000000008'
  ),
  17000,
  'AC4 경계값: 겸직자의 스냅샷 하나가 당시 시급과 일치한다'
);
select is(
  (
    select count(*)::int from assignment_positions ap
    join assignments asg on asg.id = ap.assignment_id
    where asg.schedule_id = (select id from schedules where work_date = '2099-12-08')
      and asg.profile_id = '21000000-0000-0000-0000-000000000008'
  ),
  2,
  'AC4 경계값: 겸직자는 확정 후에도 두 포지션 모두에 연결돼 있다(스냅샷 1개 = 사람 단위, 포지션 연결은 그대로)'
);

-- =====================================================================
-- AC5 경고 감사: 미달·담당자 없음이 함께 있는 스케줄, 필요 0 경계 포함
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-07'))$$,
  'AC5 happy path: 미달(매니저)·담당자 없음(축가)·경계(스캔, 필요 0)가 섞인 스케줄을 확정한다'
);
reset role;

select is(
  (
    select jsonb_array_length(detail -> 'warnings' -> 'understaffed')
    from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and event = 'schedule_confirmed'
  ),
  2,
  'AC5: 미달 목록에 매니저(필요2/배정1)·축가(필요1/배정0) 둘만 담긴다(필요 0인 스캔은 제외)'
);
select ok(
  (
    select detail -> 'warnings' -> 'understaffed' from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and event = 'schedule_confirmed'
  ) @> jsonb_build_array(
    jsonb_build_object(
      'position_id', (select id from positions where name = '매니저'),
      'position_name', '매니저', 'required_count', 2, 'assigned_count', 1
    )
  ),
  'AC5: 미달 목록에 매니저(필요2/배정1) 항목이 정확한 수치로 담긴다'
);
select is(
  (
    select jsonb_array_length(detail -> 'warnings' -> 'no_manager')
    from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and event = 'schedule_confirmed'
  ),
  2,
  'AC5 경계값: 담당자 없음 목록에 축가(정식0·교육1)·스캔(필요0·정식0·교육1) 둘 다 담긴다'
);
select ok(
  (
    select detail -> 'warnings' -> 'no_manager' from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and event = 'schedule_confirmed'
  ) @> jsonb_build_array(
    jsonb_build_object(
      'position_id', (select id from positions where name = '스캔'),
      'position_name', '스캔', 'trainee_count', 1
    )
  ),
  'AC5 경계값: 필요 0·정식 0·교육생 1인 스캔이 미달 아님·담당자 없음으로 기록된다'
);

-- =====================================================================
-- AC4 실패: 확정 후 시급 변경은 스냅샷을 바꾸지 않는다
-- =====================================================================

select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and profile_id = '21000000-0000-0000-0000-000000000005'
  ),
  13000,
  'AC4 준비: 확정 직후 미달배정자의 스냅샷이 당시 시급 13000과 일치한다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_hourly_wage('21000000-0000-0000-0000-000000000005', 20000)$$,
  'AC4: 확정 후 관리자가 미달배정자의 시급을 20000으로 바꾼다'
);
reset role;

select is(
  (select hourly_wage from profiles where id = '21000000-0000-0000-0000-000000000005'),
  20000,
  'AC4: profiles.hourly_wage는 실제로 20000으로 바뀌었다'
);
select is(
  (
    select hourly_wage_snapshot from assignments
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and profile_id = '21000000-0000-0000-0000-000000000005'
  ),
  13000,
  'AC4: 확정 후 시급 변경은 assignments.hourly_wage_snapshot을 바꾸지 않는다(여전히 13000)'
);

-- =====================================================================
-- AC4 교육생 스냅샷: assignment_trainees 전 행도 값으로 단언되고 이후 변경에 불변이다
-- (F-01 수정: 이전까지 assignment_trainees는 col_type_is로 컬럼 존재만 확인했다)
-- =====================================================================

select is(
  (
    select hourly_wage_snapshot from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and profile_id = '21000000-0000-0000-0000-000000000006'
  ),
  15000,
  'AC4: 담당자없음교육(교육생)의 스냅샷이 확정 직후 당시 시급 15000과 일치한다'
);
select is(
  (
    select hourly_wage_snapshot from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and profile_id = '21000000-0000-0000-0000-000000000007'
  ),
  16000,
  'AC4: 경계교육(교육생)의 스냅샷이 확정 직후 당시 시급 16000과 일치한다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_hourly_wage('21000000-0000-0000-0000-000000000006', 21000)$$,
  'AC4: 확정 후 관리자가 담당자없음교육(교육생)의 시급을 21000으로 바꾼다'
);
reset role;

select is(
  (select hourly_wage from profiles where id = '21000000-0000-0000-0000-000000000006'),
  21000,
  'AC4: profiles.hourly_wage는 실제로 21000으로 바뀌었다'
);
select is(
  (
    select hourly_wage_snapshot from assignment_trainees
    where schedule_id = (select id from schedules where work_date = '2099-12-07')
      and profile_id = '21000000-0000-0000-0000-000000000006'
  ),
  15000,
  'AC4: 확정 후 교육생 시급 변경은 assignment_trainees.hourly_wage_snapshot을 바꾸지 않는다(여전히 15000)'
);

-- =====================================================================
-- AC6: 이미 확정되었거나 취소된 스케줄(직접 insert 픽스처)의 확정은 LB029로 거부된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-10'))$$,
  'LB029',
  '확정할 수 없는 상태예요',
  'AC6: 직접 insert된 CONFIRMED 픽스처의 확정 시도는 LB029로 거부된다'
);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-11'))$$,
  'LB029',
  '확정할 수 없는 상태예요',
  'AC6: 직접 insert된 CANCELLED 픽스처의 확정 시도는 LB029로 거부된다'
);
reset role;

select * from finish();
rollback;
