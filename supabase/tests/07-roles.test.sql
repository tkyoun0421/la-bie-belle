begin;
select plan(64);

select has_type('public', 'profile_role', 'profile_role enum');
select enum_has_labels(
  'public',
  'profile_role',
  array['admin', 'super_admin'],
  'profile_role labels'
);

select has_table('public', 'profile_roles', 'profile_roles table');
select col_is_pk('public', 'profile_roles', array['profile_id', 'role'], 'profile_roles composite pk');
select col_not_null('public', 'profile_roles', 'granted_at', 'profile_roles.granted_at not null');
select col_has_default('public', 'profile_roles', 'granted_at', 'profile_roles.granted_at has a default');
select is(
  (select relrowsecurity from pg_class where oid = 'public.profile_roles'::regclass),
  true,
  'profile_roles has row level security enabled'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'profile_roles'),
  1,
  'profile_roles has exactly one policy (admin select)'
);

select has_table('public', 'identity_audit_logs', 'identity_audit_logs table');
select col_is_pk('public', 'identity_audit_logs', 'id', 'identity_audit_logs pk');
select col_not_null('public', 'identity_audit_logs', 'target_profile_id', 'identity_audit_logs.target_profile_id not null');
select col_not_null('public', 'identity_audit_logs', 'event', 'identity_audit_logs.event not null');
select is(
  (select relrowsecurity from pg_class where oid = 'public.identity_audit_logs'::regclass),
  true,
  'identity_audit_logs has row level security enabled'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'identity_audit_logs'),
  0,
  'identity_audit_logs has zero policies (default deny, writes via definer functions only)'
);

insert into auth.users (id, email) values
  ('b0000000-0000-0000-0000-000000000001', 'roles-active-plain@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000002', 'roles-active-admin@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000003', 'roles-active-super@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000004', 'roles-pending-grant@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000005', 'roles-dormant-grant@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status) values
  ('b0000000-0000-0000-0000-000000000001', '활성일반', '01070000001', 'male', '1990-01-01', 'active'),
  ('b0000000-0000-0000-0000-000000000002', '활성어드민', '01070000002', 'male', '1990-01-01', 'active'),
  ('b0000000-0000-0000-0000-000000000003', '활성슈퍼', '01070000003', 'male', '1990-01-01', 'active'),
  ('b0000000-0000-0000-0000-000000000004', '펜딩부여', '01070000004', 'male', '1990-01-01', 'pending'),
  ('b0000000-0000-0000-0000-000000000005', '휴면부여', '01070000005', 'male', '1990-01-01', 'dormant');

insert into public.profile_roles (profile_id, role, granted_by) values
  ('b0000000-0000-0000-0000-000000000002', 'admin', null),
  ('b0000000-0000-0000-0000-000000000003', 'super_admin', null),
  ('b0000000-0000-0000-0000-000000000004', 'admin', null),
  ('b0000000-0000-0000-0000-000000000005', 'admin', null);

select is(
  effective_roles('b0000000-0000-0000-0000-000000000001'),
  array['worker']::text[],
  '활성 일반인은 worker만 가진다'
);
select is(
  effective_roles('b0000000-0000-0000-0000-000000000002'),
  array['worker', 'admin']::text[],
  '활성+admin 부여는 worker와 admin을 가진다'
);
select is(
  effective_roles('b0000000-0000-0000-0000-000000000003'),
  array['worker', 'admin', 'super_admin']::text[],
  '활성+super_admin 부여는 admin을 포함해 전개된다'
);
select is(
  effective_roles('b0000000-0000-0000-0000-000000000004'),
  array[]::text[],
  'pending 상태의 admin 부여자는 빈 배열이다(상태가 역할을 끈다)'
);
select is(
  effective_roles('b0000000-0000-0000-0000-000000000005'),
  array[]::text[],
  'dormant 상태의 admin 부여자는 빈 배열이다'
);
select is(
  effective_roles('99999999-9999-9999-9999-999999999999'),
  array[]::text[],
  '무프로필 uid는 빈 배열이다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000003', true);

select is(
  own_effective_roles(),
  array['worker', 'admin', 'super_admin']::text[],
  'own_effective_roles()는 본인 역할만 반환한다'
);
select throws_ok(
  $$select effective_roles('b0000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'effective_roles(uid) 직접 실행은 authenticated에 거부된다'
);

reset role;

insert into auth.users (id, email) values
  ('b0000000-0000-0000-0000-000000000010', 'roles-bootstrap-pending@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000011', 'roles-bootstrap-active@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status) values
  ('b0000000-0000-0000-0000-000000000010', '부트펜딩', '01070000010', 'male', '1990-01-01', 'pending'),
  ('b0000000-0000-0000-0000-000000000011', '부트액티브', '01070000011', 'male', '1990-01-01', 'active');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000010', true);
select throws_ok(
  $$select bootstrap_super_admin('roles-bootstrap-pending@labiebelle.test')$$,
  '42501',
  null,
  'bootstrap_super_admin은 service_role 전용이라 authenticated 실행이 거부된다'
);
reset role;

select is(
  bootstrap_super_admin('no-such-user@labiebelle.test'),
  false,
  '일치하는 사용자가 없으면 무동작으로 false를 반환한다'
);
select is(
  (select count(*)::int from identity_audit_logs where event = 'super_admin_bootstrap'),
  0,
  '일치하는 사용자가 없으면 감사 기록도 남지 않는다'
);

select is(
  bootstrap_super_admin('ROLES-Bootstrap-Pending@labiebelle.test'),
  true,
  'pending 일치자는 대소문자 무시하고 active로 승격되며 true를 반환한다'
);
select is(
  (select status from profiles where id = 'b0000000-0000-0000-0000-000000000010'),
  'active'::profile_status,
  'bootstrap 이후 프로필 상태가 active로 바뀐다'
);
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000010' and role = 'super_admin'),
  1,
  'bootstrap 이후 super_admin 행이 정확히 하나 생긴다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'b0000000-0000-0000-0000-000000000010'),
  1,
  'bootstrap 승격 이벤트가 감사 기록에 하나 남는다'
);
select is(
  (
    select detail ? 'name' or detail ? 'phone' or detail ? 'birth_date'
    from identity_audit_logs
    where target_profile_id = 'b0000000-0000-0000-0000-000000000010'
  ),
  false,
  'bootstrap 감사 기록 detail에는 PII 필드가 없다'
);
select is(
  (select actor_profile_id from identity_audit_logs where target_profile_id = 'b0000000-0000-0000-0000-000000000010'),
  null,
  'bootstrap은 시스템 수행이라 actor_profile_id가 null이다'
);

select is(
  bootstrap_super_admin('roles-bootstrap-pending@labiebelle.test'),
  true,
  '재로그인(재호출)도 여전히 active이므로 true를 반환한다(멱등)'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'b0000000-0000-0000-0000-000000000010'),
  1,
  '멱등 재호출은 감사 기록을 중복 생성하지 않는다'
);
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000010' and role = 'super_admin'),
  1,
  '멱등 재호출은 super_admin 행을 중복 생성하지 않는다'
);

select is(
  bootstrap_super_admin('roles-bootstrap-active@labiebelle.test'),
  true,
  '이미 active인 일치자는 승격 없이 super_admin만 부여되고 true를 반환한다'
);
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000011' and role = 'super_admin'),
  1,
  '이미 active인 일치자에게 super_admin이 정확히 한 번 부여된다'
);

insert into auth.users (id, email) values
  ('b0000000-0000-0000-0000-000000000020', 'roles-super@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000021', 'roles-target@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000022', 'roles-general-admin@labiebelle.test'),
  ('b0000000-0000-0000-0000-000000000023', 'roles-pending-target@labiebelle.test');

insert into public.profiles (id, name, phone, gender, birth_date, status) values
  ('b0000000-0000-0000-0000-000000000020', '슈퍼관리자', '01070000020', 'male', '1990-01-01', 'active'),
  ('b0000000-0000-0000-0000-000000000021', '임명대상', '01070000021', 'male', '1990-01-01', 'active'),
  ('b0000000-0000-0000-0000-000000000022', '일반관리자', '01070000022', 'male', '1990-01-01', 'active'),
  ('b0000000-0000-0000-0000-000000000023', '펜딩대상', '01070000023', 'male', '1990-01-01', 'pending');

insert into public.profile_roles (profile_id, role, granted_by) values
  ('b0000000-0000-0000-0000-000000000020', 'super_admin', null),
  ('b0000000-0000-0000-0000-000000000022', 'admin', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);

select lives_ok(
  $$select grant_admin_role('b0000000-0000-0000-0000-000000000021')$$,
  '슈퍼 관리자는 active 대상을 admin으로 임명할 수 있다'
);

reset role;
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000021' and role = 'admin'),
  1,
  '임명 후 profile_roles에 행이 정확히 하나 생긴다'
);
select is(
  (select granted_by from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000021' and role = 'admin'),
  'b0000000-0000-0000-0000-000000000020'::uuid,
  '임명 행의 granted_by가 처리자 id다'
);
select is(
  (select count(*)::int from identity_audit_logs where event = 'admin_role_granted' and target_profile_id = 'b0000000-0000-0000-0000-000000000021'),
  1,
  '임명 이벤트가 감사 기록에 하나 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select lives_ok(
  $$select grant_admin_role('b0000000-0000-0000-0000-000000000021')$$,
  '이미 admin인 대상 재임명은 예외 없이 무변화로 수렴한다'
);
reset role;
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000021' and role = 'admin'),
  1,
  '재임명 후에도 profile_roles 행은 여전히 하나다'
);
select is(
  (select count(*)::int from identity_audit_logs where event = 'admin_role_granted' and target_profile_id = 'b0000000-0000-0000-0000-000000000021'),
  1,
  '재임명은 감사 기록을 중복 생성하지 않는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select throws_ok(
  $$select grant_admin_role('b0000000-0000-0000-0000-000000000023')$$,
  '22023',
  null,
  '비활성(pending) 대상 임명은 함수가 거부한다'
);
reset role;
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000023'),
  0,
  '거부된 임명은 profile_roles에 아무 행도 남기지 않는다'
);
select is(
  (select count(*)::int from identity_audit_logs where target_profile_id = 'b0000000-0000-0000-0000-000000000023'),
  0,
  '거부된 임명은 감사 기록도 남기지 않는다(원자성)'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000022', true);
select throws_ok(
  $$select grant_admin_role('b0000000-0000-0000-0000-000000000021')$$,
  '42501',
  null,
  '일반 admin(super_admin 아님)의 임명 함수 호출은 예외로 거부된다'
);
select throws_ok(
  $$select revoke_admin_role('b0000000-0000-0000-0000-000000000021')$$,
  '42501',
  null,
  '일반 admin의 해제 함수 호출도 예외로 거부된다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select lives_ok(
  $$select revoke_admin_role('b0000000-0000-0000-0000-000000000021')$$,
  '슈퍼 관리자는 admin을 해제할 수 있다'
);
reset role;
select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000021' and role = 'admin'),
  0,
  '해제 후 profile_roles 행이 사라진다'
);
select is(
  (select count(*)::int from identity_audit_logs where event = 'admin_role_revoked' and target_profile_id = 'b0000000-0000-0000-0000-000000000021'),
  1,
  '해제 이벤트가 감사 기록에 하나 남는다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select lives_ok(
  $$select revoke_admin_role('b0000000-0000-0000-0000-000000000021')$$,
  '이미 해제된 대상 재해제는 예외 없이 무변화로 수렴한다'
);
reset role;
select is(
  (select count(*)::int from identity_audit_logs where event = 'admin_role_revoked' and target_profile_id = 'b0000000-0000-0000-0000-000000000021'),
  1,
  '재해제는 감사 기록을 중복 생성하지 않는다'
);

select is(
  (select count(*)::int from profile_roles where profile_id = 'b0000000-0000-0000-0000-000000000020' and role = 'super_admin'),
  1,
  'grant_admin_role·revoke_admin_role 어느 쪽도 super_admin 행을 건드리지 않는다'
);

create temporary table profile_roles_snapshot as
select count(*)::int as row_count from profile_roles;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select throws_ok(
  $$insert into profile_roles (profile_id, role) values ('b0000000-0000-0000-0000-000000000021', 'admin')$$,
  '42501',
  null,
  'authenticated의 profile_roles 직접 insert는 정책 부재로 거부된다'
);
select lives_ok(
  $$update profile_roles set granted_by = null$$,
  'authenticated의 profile_roles update는 오류 없이 행이 걸러진다'
);
select lives_ok(
  $$delete from profile_roles$$,
  'authenticated의 profile_roles delete도 오류 없이 행이 걸러진다'
);
reset role;
select is(
  (select count(*)::int from profile_roles),
  (select row_count from profile_roles_snapshot),
  'profile_roles의 update·delete 시도는 실제로 아무 행도 바꾸지 못했다'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select throws_ok(
  $$insert into identity_audit_logs (event, target_profile_id) values ('x', 'b0000000-0000-0000-0000-000000000021')$$,
  '42501',
  null,
  'authenticated의 identity_audit_logs 직접 insert는 정책 부재로 거부된다'
);
reset role;

set local role anon;
select is(
  (select count(*)::int from identity_audit_logs),
  0,
  'anon은 identity_audit_logs를 조회해도 아무 행도 보지 못한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000021', true);
select is(
  (select count(*)::int from identity_audit_logs),
  0,
  'admin이 아닌 authenticated도 identity_audit_logs를 조회하지 못한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000020', true);
select isnt(
  (select count(*)::int from profile_roles),
  0,
  'super_admin은 profile_roles를 조회할 수 있다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000021', true);
select is(
  (select count(*)::int from profile_roles),
  0,
  '역할이 없는 authenticated는 profile_roles를 조회하지 못한다'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000022', true);
select isnt(
  (select count(*)::int from profiles),
  1,
  'admin은 profiles_select_admin 정책으로 자신 외 다른 활성 프로필도 볼 수 있다'
);
reset role;

select * from finish();
rollback;
