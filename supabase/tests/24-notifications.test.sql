begin;
select plan(80);

-- =====================================================================
-- AC1 스키마: enum·테이블·컬럼·기본값·PK (unique 제약은 AC4에서 행동으로 검증)
-- =====================================================================

select has_type('public', 'notification_outbox_status', 'notification_outbox_status enum');
select enum_has_labels(
  'public', 'notification_outbox_status',
  array['PENDING', 'SENT', 'FAILED', 'DEAD'],
  'notification_outbox_status labels'
);

select has_table('public', 'notifications', 'notifications table');
select col_is_pk('public', 'notifications', 'id', 'notifications pk');
select col_not_null('public', 'notifications', 'recipient_id', 'notifications.recipient_id not null');
select col_not_null('public', 'notifications', 'event_type', 'notifications.event_type not null');
select col_not_null('public', 'notifications', 'aggregate_id', 'notifications.aggregate_id not null');
select col_not_null('public', 'notifications', 'revision', 'notifications.revision not null');
select col_not_null('public', 'notifications', 'title', 'notifications.title not null');
select col_not_null('public', 'notifications', 'body', 'notifications.body not null');
select col_not_null('public', 'notifications', 'target', 'notifications.target not null');
select col_type_is('public', 'notifications', 'target', 'jsonb', 'notifications.target type');
select col_not_null('public', 'notifications', 'created_at', 'notifications.created_at not null');
select col_has_default(
  'public', 'notifications', 'created_at', 'notifications.created_at has a default'
);
select col_type_is(
  'public', 'notifications', 'created_at', 'timestamp with time zone', 'notifications.created_at type'
);
select has_column('public', 'notifications', 'read_at', 'notifications.read_at exists');
select col_type_is(
  'public', 'notifications', 'read_at', 'timestamp with time zone', 'notifications.read_at type'
);

select has_table('public', 'notification_outbox', 'notification_outbox table');
select col_is_pk('public', 'notification_outbox', 'id', 'notification_outbox pk');
select col_not_null(
  'public', 'notification_outbox', 'notification_id', 'notification_outbox.notification_id not null'
);
select col_not_null('public', 'notification_outbox', 'status', 'notification_outbox.status not null');
select col_has_default(
  'public', 'notification_outbox', 'status', 'notification_outbox.status has a default'
);
select col_type_is(
  'public', 'notification_outbox', 'status', 'notification_outbox_status',
  'notification_outbox.status type'
);
select col_not_null(
  'public', 'notification_outbox', 'attempt_count', 'notification_outbox.attempt_count not null'
);
select col_has_default(
  'public', 'notification_outbox', 'attempt_count', 'notification_outbox.attempt_count has a default'
);
select has_column(
  'public', 'notification_outbox', 'last_error', 'notification_outbox.last_error exists'
);
select col_not_null(
  'public', 'notification_outbox', 'next_attempt_at', 'notification_outbox.next_attempt_at not null'
);
select col_has_default(
  'public', 'notification_outbox', 'next_attempt_at',
  'notification_outbox.next_attempt_at has a default'
);
select col_not_null(
  'public', 'notification_outbox', 'created_at', 'notification_outbox.created_at not null'
);
select col_has_default(
  'public', 'notification_outbox', 'created_at', 'notification_outbox.created_at has a default'
);
select has_column('public', 'notification_outbox', 'sent_at', 'notification_outbox.sent_at exists');

select has_table('public', 'push_subscriptions', 'push_subscriptions table');
select col_is_pk('public', 'push_subscriptions', 'id', 'push_subscriptions pk');
select col_not_null(
  'public', 'push_subscriptions', 'profile_id', 'push_subscriptions.profile_id not null'
);
select col_not_null('public', 'push_subscriptions', 'endpoint', 'push_subscriptions.endpoint not null');
select col_not_null('public', 'push_subscriptions', 'p256dh', 'push_subscriptions.p256dh not null');
select col_not_null('public', 'push_subscriptions', 'auth', 'push_subscriptions.auth not null');
select col_not_null(
  'public', 'push_subscriptions', 'created_at', 'push_subscriptions.created_at not null'
);
select col_has_default(
  'public', 'push_subscriptions', 'created_at', 'push_subscriptions.created_at has a default'
);
select has_column(
  'public', 'push_subscriptions', 'disabled_at', 'push_subscriptions.disabled_at exists'
);

select has_function(
  'public', 'mark_notification_read', array['uuid'], 'mark_notification_read(uuid) exists'
);
select has_function(
  'public', 'mark_all_notifications_read', array[]::text[], 'mark_all_notifications_read() exists'
);

-- =====================================================================
-- 픽스처: 관리자 1명·정식 배정자 1명·교육생 1명·무관한 사람 1명·시급없음 1명·
-- 멱등성 raw 테스트 전용 1명, 스케줄 3종(happy·rollback·배정0명 경계)
-- =====================================================================

insert into auth.users (id, email) values
  ('24000000-0000-0000-0000-000000000001', 'noti-admin@labiebelle.test'),
  ('24000000-0000-0000-0000-000000000002', 'noti-formal@labiebelle.test'),
  ('24000000-0000-0000-0000-000000000003', 'noti-trainee@labiebelle.test'),
  ('24000000-0000-0000-0000-000000000004', 'noti-outsider@labiebelle.test'),
  ('24000000-0000-0000-0000-000000000005', 'noti-wageless@labiebelle.test'),
  ('24000000-0000-0000-0000-000000000006', 'noti-idempotency@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '24000000-0000-0000-0000-000000000001', '알림관리자', '01093000001', 'male', '1985-01-01',
    'active', now(), null
  ),
  (
    '24000000-0000-0000-0000-000000000002', '정식배정자', '01093000002', 'female', '1990-01-01',
    'active', now(), 13000
  ),
  (
    '24000000-0000-0000-0000-000000000003', '교육생', '01093000003', 'male', '1991-02-02',
    'active', now(), 14000
  ),
  (
    '24000000-0000-0000-0000-000000000004', '무관한사람', '01093000004', 'female', '1992-03-03',
    'active', now(), 15000
  ),
  (
    '24000000-0000-0000-0000-000000000005', '시급없음', '01093000005', 'male', '1993-04-04',
    'active', now(), null
  ),
  (
    '24000000-0000-0000-0000-000000000006', '멱등성전용', '01093000006', 'female', '1994-05-05',
    'active', now(), 16000
  );

insert into public.profile_roles (profile_id, role, granted_by) values
  ('24000000-0000-0000-0000-000000000001', 'admin', null);

insert into schedules (work_date, application_deadline, status) values
  ('2099-12-20', '2099-12-13', 'OPEN'),
  ('2099-12-21', '2099-12-14', 'OPEN'),
  ('2099-12-22', '2099-12-15', 'OPEN');

insert into ceremonies (schedule_id, starts_at)
select id, '10:00'::time from schedules where work_date in ('2099-12-20', '2099-12-21', '2099-12-22');

update schedules
  set planned_checkin = '09:00', planned_checkout = '18:00'
  where work_date in ('2099-12-20', '2099-12-21', '2099-12-22');

insert into schedule_position_requirements (schedule_id, position_id, required_count) values
  (
    (select id from schedules where work_date = '2099-12-20'),
    (select id from positions where name = '매니저'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-20'),
    (select id from positions where name = '축가'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-21'),
    (select id from positions where name = '매니저'), 1
  ),
  (
    (select id from schedules where work_date = '2099-12-22'),
    (select id from positions where name = '매니저'), 0
  );

insert into assignments (schedule_id, profile_id) values
  (
    (select id from schedules where work_date = '2099-12-20'),
    '24000000-0000-0000-0000-000000000002'
  ),
  (
    (select id from schedules where work_date = '2099-12-21'),
    '24000000-0000-0000-0000-000000000005'
  );

insert into assignment_positions (assignment_id, position_id) values
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2099-12-20')
        and profile_id = '24000000-0000-0000-0000-000000000002'
    ),
    (select id from positions where name = '매니저')
  ),
  (
    (
      select id from assignments
      where schedule_id = (select id from schedules where work_date = '2099-12-21')
        and profile_id = '24000000-0000-0000-0000-000000000005'
    ),
    (select id from positions where name = '매니저')
  );

insert into assignment_trainees (schedule_id, position_id, profile_id) values
  (
    (select id from schedules where work_date = '2099-12-20'),
    (select id from positions where name = '축가'),
    '24000000-0000-0000-0000-000000000003'
  );

-- =====================================================================
-- AC3 롤백: 알림 테이블이 비어 있는 시점에 구조 오류(LB030)로 확정을 거부하면
-- notifications·notification_outbox 행이 전역적으로 0건이다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-21'))$$,
  'LB030',
  '시급이 설정되지 않은 근무자가 있어요',
  'AC3 준비: 시급 미설정 정식 배정자는 LB030으로 거부된다'
);
reset role;

select is(
  (select count(*)::int from notifications), 0,
  'AC3: 구조 오류로 거부된 확정 뒤에는 notifications 행이 전혀 없다'
);
select is(
  (select count(*)::int from notification_outbox), 0,
  'AC3: 구조 오류로 거부된 확정 뒤에는 notification_outbox 행이 전혀 없다'
);

-- =====================================================================
-- AC2 happy path: 정식 배정자 ∪ 교육생 전원에게 확정과 같은 트랜잭션으로
-- notifications·notification_outbox가 만들어진다(수신자 집합·title·body·target 값)
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-20'))$$,
  'AC2 happy path: 정식 배정자·교육생이 있는 스케줄이 확정된다'
);
reset role;

select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
  ),
  2,
  'AC2: 정식 배정자 1명·교육생 1명 스케줄은 확정 후 notifications 행 정확히 2개를 만든다'
);
select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
      and recipient_id = '24000000-0000-0000-0000-000000000002'
      and event_type = 'schedule_confirmed'
      and revision = 1
      and title = '근무 배정이 확정됐어요'
      and body = '12월 20일 근무가 확정됐어요'
      and target = jsonb_build_object('screen', 'schedule-detail', 'date', '2099-12-20')
  ),
  1,
  'AC2: 정식 배정자 몫 notifications 행의 title·body·target·revision이 정확히 일치한다'
);
select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
      and recipient_id = '24000000-0000-0000-0000-000000000003'
      and event_type = 'schedule_confirmed'
      and revision = 1
      and title = '근무 배정이 확정됐어요'
      and body = '12월 20일 근무가 확정됐어요'
      and target = jsonb_build_object('screen', 'schedule-detail', 'date', '2099-12-20')
  ),
  1,
  'AC2: 교육생 몫 notifications 행도 정식 배정자와 동일한 title·body·target·revision을 갖는다'
);
select is(
  (
    select count(*)::int from notification_outbox
    where notification_id in (
      select id from notifications
      where aggregate_id = (select id from schedules where work_date = '2099-12-20')
    )
  ),
  2,
  'AC2: notifications 2행 각각에 notification_outbox 행이 1:1로 만들어진다'
);
select is(
  (
    select count(*)::int from notification_outbox
    where notification_id in (
      select id from notifications
      where aggregate_id = (select id from schedules where work_date = '2099-12-20')
    )
      and status = 'PENDING'
      and attempt_count = 0
      and sent_at is null
      and next_attempt_at is not null
  ),
  2,
  'AC2: 새로 만들어진 outbox 행은 PENDING·시도 0회·미발송 상태로 시작한다'
);

select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
      and recipient_id not in (
        '24000000-0000-0000-0000-000000000002', '24000000-0000-0000-0000-000000000003'
      )
  ),
  0,
  'AC2 경계값: 정식 배정자·교육생이 아닌 사람에게는 알림이 새지 않는다'
);

-- =====================================================================
-- AC2 경계값: 배정 0명 스케줄은 알림 0건으로 확정된다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select confirm_schedule((select id from schedules where work_date = '2099-12-22'))$$,
  'AC2 경계값 준비: 배정 0명·필요 0인 스케줄도 확정된다'
);
reset role;

select is(
  (
    select count(*)::int from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-22')
  ),
  0,
  'AC2 경계값: 배정 0명 스케줄은 확정 후에도 notifications 행이 0건이다'
);

-- =====================================================================
-- AC4 멱등성: (event_type, aggregate_id, recipient_id, revision) unique가
-- DB 경계에서 강제되고, on conflict do nothing이 재기록을 무해하게 흡수한다
-- =====================================================================

insert into notifications (
  recipient_id, event_type, aggregate_id, revision, title, body, target
) values (
  '24000000-0000-0000-0000-000000000006', 'idempotency_probe',
  '24000000-0000-0000-0000-0000000000aa', 1, '멱등성 원본', '멱등성 원본 본문',
  jsonb_build_object('screen', 'pay')
);

select throws_ok(
  $$insert into notifications (recipient_id, event_type, aggregate_id, revision, title, body, target)
    values (
      '24000000-0000-0000-0000-000000000006', 'idempotency_probe',
      '24000000-0000-0000-0000-0000000000aa', 1, '멱등성 중복', '멱등성 중복 본문',
      jsonb_build_object('screen', 'pay')
    )$$,
  '23505',
  null,
  'AC4: 같은 4요소 키의 평범한 재삽입은 23505로 거부된다'
);

insert into notifications (
  recipient_id, event_type, aggregate_id, revision, title, body, target
) values (
  '24000000-0000-0000-0000-000000000006', 'idempotency_probe',
  '24000000-0000-0000-0000-0000000000aa', 1, '멱등성 중복', '멱등성 중복 본문',
  jsonb_build_object('screen', 'pay')
)
on conflict (event_type, aggregate_id, recipient_id, revision) do nothing;

select is(
  (
    select count(*)::int from notifications
    where event_type = 'idempotency_probe' and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
  ),
  1,
  'AC4: on conflict do nothing 재기록은 행을 늘리지 않는다(정확히 1행 유지)'
);
select is(
  (
    select title from notifications
    where event_type = 'idempotency_probe' and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
  ),
  '멱등성 원본',
  'AC4: 흡수된 재기록은 기존 행의 값을 바꾸지 않는다(원본 title 유지)'
);

insert into notifications (
  recipient_id, event_type, aggregate_id, revision, title, body, target
) values (
  '24000000-0000-0000-0000-000000000006', 'idempotency_probe',
  '24000000-0000-0000-0000-0000000000aa', 2, '멱등성 revision2', '멱등성 revision2 본문',
  jsonb_build_object('screen', 'pay')
)
on conflict (event_type, aggregate_id, recipient_id, revision) do nothing;

select is(
  (
    select count(*)::int from notifications
    where event_type = 'idempotency_probe' and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
  ),
  2,
  'AC4 경계값: revision만 다르면 같은 다른 3요소여도 별개 행이 새로 만들어진다'
);

select is(
  (
    select count(*)::int from notification_outbox
    where notification_id = (
      select id from notifications
      where event_type = 'idempotency_probe'
        and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
        and revision = 1
    )
  ),
  0,
  'AC4 준비: 직접 insert만으로는 notification_outbox 행이 자동으로 생기지 않는다'
);

insert into notification_outbox (notification_id)
select id from notifications
where event_type = 'idempotency_probe'
  and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
  and revision = 1;

select throws_ok(
  $$insert into notification_outbox (notification_id)
    select id from notifications
    where event_type = 'idempotency_probe'
      and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
      and revision = 1$$,
  '23505',
  null,
  'AC4: notification_outbox.notification_id unique가 평범한 재삽입을 23505로 거부한다'
);

insert into notification_outbox (notification_id)
select id from notifications
where event_type = 'idempotency_probe'
  and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
  and revision = 1
on conflict (notification_id) do nothing;

select is(
  (
    select count(*)::int from notification_outbox
    where notification_id = (
      select id from notifications
      where event_type = 'idempotency_probe'
        and aggregate_id = '24000000-0000-0000-0000-0000000000aa'
        and revision = 1
    )
  ),
  1,
  'AC4: notification_outbox도 on conflict do nothing 재기록에 행이 늘지 않는다'
);

-- =====================================================================
-- AC5 RLS: 본인 알림만 select되고, 읽음 RPC는 본인 행만 갱신하며
-- 남의 알림 id로는 0행 무해 no-op, 재읽음은 read_at을 바꾸지 않는다
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000002', true);
select is(
  (select count(*)::int from notifications),
  1,
  'AC5: 정식 배정자 본인은 select에서 자기 알림 1건만 본다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000004', true);
select is(
  (select count(*)::int from notifications),
  0,
  'AC5: 무관한 사람은 select에서 알림을 전혀 보지 못한다'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select is_empty(
  $$select 1 from notifications$$,
  'AC5: anon은 notifications를 전혀 읽지 못한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select mark_notification_read(
    (
      select id from notifications
      where aggregate_id = (select id from schedules where work_date = '2099-12-20')
        and recipient_id = '24000000-0000-0000-0000-000000000002'
    )
  )$$,
  'AC5: 남의 알림 id로 mark_notification_read를 불러도 예외 없이 무해하게 끝난다'
);
reset role;

select is(
  (
    select read_at from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
      and recipient_id = '24000000-0000-0000-0000-000000000002'
  ),
  null::timestamptz,
  'AC5: 남이 부른 mark_notification_read는 실제 소유자의 read_at을 바꾸지 못한다(0행 no-op)'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select mark_notification_read(
    (
      select id from notifications
      where aggregate_id = (select id from schedules where work_date = '2099-12-20')
        and recipient_id = '24000000-0000-0000-0000-000000000002'
    )
  )$$,
  'AC5 happy path: 본인이 부른 mark_notification_read는 성공한다'
);
reset role;

create temporary table noti_first_read (read_at timestamptz);
insert into noti_first_read (read_at)
select read_at from notifications
where aggregate_id = (select id from schedules where work_date = '2099-12-20')
  and recipient_id = '24000000-0000-0000-0000-000000000002';

select isnt(
  (select read_at from noti_first_read),
  null::timestamptz,
  'AC5: 본인 읽음 처리 뒤 read_at이 서버 시각으로 채워진다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select mark_notification_read(
    (
      select id from notifications
      where aggregate_id = (select id from schedules where work_date = '2099-12-20')
        and recipient_id = '24000000-0000-0000-0000-000000000002'
    )
  )$$,
  'AC5 재읽음: 이미 읽은 행을 다시 불러도 예외 없이 끝난다'
);
reset role;

select is(
  (
    select read_at from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
      and recipient_id = '24000000-0000-0000-0000-000000000002'
  ),
  (select read_at from noti_first_read),
  'AC5: 재읽음은 이미 읽은 행의 read_at을 덮어쓰지 않는다(멱등)'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000003', true);
select is(
  mark_all_notifications_read(),
  1,
  'AC5: 모두 읽음은 본인의 미읽음 행 수(1)를 반환한다'
);
reset role;

select is(
  (
    select read_at is not null from notifications
    where aggregate_id = (select id from schedules where work_date = '2099-12-20')
      and recipient_id = '24000000-0000-0000-0000-000000000003'
  ),
  true,
  'AC5: 모두 읽음 뒤 교육생 알림의 read_at이 채워진다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000003', true);
select is(
  mark_all_notifications_read(),
  0,
  'AC5 멱등: 이미 전부 읽은 상태에서 모두 읽음을 다시 불러도 0을 반환한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000004', true);
select is(
  mark_all_notifications_read(),
  0,
  'AC5: 알림이 없는 사람의 모두 읽음은 0을 반환하고 남의 행에 영향을 주지 않는다'
);
reset role;

-- =====================================================================
-- AC6: mark_notification_read·mark_all_notifications_read는 authenticated에만
-- grant되고 anon·service_role은 거부된다(15번 3롤 관례)
-- =====================================================================

select ok(
  has_function_privilege('authenticated', 'mark_notification_read(uuid)', 'execute'),
  'AC6: authenticated는 mark_notification_read 실행 권한을 갖는다'
);
select ok(
  not has_function_privilege('anon', 'mark_notification_read(uuid)', 'execute'),
  'AC6: anon은 mark_notification_read 실행 권한이 없다'
);
select ok(
  not has_function_privilege('service_role', 'mark_notification_read(uuid)', 'execute'),
  'AC6: service_role은 mark_notification_read 실행 권한이 없다'
);
select ok(
  has_function_privilege('authenticated', 'mark_all_notifications_read()', 'execute'),
  'AC6: authenticated는 mark_all_notifications_read 실행 권한을 갖는다'
);
select ok(
  not has_function_privilege('anon', 'mark_all_notifications_read()', 'execute'),
  'AC6: anon은 mark_all_notifications_read 실행 권한이 없다'
);
select ok(
  not has_function_privilege('service_role', 'mark_all_notifications_read()', 'execute'),
  'AC6: service_role은 mark_all_notifications_read 실행 권한이 없다'
);

select * from finish();
rollback;
