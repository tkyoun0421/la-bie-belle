begin;
select plan(46);

-- =====================================================================
-- 스키마: sort_order 컬럼·get_confirmed_roster 함수 시그니처·시드 순서
-- =====================================================================

select has_column('public', 'positions', 'sort_order', 'positions.sort_order exists');
select col_type_is('public', 'positions', 'sort_order', 'integer', 'positions.sort_order type');
select has_function(
  'public', 'get_confirmed_roster', array['uuid'], 'get_confirmed_roster(uuid) exists'
);

select is((select sort_order from positions where name = '팀장'), 10, 'AC5: 팀장 sort_order=10');
select is((select sort_order from positions where name = '스캔'), 20, 'AC5: 스캔 sort_order=20');
select is((select sort_order from positions where name = '메인'), 30, 'AC5: 메인 sort_order=30');
select is((select sort_order from positions where name = '드레스'), 40, 'AC5: 드레스 sort_order=40');
select is((select sort_order from positions where name = '축가'), 50, 'AC5: 축가 sort_order=50');
select is(
  (select sort_order from positions where name = '신부 대기실'), 60, 'AC5: 신부 대기실 sort_order=60'
);
select is((select sort_order from positions where name = '드레스실'), 70, 'AC5: 드레스실 sort_order=70');
select is((select sort_order from positions where name = '매니저'), 80, 'AC5: 매니저 sort_order=80');
select is((select sort_order from positions where name = '안내'), 90, 'AC5: 안내 sort_order=90');

-- =====================================================================
-- 픽스처: 관리자·대기·미배정·정식/겸직/교육생 근무자, 신규 포지션 2종, 스케줄 4종
-- =====================================================================

insert into auth.users (id, email) values
  ('22000000-0000-0000-0000-000000000001', 'roster-admin@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000002', 'roster-pending@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000003', 'roster-unassigned@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000004', 'roster-manager@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000005', 'roster-joint@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000006', 'roster-song-trainee@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000007', 'roster-dress-trainee@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000008', 'roster-new-a@labiebelle.test'),
  ('22000000-0000-0000-0000-000000000009', 'roster-new-b@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '22000000-0000-0000-0000-000000000001', '배정표관리자', '01093000001', 'male', '1985-01-01',
    'active', now(), 20000
  ),
  (
    '22000000-0000-0000-0000-000000000002', '대기근무자', '01093000002', 'female', '1990-01-01',
    'pending', null, null
  ),
  (
    '22000000-0000-0000-0000-000000000003', '미배정근무자', '01093000003', 'male', '1991-01-01',
    'active', now(), 13000
  ),
  (
    '22000000-0000-0000-0000-000000000004', '매니저정식', '01093000004', 'male', '1992-01-01',
    'active', now(), 13000
  ),
  (
    '22000000-0000-0000-0000-000000000005', '겸직자', '01093000005', 'female', '1993-01-01',
    'active', now(), 14000
  ),
  (
    '22000000-0000-0000-0000-000000000006', '축가교육', '01093000006', 'female', '1994-01-01',
    'active', now(), 15000
  ),
  (
    '22000000-0000-0000-0000-000000000007', '드레스교육', '01093000007', 'female', '1995-01-01',
    'active', now(), 16000
  ),
  (
    '22000000-0000-0000-0000-000000000008', '가나다정식', '01093000008', 'male', '1996-01-01',
    'active', now(), 17000
  ),
  (
    '22000000-0000-0000-0000-000000000009', '라마바정식', '01093000009', 'male', '1997-01-01',
    'active', now(), 18000
  );

insert into public.profile_roles (profile_id, role, granted_by) values
  ('22000000-0000-0000-0000-000000000001', 'admin', null);

insert into positions (code, name, default_required_count, gender_requirement, is_default)
values
  (null, '가나다', 1, 'any', false),
  (null, '라마바', 1, 'any', false);

insert into schedules (work_date, application_deadline, status, planned_checkin, planned_checkout)
values
  ('2098-11-01', '2098-10-25', 'CONFIRMED', '09:00', '18:00'),
  ('2098-11-02', '2098-10-26', 'OPEN', null, null),
  ('2098-11-03', '2098-10-27', 'CLOSED', null, null),
  ('2098-11-04', '2098-10-28', 'CANCELLED', null, null);

insert into ceremonies (schedule_id, starts_at)
select id, x.t
  from schedules, lateral (values ('10:00'::time), ('14:00'::time)) as x(t)
  where work_date = '2098-11-01';

insert into scheduling_audit_logs (event, actor_profile_id, schedule_id, detail) values (
  'schedule_confirmed',
  '22000000-0000-0000-0000-000000000001',
  (select id from schedules where work_date = '2098-11-01'),
  jsonb_build_object('revision', 1, 'warnings', jsonb_build_array())
);

insert into assignments (schedule_id, profile_id) values
  (
    (select id from schedules where work_date = '2098-11-01'),
    '22000000-0000-0000-0000-000000000004'
  ),
  (
    (select id from schedules where work_date = '2098-11-01'),
    '22000000-0000-0000-0000-000000000005'
  ),
  (
    (select id from schedules where work_date = '2098-11-01'),
    '22000000-0000-0000-0000-000000000008'
  ),
  (
    (select id from schedules where work_date = '2098-11-01'),
    '22000000-0000-0000-0000-000000000009'
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-11-01')
        and profile_id = '22000000-0000-0000-0000-000000000004'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-11-01')
        and profile_id = '22000000-0000-0000-0000-000000000005'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-11-01')
        and profile_id = '22000000-0000-0000-0000-000000000005'
    ),
    (select id from positions where name = '축가')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-11-01')
        and profile_id = '22000000-0000-0000-0000-000000000008'
    ),
    (select id from positions where name = '가나다')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2098-11-01')
        and profile_id = '22000000-0000-0000-0000-000000000009'
    ),
    (select id from positions where name = '라마바')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id) values
  (
    (select id from schedules where work_date = '2098-11-01'),
    (select id from positions where name = '축가'),
    '22000000-0000-0000-0000-000000000006'
  ),
  (
    (select id from schedules where work_date = '2098-11-01'),
    (select id from positions where name = '드레스'),
    '22000000-0000-0000-0000-000000000007'
  );

-- =====================================================================
-- AC2: 권한 — 비로그인·대기 근무자는 42501, 미배정 승인 근무자·admin은 성공
-- =====================================================================

set local role anon;
select throws_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-01'))$$,
  '42501',
  null,
  'AC2: 비로그인 호출은 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-01'))$$,
  '42501',
  '승인된 근무자만 열람할 수 있습니다',
  'AC2: 승인 전(pending) 근무자 호출은 42501로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-01'))$$,
  'AC2: 그날 미배정된 승인 근무자의 호출은 성공한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-01'))$$,
  'AC2 권한 경계: admin 호출도 성공한다(기존 권한 축소 없음)'
);
reset role;

-- =====================================================================
-- AC3: 상태 게이트 — CONFIRMED가 아니면 LB031, 존재하지 않으면 22023
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-02'))$$,
  'LB031',
  '아직 확정되지 않은 스케줄이에요',
  'AC3: OPEN 스케줄 조회는 LB031로 거부된다'
);
select throws_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-03'))$$,
  'LB031',
  '아직 확정되지 않은 스케줄이에요',
  'AC3: CLOSED 스케줄 조회는 LB031로 거부된다'
);
select throws_ok(
  $$select get_confirmed_roster((select id from schedules where work_date = '2098-11-04'))$$,
  'LB031',
  '아직 확정되지 않은 스케줄이에요',
  'AC3: CANCELLED 스케줄 조회는 LB031로 거부된다'
);
select throws_ok(
  $$select get_confirmed_roster('00000000-0000-0000-0000-000000000000'::uuid)$$,
  '22023',
  '스케줄을 찾을 수 없습니다',
  'AC3: 존재하지 않는 스케줄은 22023으로 거부된다'
);
reset role;

-- =====================================================================
-- AC1: 필드 경계 — 최상위 6개 키, roster 행은 5개 키만, 금지 필드 부재
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000003', true);

select ok(
  (select get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ? 'planned_checkin'),
  'AC1: 응답에 planned_checkin 키가 있다'
);
select ok(
  (select get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ? 'planned_checkout'),
  'AC1: 응답에 planned_checkout 키가 있다'
);
select ok(
  (select get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ? 'ceremonies'),
  'AC1: 응답에 ceremonies 키가 있다'
);
select ok(
  (select get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ? 'roster'),
  'AC1: 응답에 roster 키가 있다'
);
select ok(
  (select get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ? 'revision'),
  'AC1(P3-T09): 응답에 revision 키가 있다'
);
select ok(
  (select get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ? 'revised_at'),
  'AC1(P3-T09): 응답에 revised_at 키가 있다'
);
select is(
  (
    select count(*)::int from jsonb_object_keys(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01'))
    )
  ),
  6,
  'AC1: 응답 최상위 키는 planned_checkin·planned_checkout·ceremonies·roster·revision·revised_at 6개뿐이다'
);
select is(
  (
    select (get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ->> 'revision')::int
  ),
  1,
  'AC1(P3-T09): revision 값은 픽스처 그대로 1이다'
);
reset role;
select is(
  (
    select (
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) ->> 'revised_at'
    )::timestamptz
  ),
  (
    select created_at from scheduling_audit_logs
    where schedule_id = (select id from schedules where work_date = '2098-11-01')
      and event = 'schedule_confirmed'
    order by seq desc limit 1
  ),
  'AC1(P3-T09): revised_at은 schedule_confirmed 감사의 시각으로 대체된다(변경 이력이 없을 때)'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000003', true);

select ok(
  (
    select bool_and(
      (select array_agg(k order by k) from jsonb_object_keys(elem) as k)
        = array['is_self', 'is_trainee', 'name', 'position_name', 'sort_order']
    )
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
  ),
  'AC1: roster 각 행은 name·position_name·sort_order·is_trainee·is_self 다섯 키만 가진다'
);
select ok(
  (
    select bool_and(
      (select array_agg(k order by k) from jsonb_object_keys(elem) as k)
        = array['is_self', 'is_trainee', 'name', 'position_name', 'sort_order']
    )
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
    where (elem ->> 'is_trainee')::boolean
  ),
  'AC1 경계값: 교육생 행도 같은 필드 집합만 가진다'
);
select ok(
  not (
    select bool_or(elem ? 'hourly_wage')
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
  ),
  'AC1: roster 행에 hourly_wage 키가 없다'
);
select ok(
  not (
    select bool_or(elem ? 'hourly_wage_snapshot')
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
  ),
  'AC1: roster 행에 hourly_wage_snapshot 키가 없다'
);
select ok(
  not (
    select bool_or(elem ? 'phone')
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
  ),
  'AC1: roster 행에 phone 키가 없다'
);
select ok(
  not (
    select bool_or(elem ? 'birth_date')
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
  ),
  'AC1: roster 행에 birth_date 키가 없다'
);
select ok(
  not (
    select bool_or(elem ? 'gender')
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
  ),
  'AC1: roster 행에 gender 키가 없다'
);

-- =====================================================================
-- AC4: 그룹 내용 — 겸직 중복 등장, 교육생 소속 포지션 표시, 빈 포지션 배제
-- =====================================================================

select is(
  (
    select jsonb_array_length(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    )
  ),
  7,
  'AC4: roster 총 7행(매니저 2·축가 2·드레스 1·가나다 1·라마바 1)이다'
);
select is(
  (
    select count(*)::int
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
    where elem ->> 'position_name' = '매니저'
  ),
  2,
  'AC4: 매니저 포지션에 정식 배정자 2명(매니저정식·겸직자)이 등장한다'
);
select is(
  (
    select count(*)::int
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
    where elem ->> 'position_name' = '축가'
  ),
  2,
  'AC4: 축가 포지션에 정식 겸직자 1명과 교육생 1명이 등장한다'
);
select is(
  (
    select count(*)::int
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
    where elem ->> 'position_name' = '드레스'
      and (elem ->> 'is_trainee')::boolean
  ),
  1,
  'AC4 경계값: 정식 배정자 없이 교육생만 있는 드레스 포지션도 응답에 담당자 없음 상태로 나온다'
);
select is(
  (
    select count(*)::int
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
    where elem ->> 'position_name' = '안내'
  ),
  0,
  'AC4: 정식도 교육생도 없는 안내 포지션은 응답에서 빠진다'
);
select is(
  (
    select count(*)::int
    from jsonb_array_elements(
      get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
    ) as elem
    where elem ->> 'name' = '겸직자'
  ),
  2,
  'AC4: 겸직자는 맡은 두 포지션(매니저·축가) 그룹에 각각 등장한다'
);

-- =====================================================================
-- AC5: 정렬 — sort_order 오름차순, 동률은 포지션명 보조 정렬
-- =====================================================================

select is(
  (select sort_order from positions where name = '가나다'), 1000, 'AC5 경계값: 신규 포지션 sort_order 기본값 1000'
);
select ok(
  (
    with response as (
      select
        get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
          as roster
    ),
    ordered as (
      select elem, row_number() over () as rn
      from response, jsonb_array_elements(response.roster) as elem
    ),
    resorted as (
      select elem, row_number() over (
        order by (elem ->> 'sort_order')::int, elem ->> 'position_name', elem ->> 'name'
      ) as rn
      from ordered
    )
    select bool_and(o.elem = r.elem) from ordered o join resorted r using (rn)
  ),
  'AC5: roster 응답이 sort_order·포지션명·이름 순으로 이미 정렬되어 있다'
);
select ok(
  (
    select min(rn) from (
      select
        row_number() over () as rn,
        elem ->> 'position_name' as position_name
      from jsonb_array_elements(
        get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
      ) as elem
    ) as indexed
    where position_name = '가나다'
  ) < (
    select min(rn) from (
      select
        row_number() over () as rn,
        elem ->> 'position_name' as position_name
      from jsonb_array_elements(
        get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
      ) as elem
    ) as indexed
    where position_name = '라마바'
  ),
  'AC5 경계값: sort_order 동률(신규 포지션 기본값 1000)인 가나다·라마바는 포지션명 이름순으로 정렬된다'
);

-- =====================================================================
-- AC2 경계값: 본인 배정 근무자와 미배정 근무자의 응답은 is_self만 다르다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000003', true);

create temporary table roster_snapshot_unassigned as
select jsonb_agg(elem - 'is_self') as roster_without_self
from jsonb_array_elements(
  get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
) as elem;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000004', true);

create temporary table roster_snapshot_assigned as
select jsonb_agg(elem - 'is_self') as roster_without_self
from jsonb_array_elements(
  get_confirmed_roster((select id from schedules where work_date = '2098-11-01')) -> 'roster'
) as elem;
reset role;

select is(
  (select roster_without_self from roster_snapshot_unassigned),
  (select roster_without_self from roster_snapshot_assigned),
  'AC2 경계값: is_self를 제외하면 미배정 근무자와 본인 배정 근무자의 응답이 동일하다'
);

select * from finish();
rollback;
