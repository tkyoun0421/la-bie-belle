begin;
select plan(47);

-- =====================================================================
-- 스키마: helper 함수 시그니처
-- =====================================================================

select has_function(
  'public', 'notify_schedule_recipients',
  array['text', 'uuid', 'integer', 'uuid[]', 'text', 'text', 'jsonb'],
  'notify_schedule_recipients(text, uuid, integer, uuid[], text, text, jsonb) exists'
);

-- =====================================================================
-- 픽스처: 관리자 1명, 활성 근무자 A~F 6명, 비활성 상태 4종, 관리자전용(미승인) 1명,
-- 시급없음 1명(AC5 롤백용)
-- =====================================================================

insert into auth.users (id, email) values
  ('26000000-0000-0000-0000-000000000001', 'rcn-admin@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000002', 'rcn-worker-a@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000003', 'rcn-worker-b@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000004', 'rcn-pending@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000005', 'rcn-dormant@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000006', 'rcn-departed@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000007', 'rcn-rejected@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000008', 'rcn-admin-only-pending@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000009', 'rcn-worker-c@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000010', 'rcn-worker-d@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000011', 'rcn-worker-e@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000012', 'rcn-worker-f@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000013', 'rcn-wageless@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '26000000-0000-0000-0000-000000000001', '모집관리자', '01096000001', 'male', '1985-01-01',
    'active', now(), null
  ),
  (
    '26000000-0000-0000-0000-000000000002', '근무자A', '01096000002', 'female', '1990-01-01',
    'active', now(), 13000
  ),
  (
    '26000000-0000-0000-0000-000000000003', '근무자B', '01096000003', 'male', '1991-01-01',
    'active', now(), 13000
  ),
  (
    '26000000-0000-0000-0000-000000000004', '대기중', '01096000004', 'female', '1992-01-01',
    'pending', null, null
  ),
  (
    '26000000-0000-0000-0000-000000000005', '휴면중', '01096000005', 'male', '1993-01-01',
    'dormant', now(), null
  ),
  (
    '26000000-0000-0000-0000-000000000006', '탈퇴함', '01096000006', 'female', '1994-01-01',
    'departed', null, null
  ),
  (
    '26000000-0000-0000-0000-000000000007', '거절됨', '01096000007', 'male', '1995-01-01',
    'rejected', null, null
  ),
  (
    '26000000-0000-0000-0000-000000000008', '관리자전용대기', '01096000008', 'female', '1996-01-01',
    'pending', null, null
  ),
  (
    '26000000-0000-0000-0000-000000000009', '근무자C', '01096000009', 'male', '1997-01-01',
    'active', now(), 14000
  ),
  (
    '26000000-0000-0000-0000-000000000010', '근무자D', '01096000010', 'female', '1998-01-01',
    'active', now(), 15000
  ),
  (
    '26000000-0000-0000-0000-000000000011', '근무자E', '01096000011', 'male', '1999-01-01',
    'active', now(), 16000
  ),
  (
    '26000000-0000-0000-0000-000000000012', '무관근무자', '01096000012', 'female', '1989-01-01',
    'active', now(), 17000
  ),
  (
    '26000000-0000-0000-0000-000000000013', '시급없음', '01096000013', 'male', '1988-01-01',
    'active', now(), null
  );

insert into public.profile_roles (profile_id, role, granted_by) values
  ('26000000-0000-0000-0000-000000000001', 'admin', null),
  ('26000000-0000-0000-0000-000000000008', 'admin', null);

-- =====================================================================
-- AC1: 모집 오픈 — 활성 근무자마다 정확히 1건, 비활성 상태 4종·관리자전용(미승인) 미수신,
-- aggregate=최소 work_date, 재시도 흡수
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select is(
  open_recruitment_schedules(
    array['2098-05-12', '2098-05-10', '2098-05-11']::date[], '2098-05-10'::date
  ),
  '{"created_count": 3, "conflict_dates": []}'::jsonb,
  'AC1 happy path: 3개 생성 시 반환값이 정상이다'
);
reset role;

select is(
  (
    select count(*)::int from notifications
    where event_type = 'recruitment_opened'
      and aggregate_id = (select id from schedules where work_date = '2098-05-10')
  ),
  8,
  'AC1: status=active인 근무자(관리자 포함) 8명 전원에게 정확히 1건씩 만들어진다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'recruitment_opened'
      and aggregate_id = (select id from schedules where work_date = '2098-05-10')
      and recipient_id = any(array[
        '26000000-0000-0000-0000-000000000004', '26000000-0000-0000-0000-000000000005',
        '26000000-0000-0000-0000-000000000006', '26000000-0000-0000-0000-000000000007',
        '26000000-0000-0000-0000-000000000008'
      ]::uuid[])
  ),
  0,
  'AC1: pending·dormant·departed·rejected·관리자전용(미승인)은 미수신이다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'recruitment_opened'
      and aggregate_id = (select id from schedules where work_date = '2098-05-10')
      and recipient_id = '26000000-0000-0000-0000-000000000002'
      and revision = 1
      and title = '새 근무 모집이 열렸어요'
      and body = '5월 10일~5월 12일 근무 모집이 열렸어요'
      and target = jsonb_build_object('screen', 'schedule', 'month', '2098-05')
  ),
  1,
  'AC1: 근무자A 몫 notifications 행의 title·body·target·revision이 정확히 일치한다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'recruitment_opened'
      and aggregate_id = (select id from schedules where work_date = '2098-05-10')
      and recipient_id = '26000000-0000-0000-0000-000000000001'
      and revision = 1
      and title = '새 근무 모집이 열렸어요'
      and body = '5월 10일~5월 12일 근무 모집이 열렸어요'
      and target = jsonb_build_object('screen', 'schedule', 'month', '2098-05')
  ),
  1,
  'AC1: 배치를 연 관리자 본인도 활성 근무자라 같은 값으로 수신한다'
);
select is(
  (
    select count(*)::int from notification_outbox
    where notification_id in (
      select id from notifications
      where event_type = 'recruitment_opened'
        and aggregate_id = (select id from schedules where work_date = '2098-05-10')
    )
  ),
  8,
  'AC1: notifications 8행 각각에 notification_outbox 행이 1:1로 만들어진다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select is(
  open_recruitment_schedules(
    array['2098-05-10', '2098-05-11', '2098-05-12']::date[], '2098-05-10'::date
  ),
  '{"created_count": 0, "conflict_dates": ["2098-05-10", "2098-05-11", "2098-05-12"]}'::jsonb,
  'AC1 중복 요청: 같은 배치 재시도는 스케줄 unique 충돌로 전부 미생성된다'
);
reset role;

select is(
  (select count(*)::int from notifications where event_type = 'recruitment_opened'),
  8,
  'AC1 중복 요청: 재시도 뒤에도 recruitment_opened 알림은 8건 그대로다(늘지 않는다)'
);
select is(
  (
    select count(*)::int from notification_outbox
    where notification_id in (select id from notifications where event_type = 'recruitment_opened')
  ),
  8,
  'AC1 중복 요청: outbox도 늘지 않는다'
);

-- =====================================================================
-- AC2: 배정 변경 — 스케줄 전체 전후 로스터 합집합(빠짐·추가·유지·교육생 +
-- 같은 스케줄 다른 포지션 배정자·교육생, revision 2/F-03) 수신, 배정되지 않은 근무자 미수신,
-- revision이 bump 반환값과 일치
-- =====================================================================

insert into auth.users (id, email) values
  ('26000000-0000-0000-0000-000000000014', 'rcn-worker-g@labiebelle.test'),
  ('26000000-0000-0000-0000-000000000015', 'rcn-worker-h@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '26000000-0000-0000-0000-000000000014', '근무자G', '01096000014', 'male', '1987-01-01',
    'active', now(), 14000
  ),
  (
    '26000000-0000-0000-0000-000000000015', '근무자H', '01096000015', 'female', '1986-01-01',
    'active', now(), 15000
  );

insert into schedules (work_date, application_deadline, status) values
  ('2098-06-01', '2098-05-25', 'CONFIRMED'),
  ('2098-06-02', '2098-05-26', 'CONFIRMED'),
  ('2098-06-03', '2098-05-27', 'CONFIRMED'),
  ('2098-06-04', '2098-05-28', 'CONFIRMED'),
  ('2098-06-05', '2098-05-29', 'CONFIRMED'),
  ('2098-06-06', '2098-05-30', 'CONFIRMED');

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-01'),
    '26000000-0000-0000-0000-000000000002', 13000
  ),
  (
    (select id from schedules where work_date = '2098-06-01'),
    '26000000-0000-0000-0000-000000000003', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-01')
        and profile_id = '26000000-0000-0000-0000-000000000002'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-01')
        and profile_id = '26000000-0000-0000-0000-000000000003'
    ),
    (select id from positions where name = '매니저')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-01'),
    (select id from positions where name = '매니저'),
    '26000000-0000-0000-0000-000000000010', 15000
  );

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-01'),
    '26000000-0000-0000-0000-000000000014', 14000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-01')
        and profile_id = '26000000-0000-0000-0000-000000000014'
    ),
    (select id from positions where name = '안내')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-01'),
    (select id from positions where name = '안내'),
    '26000000-0000-0000-0000-000000000015', 15000
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2098-06-01'),
    (select id from positions where name = '매니저'),
    array[
      '26000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000000009'
    ]::uuid[],
    array['26000000-0000-0000-0000-000000000011']::uuid[]
  )$$,
  'AC2: 정식 배정(B 유지·A 제거·C 추가)·교육생(D 제거·E 추가) 변경이 성공한다'
);
reset role;

select is(
  (select revision from schedules where work_date = '2098-06-01'),
  2,
  'AC2: 배정 변경 성공으로 revision이 1에서 2로 오른다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-01')
  ),
  7,
  'AC2(F-03): 빠진 배정자(A)·유지 배정자(B)·들어온 배정자(C)·전후 교육생(D·E)·같은 스케줄 다른 '
    || '포지션(안내)의 배정자(G)·교육생(H) 7명 모두 정확히 1건씩 받는다(스케줄 전체 전후 로스터)'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-01')
      and recipient_id = '26000000-0000-0000-0000-000000000002'
      and revision = 2
      and title = '확정 근무가 변경됐어요'
      and body = '6월 1일 근무 내용이 바뀌었어요'
      and target = jsonb_build_object('screen', 'schedule-detail', 'date', '2098-06-01')
  ),
  1,
  'AC2: 빠진 배정자(A)도 title·body·target·revision이 정확한 알림을 받는다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-01')
      and recipient_id = '26000000-0000-0000-0000-000000000010'
      and revision = 2
  ),
  1,
  'AC2: 빠진 교육생(D)도 새 revision으로 알림을 받는다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-01')
      and recipient_id = '26000000-0000-0000-0000-000000000012'
  ),
  0,
  'AC2: 스케줄에 배정되지 않은 근무자(F)는 미수신이다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-01')
      and recipient_id = '26000000-0000-0000-0000-000000000014'
      and revision = 2
  ),
  1,
  'AC2(F-03): 같은 스케줄 다른 포지션(안내)의 배정자(G)도 스케줄 전체 로스터 합집합으로 수신한다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-01')
      and recipient_id = '26000000-0000-0000-0000-000000000015'
      and revision = 2
  ),
  1,
  'AC2(F-03): 같은 스케줄 다른 포지션(안내)의 교육생(H)도 스케줄 전체 로스터 합집합으로 수신한다'
);

-- =====================================================================
-- AC3a: 예식 변경 — 현재 배정자∪교육생 수신, 무관 근무자 미수신
-- =====================================================================

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-02'),
    '26000000-0000-0000-0000-000000000003', 13000
  ),
  (
    (select id from schedules where work_date = '2098-06-02'),
    '26000000-0000-0000-0000-000000000009', 14000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-02')
        and profile_id = '26000000-0000-0000-0000-000000000003'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-02')
        and profile_id = '26000000-0000-0000-0000-000000000009'
    ),
    (select id from positions where name = '매니저')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-02'),
    (select id from positions where name = '매니저'),
    '26000000-0000-0000-0000-000000000010', 15000
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select replace_schedule_ceremonies(
    (select id from schedules where work_date = '2098-06-02'), array['10:00']::time[]
  )$$,
  'AC3a: CONFIRMED 스케줄의 예식 교체가 성공한다'
);
reset role;

select is(
  (select revision from schedules where work_date = '2098-06-02'),
  2,
  'AC3a: 예식 교체 성공으로 revision이 2로 오른다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-02')
  ),
  3,
  'AC3a: 현재 배정자(B·C)·교육생(D) 3명이 예식 변경 알림을 받는다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-02')
      and recipient_id = '26000000-0000-0000-0000-000000000009'
      and revision = 2
      and body = '6월 2일 근무 내용이 바뀌었어요'
      and target = jsonb_build_object('screen', 'schedule-detail', 'date', '2098-06-02')
  ),
  1,
  'AC3a: 현재 배정자(C)의 알림 값이 정확하다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-02')
      and recipient_id = '26000000-0000-0000-0000-000000000012'
  ),
  0,
  'AC3a: 무관 근무자(F)는 예식 변경과 무관해 미수신이다'
);

-- =====================================================================
-- AC3b: 예정 시각 변경 — no-op 재저장도 새 revision으로 1건씩 만든다
-- =====================================================================

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-03'),
    '26000000-0000-0000-0000-000000000002', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-03')
        and profile_id = '26000000-0000-0000-0000-000000000002'
    ),
    (select id from positions where name = '매니저')
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2098-06-03'), '09:00'::time, '18:00'::time
  )$$,
  'AC3b: CONFIRMED 스케줄의 예정 시각 변경이 성공한다'
);
reset role;

select is(
  (select revision from schedules where work_date = '2098-06-03'),
  2,
  'AC3b: 예정 시각 변경 성공으로 revision이 2로 오른다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-03')
      and revision = 2
      and recipient_id = '26000000-0000-0000-0000-000000000002'
  ),
  1,
  'AC3b: 현재 배정자(A)가 revision 2 알림을 받는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_schedule_planned_times(
    (select id from schedules where work_date = '2098-06-03'), '09:00'::time, '18:00'::time
  )$$,
  'AC3b 중복 요청: 동일 예정 시각 재저장도 성공한다'
);
reset role;

select is(
  (select revision from schedules where work_date = '2098-06-03'),
  3,
  'AC3b 중복 요청: no-op 재저장도 revision을 3으로 올린다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-03')
  ),
  2,
  'AC3b 중복 요청: no-op 저장도 새 revision(3)으로 근무자A에게 1건을 더 만들어 총 2건이다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-03')
      and revision = 3
      and recipient_id = '26000000-0000-0000-0000-000000000002'
  ),
  1,
  'AC3b 중복 요청: revision 3 알림도 근무자A 몫으로 정확히 생성됐다'
);
select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-03')
      and recipient_id = '26000000-0000-0000-0000-000000000012'
  ),
  0,
  'AC3b: 무관 근무자(F)는 예정 시각 변경과 무관해 미수신이다'
);

-- =====================================================================
-- AC4: 제외 경로 — requirement 변경 저장·확정 취소는 알림 0건
-- =====================================================================

insert into schedule_position_requirements (schedule_id, position_id, required_count) values
  (
    (select id from schedules where work_date = '2098-06-04'),
    (select id from positions where name = '매니저'), 1
  ),
  (
    (select id from schedules where work_date = '2098-06-04'),
    (select id from positions where name = '축가'), 1
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select set_position_requirement(
    (select id from schedules where work_date = '2098-06-04'),
    (select id from positions where name = '매니저'), 2
  )$$,
  'AC4: CONFIRMED 스케줄의 필요 인원 변경이 성공한다(revision은 오르지만 알림 코드는 없다)'
);
select lives_ok(
  $$select remove_position_requirement(
    (select id from schedules where work_date = '2098-06-04'),
    (select id from positions where name = '축가')
  )$$,
  'AC4: CONFIRMED 스케줄의 필요 인원 삭제(마지막 아님)도 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from notifications
    where event_type = 'schedule_revised'
      and aggregate_id = (select id from schedules where work_date = '2098-06-04')
  ),
  0,
  'AC4: 필요 인원 변경·삭제는 revision이 올라도 알림을 만들지 않는다'
);

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-05'),
    '26000000-0000-0000-0000-000000000003', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-05')
        and profile_id = '26000000-0000-0000-0000-000000000003'
    ),
    (select id from positions where name = '매니저')
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select cancel_confirmed_schedule((select id from schedules where work_date = '2098-06-05'))$$,
  'AC4: CONFIRMED 스케줄의 취소가 성공한다'
);
reset role;

select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2098-06-05')
  ),
  0,
  'AC4: 취소는 배정자(B)가 있어도 알림을 전혀 만들지 않는다(revision도 오르지 않는 별도 전이)'
);

-- =====================================================================
-- AC5: 멱등·트랜잭션 롤백·helper 3롤 거부
-- =====================================================================

select notify_schedule_recipients(
  'idempotency_probe_p4t03',
  '26999999-0000-0000-0000-000000000001'::uuid,
  1,
  array['26000000-0000-0000-0000-000000000012']::uuid[],
  '멱등성 원본',
  '멱등성 원본 본문',
  jsonb_build_object('screen', 'pay')
);

select is(
  (select count(*)::int from notifications where event_type = 'idempotency_probe_p4t03'),
  1,
  'AC5: helper 최초 호출은 notifications 1행을 만든다'
);
select is(
  (
    select count(*)::int from notification_outbox
    where notification_id in (
      select id from notifications where event_type = 'idempotency_probe_p4t03'
    )
  ),
  1,
  'AC5: helper 최초 호출은 notification_outbox 1행도 함께 만든다'
);

select notify_schedule_recipients(
  'idempotency_probe_p4t03',
  '26999999-0000-0000-0000-000000000001'::uuid,
  1,
  array['26000000-0000-0000-0000-000000000012']::uuid[],
  '멱등성 중복',
  '멱등성 중복 본문',
  jsonb_build_object('screen', 'pay')
);

select is(
  (select count(*)::int from notifications where event_type = 'idempotency_probe_p4t03'),
  1,
  'AC5: 같은 키 재호출은 무중복이다(정확히 1행 유지)'
);
select is(
  (select title from notifications where event_type = 'idempotency_probe_p4t03'),
  '멱등성 원본',
  'AC5: 흡수된 재호출은 기존 행의 값을 바꾸지 않는다'
);
select is(
  (
    select count(*)::int from notification_outbox
    where notification_id in (
      select id from notifications where event_type = 'idempotency_probe_p4t03'
    )
  ),
  1,
  'AC5: 재호출은 notification_outbox도 늘리지 않는다'
);

insert into assignments (schedule_id, profile_id, hourly_wage_snapshot) values
  (
    (select id from schedules where work_date = '2098-06-06'),
    '26000000-0000-0000-0000-000000000003', 13000
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-06-06')
        and profile_id = '26000000-0000-0000-0000-000000000003'
    ),
    (select id from positions where name = '매니저')
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select replace_position_assignments(
    (select id from schedules where work_date = '2098-06-06'),
    (select id from positions where name = '매니저'),
    array[
      '26000000-0000-0000-0000-000000000003', '26000000-0000-0000-0000-000000000013'
    ]::uuid[]
  )$$,
  'LB030',
  '시급이 설정되지 않은 근무자가 있어요',
  'AC5: 시급 미설정 근무자 추가 시도는 LB030으로 배정 변경 전체가 거부된다'
);
reset role;

select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2098-06-06')
  ),
  0,
  'AC5: 거부된 호출은 이미 배정돼 있던 근무자(B)에게도 알림을 남기지 않는다(같은 트랜잭션 롤백)'
);
select is(
  (select revision from schedules where work_date = '2098-06-06'),
  1,
  'AC5: 거부된 호출 뒤에도 revision은 그대로다'
);

select ok(
  not has_function_privilege(
    'anon', 'notify_schedule_recipients(text, uuid, integer, uuid[], text, text, jsonb)', 'execute'
  ),
  'AC5: anon은 notify_schedule_recipients 실행 권한이 없다'
);
select ok(
  not has_function_privilege(
    'authenticated', 'notify_schedule_recipients(text, uuid, integer, uuid[], text, text, jsonb)',
    'execute'
  ),
  'AC5: authenticated는 notify_schedule_recipients 실행 권한이 없다'
);
select ok(
  not has_function_privilege(
    'service_role', 'notify_schedule_recipients(text, uuid, integer, uuid[], text, text, jsonb)',
    'execute'
  ),
  'AC5: service_role도 notify_schedule_recipients 실행 권한이 없다(내부 전용)'
);

select * from finish();
rollback;
