begin;
select plan(44);

-- =====================================================================
-- 스키마: 두 RPC 시그니처 존재(테이블·RLS 정책은 P4-T01이 만들었고 이 마이그레이션은
-- 쓰기 RPC만 더한다 — 04-rls-default-deny.test.sql·24-notifications.test.sql F-02 관례)
-- =====================================================================

select has_function(
  'public', 'save_push_subscription', array['text', 'text', 'text'],
  'save_push_subscription(text, text, text) exists'
);
select has_function(
  'public', 'remove_push_subscription', array['text'],
  'remove_push_subscription(text) exists'
);

-- =====================================================================
-- 픽스처: 근무자 계정 2명(A·B)
-- =====================================================================

insert into auth.users (id, email) values
  ('25000000-0000-0000-0000-000000000001', 'push-worker-a@labiebelle.test'),
  ('25000000-0000-0000-0000-000000000002', 'push-worker-b@labiebelle.test');

insert into public.profiles (
  id, name, phone, gender, birth_date, status, inactivity_anchor_at, hourly_wage
) values
  (
    '25000000-0000-0000-0000-000000000001', '푸시워커에이', '01094000001', 'female', '1990-01-01',
    'active', now(), 13000
  ),
  (
    '25000000-0000-0000-0000-000000000002', '푸시워커비', '01094000002', 'male', '1991-02-02',
    'active', now(), 14000
  );

-- =====================================================================
-- AC1: save_push_subscription — 신규 저장·멱등 갱신·다기기·disabled 복원·계정 전환 재지정
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select save_push_subscription('https://push.example/endpoint-1', 'p256-1', 'auth-1')$$,
  'AC1 happy path: A가 endpoint-1을 신규 저장한다'
);
reset role;

select is(
  (select count(*)::int from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  1,
  'AC1: 신규 저장 직후 endpoint-1 행이 정확히 1개다'
);
select is(
  (select profile_id from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  '25000000-0000-0000-0000-000000000001'::uuid,
  'AC1: endpoint-1의 소유자는 A다'
);
select is(
  (select p256dh from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  'p256-1',
  'AC1: endpoint-1의 p256dh 값이 저장된다'
);
select is(
  (select auth from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  'auth-1',
  'AC1: endpoint-1의 auth 값이 저장된다'
);
select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  null::timestamptz,
  'AC1: 신규 저장 행은 disabled_at이 null이다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select save_push_subscription('https://push.example/endpoint-1', 'p256-1-v2', 'auth-1-v2')$$,
  'AC1 멱등: 같은 endpoint를 A가 다시 저장해도 예외 없이 끝난다'
);
reset role;

select is(
  (select count(*)::int from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  1,
  'AC1 멱등: 같은 endpoint 재호출 뒤에도 행이 1개로 유지된다'
);
select is(
  (select p256dh from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  'p256-1-v2',
  'AC1 멱등: 재호출한 p256dh 값으로 갱신된다'
);
select is(
  (select auth from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  'auth-1-v2',
  'AC1 멱등: 재호출한 auth 값으로 갱신된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select save_push_subscription('https://push.example/endpoint-2', 'p256-2', 'auth-2')$$,
  'AC1 다기기: A가 다른 endpoint(endpoint-2)를 저장한다'
);
reset role;

select is(
  (select count(*)::int from push_subscriptions where profile_id = '25000000-0000-0000-0000-000000000001'),
  2,
  'AC1 다기기: A는 endpoint-1·endpoint-2 두 행을 갖는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select remove_push_subscription('https://push.example/endpoint-2')$$,
  'AC1 준비: endpoint-2를 해지해 disabled 상태를 만든다'
);
reset role;

select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-2') is not null,
  true,
  'AC1 준비: endpoint-2가 disabled_at을 갖는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select save_push_subscription('https://push.example/endpoint-2', 'p256-2-v2', 'auth-2-v2')$$,
  'AC1 재구독: A가 disabled였던 endpoint-2를 다시 저장한다'
);
reset role;

select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-2'),
  null::timestamptz,
  'AC1 재구독: endpoint-2의 disabled_at이 null로 복원된다'
);
select is(
  (select p256dh from push_subscriptions where endpoint = 'https://push.example/endpoint-2'),
  'p256-2-v2',
  'AC1 재구독: endpoint-2의 키 값도 재구독 값으로 갱신된다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select save_push_subscription('https://push.example/endpoint-2', 'p256-2-b', 'auth-2-b')$$,
  'AC1 계정 전환: B가 A 소유였던 endpoint-2로 저장한다(기기 재사용)'
);
reset role;

select is(
  (select profile_id from push_subscriptions where endpoint = 'https://push.example/endpoint-2'),
  '25000000-0000-0000-0000-000000000002'::uuid,
  'AC1 계정 전환: endpoint-2의 소유자가 B로 재지정된다'
);
select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-2'),
  null::timestamptz,
  'AC1 계정 전환: 재지정된 endpoint-2는 disabled_at이 null이다'
);
select is(
  (select count(*)::int from push_subscriptions where endpoint = 'https://push.example/endpoint-2'),
  1,
  'AC1 계정 전환: endpoint-2는 여전히 행 1개다(중복 생성 없음)'
);
select is(
  (select count(*)::int from push_subscriptions where profile_id = '25000000-0000-0000-0000-000000000001'),
  1,
  'AC1 계정 전환: A는 endpoint-1 하나만 남는다'
);

-- =====================================================================
-- AC2: remove_push_subscription — 본인만 disabled_at·남의 endpoint no-op·재호출 멱등·삭제 없음
-- =====================================================================

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select save_push_subscription('https://push.example/endpoint-3', 'p256-3', 'auth-3')$$,
  'AC2 준비: A가 activated 상태인 endpoint-3을 저장한다'
);
select lives_ok(
  $$select remove_push_subscription('https://push.example/endpoint-1')$$,
  'AC2 happy path: A가 본인 소유 endpoint-1을 해지한다'
);
reset role;

select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-1') is not null,
  true,
  'AC2: 해지 직후 endpoint-1의 disabled_at이 채워진다'
);

create temporary table push_first_disabled_at (disabled_at timestamptz);
insert into push_first_disabled_at (disabled_at)
select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-1';

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select remove_push_subscription('https://push.example/endpoint-1')$$,
  'AC2 멱등: 이미 disabled인 endpoint-1을 다시 해지해도 예외 없이 끝난다'
);
reset role;

select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  (select disabled_at from push_first_disabled_at),
  'AC2 멱등: 재호출은 disabled_at 시각을 바꾸지 않는다'
);
select is(
  (select count(*)::int from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  1,
  'AC2: 해지를 반복해도 행이 삭제되지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select remove_push_subscription('https://push.example/endpoint-3')$$,
  'AC2 no-op: B가 A 소유 endpoint-3 해지를 시도해도 예외 없이 끝난다'
);
reset role;

select is(
  (select disabled_at from push_subscriptions where endpoint = 'https://push.example/endpoint-3'),
  null::timestamptz,
  'AC2 no-op: 남의 endpoint 해지 시도는 0행 갱신이라 disabled_at이 그대로 null이다'
);

-- =====================================================================
-- AC3: 권한 행렬 — 두 RPC는 authenticated만 grant, push_subscriptions 직접 쓰기는 차단
-- =====================================================================

select ok(
  has_function_privilege(
    'authenticated', 'save_push_subscription(text, text, text)', 'execute'
  ),
  'AC3: authenticated는 save_push_subscription 실행 권한을 갖는다'
);
select ok(
  not has_function_privilege('anon', 'save_push_subscription(text, text, text)', 'execute'),
  'AC3: anon은 save_push_subscription 실행 권한이 없다'
);
select ok(
  not has_function_privilege(
    'service_role', 'save_push_subscription(text, text, text)', 'execute'
  ),
  'AC3: service_role은 save_push_subscription 실행 권한이 없다'
);
select ok(
  has_function_privilege('authenticated', 'remove_push_subscription(text)', 'execute'),
  'AC3: authenticated는 remove_push_subscription 실행 권한을 갖는다'
);
select ok(
  not has_function_privilege('anon', 'remove_push_subscription(text)', 'execute'),
  'AC3: anon은 remove_push_subscription 실행 권한이 없다'
);
select ok(
  not has_function_privilege('service_role', 'remove_push_subscription(text)', 'execute'),
  'AC3: service_role은 remove_push_subscription 실행 권한이 없다'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$select save_push_subscription('https://push.example/f-anon', 'p', 'a')$$,
  '42501',
  null,
  'AC3: anon이 save_push_subscription을 부르면 42501로 거부된다'
);
select throws_ok(
  $$select remove_push_subscription('https://push.example/f-anon')$$,
  '42501',
  null,
  'AC3: anon이 remove_push_subscription을 부르면 42501로 거부된다'
);
select throws_ok(
  $$insert into push_subscriptions (profile_id, endpoint, p256dh, auth)
    values (
      '25000000-0000-0000-0000-000000000001', 'https://push.example/f-anon-direct',
      'p', 'a'
    )$$,
  '42501',
  null,
  'AC3: anon은 push_subscriptions에 직접 insert할 수 없다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$insert into push_subscriptions (profile_id, endpoint, p256dh, auth)
    values (
      '25000000-0000-0000-0000-000000000001', 'https://push.example/f-auth-direct',
      'p', 'a'
    )$$,
  '42501',
  null,
  'AC3: authenticated도 push_subscriptions에 직접 insert할 수 없다(쓰기는 RPC로만)'
);
select lives_ok(
  $$update push_subscriptions set p256dh = '직접변조' where profile_id = '25000000-0000-0000-0000-000000000001'$$,
  'AC3: authenticated의 직접 update는 정책이 없어 rows are filtered, not denied'
);
reset role;

select is(
  (select p256dh from push_subscriptions where endpoint = 'https://push.example/endpoint-1'),
  'p256-1-v2',
  'AC3: 직접 update 시도는 실제로 값을 바꾸지 못했다(update 정책 없음)'
);

select * from finish();
rollback;
