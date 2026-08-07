begin;
select plan(129);

-- =====================================================================
-- AC1 스키마 생성: enum·테이블·컬럼·기본값·PK
-- =====================================================================

select has_type('public', 'schedule_status', 'schedule_status enum');
select enum_has_labels(
  'public', 'schedule_status',
  array['OPEN', 'CLOSED', 'PREPARING', 'CONFIRMED', 'CANCELLED'],
  'schedule_status labels'
);
select has_type('public', 'application_status', 'application_status enum');
select enum_has_labels(
  'public', 'application_status', array['applied', 'withdrawn'], 'application_status labels'
);

select has_table('public', 'schedules', 'schedules table');
select col_is_pk('public', 'schedules', 'id', 'schedules pk');
select col_not_null('public', 'schedules', 'work_date', 'schedules.work_date not null');
select col_not_null(
  'public', 'schedules', 'application_deadline', 'schedules.application_deadline not null'
);
select col_not_null('public', 'schedules', 'status', 'schedules.status not null');
select col_has_default('public', 'schedules', 'status', 'schedules.status has a default');
select col_not_null('public', 'schedules', 'revision', 'schedules.revision not null');
select col_has_default('public', 'schedules', 'revision', 'schedules.revision has a default');
select col_type_is(
  'public', 'schedules', 'created_at', 'timestamp with time zone', 'schedules.created_at type'
);
select col_type_is(
  'public', 'schedules', 'updated_at', 'timestamp with time zone', 'schedules.updated_at type'
);

select has_table('public', 'applications', 'applications table');
select col_is_pk('public', 'applications', 'id', 'applications pk');
select col_not_null('public', 'applications', 'schedule_id', 'applications.schedule_id not null');
select col_not_null('public', 'applications', 'profile_id', 'applications.profile_id not null');
select col_not_null('public', 'applications', 'status', 'applications.status not null');
select col_has_default('public', 'applications', 'status', 'applications.status has a default');

select has_table('public', 'scheduling_audit_logs', 'scheduling_audit_logs table');
select col_is_pk('public', 'scheduling_audit_logs', 'seq', 'scheduling_audit_logs pk');
select col_not_null(
  'public', 'scheduling_audit_logs', 'event', 'scheduling_audit_logs.event not null'
);
select col_not_null(
  'public', 'scheduling_audit_logs', 'detail', 'scheduling_audit_logs.detail not null'
);
select col_has_default(
  'public', 'scheduling_audit_logs', 'detail', 'scheduling_audit_logs.detail has a default'
);
select col_not_null(
  'public', 'scheduling_audit_logs', 'created_at', 'scheduling_audit_logs.created_at not null'
);
select col_has_default(
  'public', 'scheduling_audit_logs', 'created_at', 'scheduling_audit_logs.created_at has a default'
);

-- NOT NULL·FK 위반 insert 거부

select throws_ok(
  $$insert into schedules (work_date, application_deadline) values (null, '2099-01-01')$$,
  '23502',
  null,
  'work_date null insert는 NOT NULL로 거부된다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-01-01', null)$$,
  '23502',
  null,
  'application_deadline null insert는 NOT NULL로 거부된다'
);
select throws_ok(
  $$insert into applications (schedule_id, profile_id)
    values ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999')$$,
  '23503',
  null,
  'schedule_id·profile_id 둘 다 없는 신청 insert는 FK로 거부된다'
);
select throws_ok(
  $$insert into scheduling_audit_logs (event) values ('   ')$$,
  '23514',
  null,
  '공백 event insert는 CHECK로 거부된다'
);

-- revision 기본값 1 단언(함수적 확인)

insert into schedules (work_date, application_deadline) values ('2099-01-10', '2099-01-10');
select is(
  (select revision from schedules where work_date = '2099-01-10'),
  1,
  'revision 기본값은 1이다'
);
select is(
  (select status from schedules where work_date = '2099-01-10'),
  'OPEN'::schedule_status,
  'status 기본값은 OPEN이다'
);

-- =====================================================================
-- 픽스처: 주체 7종(관리자·비활성 4종·활성 근무자 2명)
-- =====================================================================

insert into auth.users (id, email) values
  ('12000000-0000-0000-0000-000000000001', 'recruit-admin@labiebelle.test'),
  ('12000000-0000-0000-0000-000000000002', 'recruit-pending@labiebelle.test'),
  ('12000000-0000-0000-0000-000000000003', 'recruit-rejected@labiebelle.test'),
  ('12000000-0000-0000-0000-000000000004', 'recruit-dormant@labiebelle.test'),
  ('12000000-0000-0000-0000-000000000005', 'recruit-departed@labiebelle.test'),
  ('12000000-0000-0000-0000-000000000006', 'recruit-worker-a@labiebelle.test'),
  ('12000000-0000-0000-0000-000000000007', 'recruit-worker-b@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('12000000-0000-0000-0000-000000000001', '모집관리자', '01050000001', 'male', '1985-01-01', 'active', now()),
  ('12000000-0000-0000-0000-000000000002', '대기주체', '01050000002', 'male', '1990-01-01', 'pending', null),
  ('12000000-0000-0000-0000-000000000003', '거절주체', '01050000003', 'female', '1991-02-02', 'rejected', null),
  ('12000000-0000-0000-0000-000000000004', '휴면주체', '01050000004', 'male', '1992-03-03', 'dormant', now() - interval '10 days'),
  ('12000000-0000-0000-0000-000000000005', '탈퇴주체', '01050000005', 'female', '1993-04-04', 'departed', null),
  ('12000000-0000-0000-0000-000000000006', '근무자에이', '01050000006', 'male', '1994-05-05', 'active', now()),
  ('12000000-0000-0000-0000-000000000007', '근무자비', '01050000007', 'female', '1995-06-06', 'active', now());

insert into public.profile_roles (profile_id, role, granted_by) values
  ('12000000-0000-0000-0000-000000000001', 'admin', null);

-- =====================================================================
-- 픽스처: 전이 표 검증용 스케줄 세트(AC2 중복 금지 + AC4 허용 전이 겸용)
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-02-01', '2099-02-01');

insert into schedules (work_date, application_deadline) values ('2099-02-02', '2099-02-02');
select lives_ok(
  $$update schedules set status = 'CLOSED' where work_date = '2099-02-02'$$,
  'AC4 허용 전이: OPEN→CLOSED가 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-02'),
  'CLOSED'::schedule_status,
  'AC4: OPEN→CLOSED 전이 후 상태가 CLOSED로 반영된다'
);

insert into schedules (work_date, application_deadline) values ('2099-02-03', '2099-02-03');
update schedules set status = 'CLOSED' where work_date = '2099-02-03';
select lives_ok(
  $$update schedules set status = 'PREPARING' where work_date = '2099-02-03'$$,
  'AC4 허용 전이: CLOSED→PREPARING이 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-03'),
  'PREPARING'::schedule_status,
  'AC4: CLOSED→PREPARING 전이 후 상태가 PREPARING으로 반영된다'
);

insert into schedules (work_date, application_deadline) values ('2099-02-04', '2099-02-04');
update schedules set status = 'CLOSED' where work_date = '2099-02-04';
update schedules set status = 'PREPARING' where work_date = '2099-02-04';
select lives_ok(
  $$update schedules set status = 'CONFIRMED' where work_date = '2099-02-04'$$,
  'AC4 허용 전이: PREPARING→CONFIRMED가 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-04'),
  'CONFIRMED'::schedule_status,
  'AC4: PREPARING→CONFIRMED 전이 후 상태가 CONFIRMED로 반영된다'
);

insert into schedules (work_date, application_deadline) values ('2099-02-05', '2099-02-05');
select lives_ok(
  $$update schedules set status = 'CANCELLED' where work_date = '2099-02-05'$$,
  'AC4 허용 전이: OPEN→CANCELLED가 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-05'),
  'CANCELLED'::schedule_status,
  'AC4: OPEN→CANCELLED 전이 후 상태가 CANCELLED로 반영된다'
);

insert into schedules (work_date, application_deadline) values ('2099-02-10', '2099-02-10');
update schedules set status = 'CLOSED' where work_date = '2099-02-10';
select lives_ok(
  $$update schedules set status = 'OPEN' where work_date = '2099-02-10'$$,
  'AC4 허용 전이: CLOSED→OPEN(재오픈)이 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-10'),
  'OPEN'::schedule_status,
  'AC4: CLOSED→OPEN 전이 후 상태가 OPEN으로 반영된다'
);

insert into schedules (work_date, application_deadline) values ('2099-02-11', '2099-02-11');
update schedules set status = 'CLOSED' where work_date = '2099-02-11';
select lives_ok(
  $$update schedules set status = 'CANCELLED' where work_date = '2099-02-11'$$,
  'AC4 허용 전이: CLOSED→CANCELLED가 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-11'),
  'CANCELLED'::schedule_status,
  'AC4: CLOSED→CANCELLED 전이 후 상태가 CANCELLED로 반영된다'
);

insert into schedules (work_date, application_deadline) values ('2099-02-12', '2099-02-12');
update schedules set status = 'CLOSED' where work_date = '2099-02-12';
update schedules set status = 'PREPARING' where work_date = '2099-02-12';
select lives_ok(
  $$update schedules set status = 'CANCELLED' where work_date = '2099-02-12'$$,
  'AC4 허용 전이: PREPARING→CANCELLED가 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-02-12'),
  'CANCELLED'::schedule_status,
  'AC4: PREPARING→CANCELLED 전이 후 상태가 CANCELLED로 반영된다'
);

-- =====================================================================
-- AC2 활성 중복 금지
-- =====================================================================

select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-02-01', '2099-02-01')$$,
  '23505',
  null,
  'OPEN 상태와 같은 근무일 중복 insert는 23505로 거부된다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-02-01', '2099-02-01')$$,
  '23505',
  null,
  '같은 중복 insert 재시도도 동일 23505로 수렴한다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-02-02', '2099-02-02')$$,
  '23505',
  null,
  'CLOSED 상태와 같은 근무일 중복 insert는 23505로 거부된다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-02-03', '2099-02-03')$$,
  '23505',
  null,
  'PREPARING 상태와 같은 근무일 중복 insert는 23505로 거부된다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-02-04', '2099-02-04')$$,
  '23505',
  null,
  'CONFIRMED 상태와 같은 근무일 중복 insert는 23505로 거부된다'
);
select lives_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-02-05', '2099-02-05')$$,
  'CANCELLED뿐인 근무일은 재생성이 허용된다'
);
select is(
  (select count(*)::int from schedules where work_date = '2099-02-05'),
  2,
  '재생성 후 같은 근무일에 CANCELLED 1행과 새 OPEN 1행이 공존한다'
);

-- =====================================================================
-- AC4 전이 표 강제: 표 밖 조합 전수 거부
-- =====================================================================

insert into schedules (work_date, application_deadline) values ('2099-03-01', '2099-03-01');
select throws_ok(
  $$update schedules set status = 'PREPARING' where work_date = '2099-03-01'$$,
  'LB020',
  null,
  'OPEN→PREPARING은 표 밖이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'PREPARING' where work_date = '2099-03-01'$$,
  'LB020',
  null,
  '같은 표 밖 전이 재시도도 동일하게 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'CONFIRMED' where work_date = '2099-03-01'$$,
  'LB020',
  null,
  'OPEN→CONFIRMED는 표 밖이라 LB020으로 거부된다'
);
select lives_ok(
  $$update schedules set status = 'OPEN' where work_date = '2099-03-01'$$,
  'OPEN→OPEN(상태 무변경) UPDATE는 통과한다'
);
select is(
  (select status from schedules where work_date = '2099-03-01'),
  'OPEN'::schedule_status,
  '거부된 표 밖 전이 시도들은 상태를 바꾸지 못했다'
);

insert into schedules (work_date, application_deadline) values ('2099-03-02', '2099-03-02');
update schedules set status = 'CLOSED' where work_date = '2099-03-02';
select throws_ok(
  $$update schedules set status = 'CONFIRMED' where work_date = '2099-03-02'$$,
  'LB020',
  null,
  'CLOSED→CONFIRMED는 표 밖이라 LB020으로 거부된다'
);
select is(
  (select status from schedules where work_date = '2099-03-02'),
  'CLOSED'::schedule_status,
  '거부된 CLOSED→CONFIRMED 시도는 상태를 바꾸지 못했다'
);

insert into schedules (work_date, application_deadline) values ('2099-03-03', '2099-03-03');
update schedules set status = 'CLOSED' where work_date = '2099-03-03';
update schedules set status = 'PREPARING' where work_date = '2099-03-03';
select throws_ok(
  $$update schedules set status = 'OPEN' where work_date = '2099-03-03'$$,
  'LB020',
  null,
  'PREPARING→OPEN은 표 밖이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'CLOSED' where work_date = '2099-03-03'$$,
  'LB020',
  null,
  'PREPARING→CLOSED는 표 밖이라 LB020으로 거부된다'
);
select is(
  (select status from schedules where work_date = '2099-03-03'),
  'PREPARING'::schedule_status,
  '거부된 PREPARING 이탈 시도들은 상태를 바꾸지 못했다'
);

-- CONFIRMED 종단 상태의 이탈 거부(2099-02-04 재사용)
select throws_ok(
  $$update schedules set status = 'OPEN' where work_date = '2099-02-04'$$,
  'LB020',
  null,
  'CONFIRMED→OPEN은 종단 이탈이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'CLOSED' where work_date = '2099-02-04'$$,
  'LB020',
  null,
  'CONFIRMED→CLOSED는 종단 이탈이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'PREPARING' where work_date = '2099-02-04'$$,
  'LB020',
  null,
  'CONFIRMED→PREPARING은 종단 이탈이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'CANCELLED' where work_date = '2099-02-04'$$,
  'LB020',
  null,
  'CONFIRMED→CANCELLED는 이 task의 표 밖이라 LB020으로 거부된다(P3 기획 소유)'
);
select is(
  (select status from schedules where work_date = '2099-02-04'),
  'CONFIRMED'::schedule_status,
  '거부된 CONFIRMED 이탈 시도들은 상태를 바꾸지 못했다'
);

-- CANCELLED 종단 상태의 이탈 거부(2099-02-05의 CANCELLED 행 재사용)
select throws_ok(
  $$update schedules set status = 'OPEN'
    where work_date = '2099-02-05' and status = 'CANCELLED'$$,
  'LB020',
  null,
  'CANCELLED→OPEN은 종단 이탈이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'CLOSED'
    where work_date = '2099-02-05' and status = 'CANCELLED'$$,
  'LB020',
  null,
  'CANCELLED→CLOSED는 종단 이탈이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'PREPARING'
    where work_date = '2099-02-05' and status = 'CANCELLED'$$,
  'LB020',
  null,
  'CANCELLED→PREPARING은 종단 이탈이라 LB020으로 거부된다'
);
select throws_ok(
  $$update schedules set status = 'CONFIRMED'
    where work_date = '2099-02-05' and status = 'CANCELLED'$$,
  'LB020',
  null,
  'CANCELLED→CONFIRMED는 종단 이탈이라 LB020으로 거부된다'
);
select lives_ok(
  $$update schedules set status = 'CANCELLED'
    where work_date = '2099-02-05' and status = 'CANCELLED'$$,
  'CANCELLED→CANCELLED(상태 무변경) UPDATE는 종단 상태에서도 통과한다'
);
select is(
  (select count(*)::int from schedules where work_date = '2099-02-05' and status = 'CANCELLED'),
  1,
  '거부된 CANCELLED 이탈 시도들은 상태를 바꾸지 못했다'
);

-- =====================================================================
-- AC3 날짜 규칙
-- =====================================================================

select throws_ok(
  $$insert into schedules (work_date, application_deadline)
    values ('2099-04-01', '2099-04-02')$$,
  '23514',
  null,
  '마감일이 근무일보다 늦은 insert는 CHECK로 거부된다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline)
    values (
      (now() at time zone 'Asia/Seoul')::date - 1,
      (now() at time zone 'Asia/Seoul')::date - 1
    )$$,
  'LB021',
  null,
  'KST 오늘 이전 근무일 insert는 LB021로 거부된다'
);
select throws_ok(
  $$insert into schedules (work_date, application_deadline)
    values (
      (now() at time zone 'Asia/Seoul')::date + 5,
      (now() at time zone 'Asia/Seoul')::date - 1
    )$$,
  'LB021',
  null,
  '근무일이 미래여도 마감일이 KST 오늘 이전이면 LB021로 거부된다'
);
select lives_ok(
  $$insert into schedules (work_date, application_deadline)
    values ((now() at time zone 'Asia/Seoul')::date, (now() at time zone 'Asia/Seoul')::date)$$,
  'KST 오늘 당일 값은 경계로서 허용된다'
);
select is(
  (select count(*)::int from schedules where work_date = (now() at time zone 'Asia/Seoul')::date),
  1,
  '당일 경계 insert가 실제로 반영된다'
);

-- =====================================================================
-- AC5 신청 제약
-- =====================================================================

select lives_ok(
  $$insert into applications (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-01-10'),
      '12000000-0000-0000-0000-000000000006'
    )$$,
  '근무자 A의 신청 insert가 허용된다'
);
select is(
  (
    select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-01-10')
      and profile_id = '12000000-0000-0000-0000-000000000006'
  ),
  'applied'::application_status,
  '신청 기본 상태는 applied다'
);
select throws_ok(
  $$insert into applications (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-01-10'),
      '12000000-0000-0000-0000-000000000006'
    )$$,
  '23505',
  null,
  '같은 스케줄·근무자 중복 신청 insert는 23505로 거부된다'
);
select lives_ok(
  $$insert into applications (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-01-10'),
      '12000000-0000-0000-0000-000000000007'
    )$$,
  '다른 근무자 B의 신청 insert는 같은 스케줄에도 허용된다'
);
select lives_ok(
  $$update applications set status = 'withdrawn'
    where schedule_id = (select id from schedules where work_date = '2099-01-10')
      and profile_id = '12000000-0000-0000-0000-000000000006'$$,
  '신청 상태 applied→withdrawn 전환이 허용된다'
);
select is(
  (
    select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-01-10')
      and profile_id = '12000000-0000-0000-0000-000000000006'
  ),
  'withdrawn'::application_status,
  'applied→withdrawn 전환이 실제로 반영된다'
);
select lives_ok(
  $$update applications set status = 'applied'
    where schedule_id = (select id from schedules where work_date = '2099-01-10')
      and profile_id = '12000000-0000-0000-0000-000000000006'$$,
  '신청 상태 withdrawn→applied 재전환도 허용된다(재신청 자유)'
);
select is(
  (
    select status from applications
    where schedule_id = (select id from schedules where work_date = '2099-01-10')
      and profile_id = '12000000-0000-0000-0000-000000000006'
  ),
  'applied'::application_status,
  'withdrawn→applied 전환이 실제로 반영된다'
);

select throws_ok(
  $$delete from schedules where work_date = '2099-01-10'$$,
  'LB022',
  null,
  'schedules DELETE는 append-only 위반으로 LB022 거부된다'
);
select throws_ok(
  $$delete from applications
    where schedule_id = (select id from schedules where work_date = '2099-01-10')
      and profile_id = '12000000-0000-0000-0000-000000000006'$$,
  'LB022',
  null,
  'applications DELETE는 append-only 위반으로 LB022 거부된다'
);

insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail)
values (
  'schema_test_event',
  '12000000-0000-0000-0000-000000000001',
  (select id from schedules where work_date = '2099-01-10'),
  '{}'::jsonb
);
select throws_ok(
  $$update scheduling_audit_logs set event = 'tampered' where event = 'schema_test_event'$$,
  'LB022',
  null,
  'scheduling_audit_logs UPDATE는 append-only 위반으로 LB022 거부된다'
);
select throws_ok(
  $$delete from scheduling_audit_logs where event = 'schema_test_event'$$,
  'LB022',
  null,
  'scheduling_audit_logs DELETE는 append-only 위반으로 LB022 거부된다'
);
select is(
  (select count(*)::int from scheduling_audit_logs where event = 'schema_test_event'),
  1,
  '거부된 감사 로그 변조·삭제 시도는 행을 그대로 남긴다'
);

-- =====================================================================
-- AC6 RLS 읽기·쓰기 축
-- =====================================================================

-- 공허 단언 방지: 비활성 주체 0 rows를 확인하기 전에 데이터 존재를 증명한다(P1-T07 F-01 교훈)
select ok(
  (select count(*)::int from schedules) > 0,
  '픽스처: schedules에 행이 실제로 존재한다(비활성 주체 0 rows 단언의 공허하지 않음 증명)'
);
select ok(
  (select count(*)::int from applications) > 0,
  '픽스처: applications에 행이 실제로 존재한다(타인 근무자 0 rows 단언의 공허하지 않음 증명)'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.schedules'::regclass),
  true,
  'schedules has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.applications'::regclass),
  true,
  'applications has row level security enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.scheduling_audit_logs'::regclass),
  true,
  'scheduling_audit_logs has row level security enabled'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'schedules'),
  1,
  'schedules has exactly one policy(active 근무자·admin select)'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'applications'),
  1,
  'applications has exactly one policy(본인·admin select)'
);
select is(
  (
    select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'scheduling_audit_logs'
  ),
  0,
  'scheduling_audit_logs has zero policies(default deny)'
);

-- 읽기: active 근무자·admin은 schedules를 읽을 수 있다

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000006', true);
select isnt_empty(
  $$select 1 from schedules$$,
  'active 근무자는 schedules를 읽을 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
select isnt_empty(
  $$select 1 from schedules$$,
  'admin은 schedules를 읽을 수 있다'
);
reset role;

-- 읽기: 비활성 4종·anon은 schedules 0 rows(개별 단언)

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select 1 from schedules$$,
  'pending 주체는 schedules를 읽을 수 없다(0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000003', true);
select is_empty(
  $$select 1 from schedules$$,
  'rejected 주체는 schedules를 읽을 수 없다(0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000004', true);
select is_empty(
  $$select 1 from schedules$$,
  'dormant 주체는 schedules를 읽을 수 없다(0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000005', true);
select is_empty(
  $$select 1 from schedules$$,
  'departed 주체는 schedules를 읽을 수 없다(0 rows)'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select is_empty(
  $$select 1 from schedules$$,
  'anon은 schedules를 읽을 수 없다(0 rows)'
);
reset role;

-- 읽기: applications는 본인·admin만, 타인 근무자·anon은 0 rows

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000006', true);
select isnt_empty(
  $$select 1 from applications where profile_id = '12000000-0000-0000-0000-000000000006'$$,
  '본인은 자신의 신청을 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000007', true);
select is_empty(
  $$select 1 from applications where profile_id = '12000000-0000-0000-0000-000000000006'$$,
  '타인 근무자는 다른 근무자의 신청을 조회할 수 없다(0 rows)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
select isnt_empty(
  $$select 1 from applications where profile_id = '12000000-0000-0000-0000-000000000006'$$,
  'admin은 타인의 신청도 조회할 수 있다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select is_empty(
  $$select 1 from applications$$,
  'anon은 applications를 읽을 수 없다(0 rows)'
);
select is_empty(
  $$select 1 from scheduling_audit_logs$$,
  'anon은 scheduling_audit_logs를 읽을 수 없다(0 rows, 정책 부재)'
);
reset role;

-- 쓰기: anon·active 근무자·admin 모두 세 테이블 직접 INSERT/UPDATE가 거부된다

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-05-01', '2099-05-01')$$,
  '42501',
  null,
  'anon의 schedules 직접 insert는 거부된다'
);
select throws_ok(
  $$insert into applications (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-01-10'), '12000000-0000-0000-0000-000000000006'
    )$$,
  '42501',
  null,
  'anon의 applications 직접 insert는 거부된다'
);
select throws_ok(
  $$insert into scheduling_audit_logs (event) values ('anon_intrusion')$$,
  '42501',
  null,
  'anon의 scheduling_audit_logs 직접 insert는 거부된다'
);
select lives_ok(
  $$update schedules set status = status$$,
  'anon의 schedules update는 행이 필터되어 오류 없이 통과한다'
);
select lives_ok(
  $$update applications set status = status$$,
  'anon의 applications update는 행이 필터되어 오류 없이 통과한다'
);
select lives_ok(
  $$update scheduling_audit_logs set event = event$$,
  'anon의 scheduling_audit_logs update는 행이 필터되어 오류 없이 통과한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000006', true);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-05-02', '2099-05-02')$$,
  '42501',
  null,
  'active 근무자의 schedules 직접 insert도 거부된다'
);
select throws_ok(
  $$insert into applications (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-01-10'), '12000000-0000-0000-0000-000000000007'
    )$$,
  '42501',
  null,
  'active 근무자의 applications 직접 insert도 거부된다(본인 신청도 함수를 통해서만 가능)'
);
select throws_ok(
  $$insert into scheduling_audit_logs (event) values ('worker_intrusion')$$,
  '42501',
  null,
  'active 근무자의 scheduling_audit_logs 직접 insert도 거부된다'
);
select lives_ok(
  $$update schedules set status = status$$,
  'active 근무자의 schedules update도 쓰기 정책 부재로 필터되어 통과한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$insert into schedules (work_date, application_deadline) values ('2099-05-03', '2099-05-03')$$,
  '42501',
  null,
  'admin의 schedules 직접 insert도 거부된다(쓰기는 후속 DEFINER 함수 전용)'
);
select throws_ok(
  $$insert into applications (schedule_id, profile_id)
    values (
      (select id from schedules where work_date = '2099-01-10'), '12000000-0000-0000-0000-000000000007'
    )$$,
  '42501',
  null,
  'admin의 applications 직접 insert도 거부된다'
);
select throws_ok(
  $$insert into scheduling_audit_logs (event) values ('admin_intrusion')$$,
  '42501',
  null,
  'admin의 scheduling_audit_logs 직접 insert도 거부된다'
);
select lives_ok(
  $$update scheduling_audit_logs set event = event$$,
  'admin의 scheduling_audit_logs update도 쓰기 정책 부재로 필터되어 통과한다'
);
reset role;

select is(
  (select count(*)::int from schedules where work_date between '2099-05-01' and '2099-05-03'),
  0,
  'rls 쓰기 거부 시도들은 schedules에 어떤 행도 만들지 못했다'
);
select is(
  (select count(*)::int from scheduling_audit_logs where event like '%_intrusion'),
  0,
  'rls 쓰기 거부 시도들은 scheduling_audit_logs에 어떤 행도 만들지 못했다'
);

select * from finish();
rollback;
