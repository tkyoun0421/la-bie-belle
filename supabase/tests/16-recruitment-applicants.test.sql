begin;
select plan(7);

-- =====================================================================
-- 픽스처: 관리자·신청자 3명(동명이인 2명·철회자 1명)
-- =====================================================================

insert into auth.users (id, email) values
  ('16000000-0000-0000-0000-000000000001', 'applicants-admin@labiebelle.test'),
  ('16000000-0000-0000-0000-000000000002', 'applicants-worker-a@labiebelle.test'),
  ('16000000-0000-0000-0000-000000000003', 'applicants-worker-b@labiebelle.test'),
  ('16000000-0000-0000-0000-000000000004', 'applicants-worker-c@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status, inactivity_anchor_at) values
  ('16000000-0000-0000-0000-000000000001', '신청관리자', '01060000001', 'male', '1985-01-01', 'active', now()),
  ('16000000-0000-0000-0000-000000000002', '지원자', '01060000002', 'female', '1990-02-02', 'active', now()),
  ('16000000-0000-0000-0000-000000000003', '지원자', '01060000003', 'male', '1991-03-03', 'active', now()),
  ('16000000-0000-0000-0000-000000000004', '철회자', '01060000004', 'female', '1992-04-04', 'active', now());

insert into public.profile_roles (profile_id, role, granted_by) values
  ('16000000-0000-0000-0000-000000000001', 'admin', null);

-- =====================================================================
-- 픽스처: 스케줄 2건 — 신청 3건(X)·신청 0건(Y)
-- =====================================================================

insert into schedules (work_date, application_deadline) values
  ('2099-11-01', '2099-11-01'),
  ('2099-11-02', '2099-11-02');

insert into applications (schedule_id, profile_id, status)
select id, '16000000-0000-0000-0000-000000000002', 'applied'
from schedules where work_date = '2099-11-01';

insert into applications (schedule_id, profile_id, status)
select id, '16000000-0000-0000-0000-000000000003', 'applied'
from schedules where work_date = '2099-11-01';

insert into applications (schedule_id, profile_id, status)
select id, '16000000-0000-0000-0000-000000000004', 'applied'
from schedules where work_date = '2099-11-01';

update applications set status = 'withdrawn'
where schedule_id = (select id from schedules where work_date = '2099-11-01')
  and profile_id = '16000000-0000-0000-0000-000000000004';

-- =====================================================================
-- AC2: 관리자 조회 — 철회자 제외·동명이인 포함·0명 스케줄
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select p.name from applications a
      join profiles p on p.id = a.profile_id
    where a.schedule_id = (select id from schedules where work_date = '2099-11-01')
      and a.status = 'applied'
    order by p.name$$,
  $$values ('지원자'::text), ('지원자'::text)$$,
  'AC2: 신청 현황 조회는 동명이인 applied 2명을 모두 포함하고 철회자는 제외한다'
);

select is(
  (
    select count(*)::int from applications a
      join profiles p on p.id = a.profile_id
    where a.schedule_id = (select id from schedules where work_date = '2099-11-01')
      and a.status = 'applied'
      and p.id = '16000000-0000-0000-0000-000000000004'
  ),
  0,
  'AC2: 철회자 본인 행은 applied 목록에 어떤 형태로도 나타나지 않는다'
);

select is(
  (
    select count(*)::int from applications a
      join profiles p on p.id = a.profile_id
    where a.schedule_id = (select id from schedules where work_date = '2099-11-02')
      and a.status = 'applied'
  ),
  0,
  'AC2 경계값: 신청 0명 스케줄의 조회 결과는 빈 목록이다'
);

select is(
  (
    select count(*)::int from applications
    where status = 'applied'
      and schedule_id in (
        select id from schedules where work_date in ('2099-11-01', '2099-11-02')
      )
  ),
  2,
  'AC1: 월 범위 집계 쿼리는 applied 2건만 센다(철회자 제외)'
);

select is(
  (
    select count(*)::int from applications
    where status = 'applied'
      and schedule_id = (select id from schedules where work_date = '2099-11-02')
  ),
  0,
  'AC1 경계값: 신청 0건 스케줄은 집계에 행을 만들지 않는다'
);

reset role;

-- =====================================================================
-- AC2 권한: 비관리자는 본인 신청만 조회된다(RLS)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000002', true);

select is(
  (
    select count(*)::int from applications
    where schedule_id = (select id from schedules where work_date = '2099-11-01')
      and status = 'applied'
  ),
  1,
  'AC2 권한: 비관리자가 같은 조회를 실행하면 RLS로 본인 신청 행만 보인다'
);

select is(
  (
    select count(*)::int from applications a
      join profiles p on p.id = a.profile_id
    where a.schedule_id = (select id from schedules where work_date = '2099-11-01')
      and a.status = 'applied'
      and p.id = '16000000-0000-0000-0000-000000000003'
  ),
  0,
  'AC2 권한: 비관리자에게는 다른 신청자의 이름이 조인되어 보이지 않는다'
);

reset role;

select * from finish();
rollback;
