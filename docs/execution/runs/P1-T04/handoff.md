# P1-T04 handoff

## 2026-08-07 · 개발 종료

- 작업 식별자: P1-T04
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- RADIO(revision 1, SHA-256 `415f58ea9df08396864900e5f24ae5b49ca2d989775cb5c5dcabf81302e2465e`)를 구현 시작 전 재확인했고 봉인 이후 변경이 없었다. 구현 중 새 제품·기술 결정은 없었다 — 아래 "확정된 사실" 끝의 두 항목(FK 모호성 수정, SUPER_ADMIN_EMAIL E2E 픽스처 방식)은 RADIO가 이미 위임한 구현 세부(미결 사항 항목, 기술적 필연)이며 새 설계 결정이 아니다.
- `supabase/migrations/20260807000000_identity_roles.sql`: `profile_role` enum(admin·super_admin), `profile_roles`(복합 PK `(profile_id, role)`, RLS enable + admin 조회 정책 1개만), `identity_audit_logs`(RLS enable, 정책 0개 — 완전 기본 거부), `effective_roles(uid)`(SECURITY DEFINER·stable, `EXECUTE`를 `anon`·`authenticated`·`service_role` 전부에서 명시적으로 회수 — Supabase가 `public` 스키마 신규 함수에 기본으로 세 role 모두에게 `EXECUTE`를 부여하는 default privilege를 갖고 있어 `revoke ... from public`만으로는 불충분함을 로컬 DB에서 직접 확인하고 세 role을 명시했다), `own_effective_roles()`(무인자, authenticated만 재부여), `is_admin`·`is_super_admin`(SECURITY DEFINER 래퍼, 기본 grant 유지 — RLS 정책이 anon 세션에서도 예외 없이 평가돼야 하므로), `grant_admin_role`·`revoke_admin_role`(SECURITY DEFINER, 내부 `is_super_admin` 확인 후 `on conflict do nothing`/`delete`+`get diagnostics`로 실변경 시에만 감사 insert), `bootstrap_super_admin(text) returns boolean`(SECURITY DEFINER, `service_role` 전용, pending→active 승격과 super_admin 부여를 조건부로 수행하고 최종 active 여부를 반환 — 앱이 이 반환값으로 리다이렉트를 결정), `profiles_select_admin` 정책(`is_admin(auth.uid())`) 추가.
- `supabase/tests/07-roles.test.sql`(pgTAP 64건): AC1(판정 정본 6사례 + own/direct 권한 비대칭) · AC2/3/7(bootstrap 무일치·최초 승격+대소문자 무시·감사 1건+PII 없음+actor null·멱등 재호출·이미 active인 일치자) · AC4/5/6(임명·재임명 멱등·pending 거부(22023)·일반 admin 거부(42501)·해제·재해제 멱등·super_admin 직접 조작 경로 부재) · AC6(profile_roles/identity_audit_logs 직접 insert 거부(42501)+update/delete 무행 변경(스냅샷 비교로 검증)) · profile_roles/profiles의 admin 조회 정책 양방향(super_admin은 보임, 무역할은 안 보임)을 단언한다. `supabase/tests/05-profiles-rls.test.sql`은 정책 개수 단언만 2→3(select own·insert own pending·select admin)로 갱신했고 기존 의미 단언은 불변이다. `pnpm db:reset && pnpm db:test` GREEN(7 파일 210 tests).
- `src/entities/identity/model/role.ts`: `ROLE_VALUES`(`as const`) + `RoleValueSchema`(`z.enum`) + `hasRole` 순수 함수(TS `enum` 키워드 미사용, `GENDER_VALUES` 전례 준수).
- `src/entities/identity/api/find-own-roles.ts`: getUser 미인증 시 `COMMON_AUTH_REQUIRED`, `own_effective_roles()` RPC 호출 후 등록되지 않은 값은 걸러내고 반환. `require-admin.ts`·`require-super-admin.ts`는 `require-active-profile.ts` 패턴을 그대로 미러해 `hasRole`로 판정하고 실패 시 `COMMON_FORBIDDEN`(신설 코드 없음).
- `src/entities/identity/api/bootstrap-super-admin.ts`: `env.SUPER_ADMIN_EMAIL`과 대소문자 무시 비교(불일치·이메일 없음이면 RPC 호출 없이 무동작) 후 일치 시 `createSupabaseServiceClient()`로 `bootstrap_super_admin` RPC 호출, RPC 반환값(boolean)을 `active`로 그대로 전달. `src/shared/lib/supabase-service.ts`(신규): 서비스 롤 전용 `createClient` 래퍼(`autoRefreshToken:false`·`persistSession:false`), `supabase-server.ts` 테스트 패턴 미러.
- `src/entities/identity/api/list-active-profiles-with-roles.ts`: active 프로필 + `profile_roles` 조인 조회. `profile_roles`가 `profiles`를 두 번(`profile_id`·`granted_by`) 참조하므로 PostgREST embed가 모호해 `PGRST201`을 낸다는 사실을 E2E에서 실제로 발견했다 — `profile_roles!profile_roles_profile_id_fkey(role)`로 관계를 명시해 해소했다(아래 "발견한 기술 이슈" 참고).
- `src/features/role-management/api/grant-admin.ts`·`revoke-admin.ts`(Server Action): `requireSuperAdmin()` 선통과 후 RPC 호출, 성공 시 `revalidatePath(ADMIN_ROLES_PATH)`. `hooks/useRoleActions.ts`: `useSignOutAction` 패턴 미러(`useActionState` + 실패 시에만 스낵바). `ui/RoleActionButtons.tsx`(client leaf): admin 여부에 따라 임명/해제 버튼 배선만.
- `src/features/signup/api/submit-signup.ts`: pending insert 성공 직후 `bootstrapSuperAdmin(user.email)` 호출 → `active`면 `HOME_PATH`, 아니면 기존 `PENDING_PATH`. `src/app/auth/callback/route.ts`: 코드 교환 성공 직후(findOwnProfile 재조회 전) `bootstrapSuperAdmin(data.user.email)` 호출 후 기존 흐름 그대로 진행(반환값 미사용 — 승격 결과는 뒤이은 `findOwnProfile` 재조회가 자연히 반영, RADIO 설계 그대로).
- `src/app/(protected)/admin/layout.tsx`: `requireAdmin()` 미만이면 `HOME_PATH` 리다이렉트. `admin/page.tsx`: 관리자 홈 최소판(역할 관리 진입 링크 하나, `views/*` 없이 직접 마크업 — RADIO 파일 목록이 `admin/roles`에만 전용 view를 명시). `admin/roles/page.tsx`: `requireSuperAdmin()` 미만이면 `ADMIN_PATH` 리다이렉트 후 `listActiveProfilesWithRoles()` 조회 결과로 `AdminRolesView` 렌더(조회 실패 시 `ErrorScreen`).
- `src/views/admin/ui/AdminRolesView.tsx`: 목록 + 행별 배지·액션 조립(서버 컴포넌트). `super_admin` 행은 액션 버튼 자체를 렌더하지 않는다(화면 임명·해제는 명시적 비목표). `src/views/admin/model/role-label.ts`(신규): 역할 배지 문구 판정 순수 함수 — 애초 `ui` 파일에 인라인으로 뒀다가 `DEV-CODE-09`(ui는 계산·분기 판정을 소유하지 않는다) 위반을 자체 발견해 `model`로 이동했다.
- `src/entities/identity/types/active-profile.ts`(신규, `types` 세그먼트 최초 실사용): `ActiveProfileWithRoles` DTO. 애초 `api/list-active-profiles-with-roles.ts`에 뒀다가 `ui`가 `api`를 import할 수 없다는 `project/segment-imports` lint를 만나 순수 타입 전용 파일로 분리했다(`profile-gate.ts`의 "DTO는 model이 소유" 전례를 좇되, 런타임 export가 전혀 없어 `unitTest: exempt`인 `types` 세그먼트가 더 정확한 위치라고 판단).
- `src/views/more/ui/MoreView.tsx`: `roles: RoleValue[]` prop 추가, `hasRole(roles,"admin")`일 때만 관리자 진입 링크 노출(비보유자는 렌더 자체가 없음). `src/app/(protected)/(tabs)/more/page.tsx`: `findOwnRoles()` 조회 결과(실패 시 빈 배열)를 그대로 전달. `src/shared/config/auth-routes.config.ts`: `ADMIN_PATH`·`ADMIN_ROLES_PATH` 추가. `route-access.ts`(`PUBLIC_PATHS`)는 무수정 — `/admin`은 기본값대로 보호 대상이다. `proxy.ts`도 무수정(인증만, RADIO 비목표 그대로).
- E2E: `tests/e2e/support/super-admin-fixture.ts`(신규) + `playwright.config.ts`(`webServer.env`에 `SUPER_ADMIN_EMAIL` 주입) + `tests/e2e/global-setup.ts`(픽스처 auth 사용자만 idempotent 생성, 프로필은 만들지 않음) + `tests/e2e/roles.spec.ts`(신규 5건, `test.describe.serial`): bootstrap 완주(온보딩 제출→자동 active→`/admin` 진입) → 임명(목록 반영) → 임명된 admin의 `/admin` 허용·`/admin/roles` 거부 → 해제 즉시 효력(같은 세션 재요청 차단) → 비관리자 `/admin` 차단. 아래 "SUPER_ADMIN_EMAIL 로컬 실값 처리" 항목에 설계 근거를 남긴다.
- 검증 결과: `pnpm vitest run`(전체) 600 tests GREEN. `pnpm typecheck`·`pnpm lint:ci`·`pnpm format:check` GREEN. `pnpm build` 성공(`/admin`·`/admin/roles` 동적 라우트로 생성). `pnpm db:reset && pnpm db:test` GREEN(210 tests). `pnpm test:e2e` GREEN(21/21, 연속 2회 재확인 — DB 리셋 없이도 재현 가능함을 확인, SUPER_ADMIN_EMAIL이 실행마다 새로 생성되는 픽스처값이라 로컬 반복 실행에도 상태가 누적되지 않는다).

### 발견한 기술 이슈(구현 세부, 새 설계 결정 아님)

- Supabase local 인스턴스는 `public` 스키마의 신규 함수에 기본으로 `anon`·`authenticated`·`service_role` 모두에게 `EXECUTE`를 부여하는 `ALTER DEFAULT PRIVILEGES`를 갖고 있다(psql로 `pg_default_acl` 직접 조회로 확인). RADIO가 요구한 "`effective_roles(uid)`·`bootstrap_super_admin`의 실행 권한을 최소로 제한"을 만족하려면 `revoke ... from public`만으로는 불충분해 세 role을 명시적으로 나열해야 했다 — 로컬 DB에서 직접 재현·검증한 사실이며, RADIO의 "최소 제한" 요구를 실제로 달성하기 위한 구현 세부다.
- `profile_roles`가 `profiles`를 두 경로(`profile_id`·`granted_by`)로 참조해 PostgREST가 임베드 관계를 모호하게 판단(`PGRST201`)했다 — 처음 작성한 unit mock 테스트는 이 문제를 못 잡았고(모킹이라 실제 PostgREST 제약을 안 탄다), `pnpm exec playwright test roles.spec.ts` 실행에서 실제로 발견해 FK 이름을 명시하는 방식(`profile_roles!profile_roles_profile_id_fkey(role)`)으로 고쳤다. 고치기 전 상태로 되돌려 실패를 재현(RED, 00:56:12)한 뒤 복원해 통과(GREEN, 00:57:18)를 재확인했다 — `tdd.json`에 기록된 유일한 E2E 계층 RED→GREEN 쌍이다.

### SUPER_ADMIN_EMAIL 로컬 실값 처리(RADIO 미결 사항 — 구현이 확정)

- 로컬 `.env`·`.env.local`의 `SUPER_ADMIN_EMAIL`은 여전히 placeholder(`changeme@example.com`)이고 이 task는 그 값을 건드리지 않았다(실무 주의 사항 그대로 — 실 시크릿이 있는 파일을 덮어쓰지 않는다는 원칙을 이 변수에도 동일하게 적용했다).
- E2E는 `.env`/`.env.local` 값을 신뢰하지 않고, `playwright.config.ts`가 Playwright의 `webServer.env`(`{ ...process.env, SUPER_ADMIN_EMAIL }`)로 스폰되는 `pnpm start` 프로세스에만 픽스처 이메일을 주입한다. Next.js의 환경변수 로드 순서(`process.env`가 `.env*` 파일보다 우선)를 근거로 검증했다 — `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md` 확인.
- 픽스처 이메일 값 자체는 `tests/e2e/support/super-admin-fixture.ts`의 `resolveSuperAdminFixtureEmail()`이 Playwright 프로세스당 1회 `randomUUID()`로 생성하고 `process.env.E2E_SUPER_ADMIN_EMAIL`에 메모이즈한다 — config 모듈이 워커 프로세스보다 먼저 로드되므로 workers가 상속받은 `process.env`에서 같은 값을 재사용한다(재계산 없음). 매 `pnpm test:e2e` 실행마다 새 값이라 로컬 반복 실행에서 이전 실행의 잔여 상태(이미 active가 된 동일 이메일)와 충돌하지 않는다 — 실제로 DB 리셋 없이 연속 2회 실행해 확인했다.
- `global-setup.ts`는 이 픽스처 이메일로 auth 사용자만 idempotent 생성하고(RADIO Architecture 문구 "SUPER_ADMIN_EMAIL 사용자 픽스처 추가" 그대로) 프로필은 만들지 않는다 — `roles.spec.ts`의 첫 테스트가 실제 온보딩 제출을 통해 bootstrap 신규 경로(AC2)를 그대로 검증하기 위함이다.

### 미결 사항

- 관리자 화면(관리자 홈·역할 관리)의 전용 디자인 정본이 없다는 RADIO 미결 사항은 그대로다 — 기존 토큰·`shared/ui`(Badge·Button)로 최소 구성했고 사용자가 검증 단계에서 확인해야 한다. 결정 주체: 사용자.
- `SUPER_ADMIN_EMAIL`의 로컬 `.env`/`.env.local` 실값 설정은 여전히 사용자 소유다 — 이 task는 E2E가 그 값에 의존하지 않는 방식으로 설계했을 뿐, 실제 운영 환경(스테이징·프로덕션)의 `SUPER_ADMIN_EMAIL` 실값 설정은 배포 전 사용자가 직접 채워야 한다.
- 감사 이벤트 값 집합의 확장(승인·거절 등)은 RADIO가 명시한 대로 P1-T03 소유다 — 이 task는 `super_admin_bootstrap`·`admin_role_granted`·`admin_role_revoked` 3종만 선언했다.

### 다음 행동

1. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P1-T04-review.json`을 남긴다.
2. 관리자 화면 디자인 최소 구성을 사용자에게 검증 단계에서 확인받는다.
3. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고, 커밋 이후 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- `docs/execution/runs/P1-T04/tdd.json` — 실제 명령 실행의 RED→GREEN 16쌍(단위/통합 14쌍 + `pnpm db:test` 1쌍 + `pnpm exec playwright test roles.spec.ts` 1쌍) + `list-active-profiles-with-roles.test.ts`의 재확인 green 1건(FK 수정 후 재실행).
- 신규 마이그레이션: `supabase/migrations/20260807000000_identity_roles.sql`. 신규 pgTAP: `supabase/tests/07-roles.test.sql`. 갱신: `supabase/tests/05-profiles-rls.test.sql`.
- 구현 파일: 위 "확정된 사실" 각 경로 전체(`src/entities/identity/**`, `src/features/role-management/**`, `src/features/signup/api/submit-signup.ts`, `src/app/auth/callback/route.ts`, `src/app/(protected)/admin/**`, `src/views/admin/**`, `src/views/more/**`, `src/shared/lib/supabase-service.ts`, `src/shared/config/auth-routes.config.ts`).
- E2E: `tests/e2e/roles.spec.ts`, `tests/e2e/support/super-admin-fixture.ts`, `tests/e2e/global-setup.ts`(수정), `playwright.config.ts`(수정).
- 로컬 확인: `pnpm verify`에 포함되는 각 단계를 개별 실행해 전부 GREEN을 확인했다(`format:check`·`lint:ci`·`typecheck`·`test`·`build`·`test:e2e`). `pnpm db:reset && pnpm db:test`도 별도로 GREEN을 확인했다. `pnpm gate:index`·`gate:radio`·`gate:tdd` 개별 실행 GREEN. `pnpm gate:all`·`pnpm verify` 전체는 커밋 스테이징 직후 재실행해 최종 확인한다.

## 2026-08-07 · [질문]→revision 2 재봉인 경위

- 작업 식별자: P1-T04
- 현재 단계: 개발 종료(범위 보정) → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- 위 "개발 종료" 절의 구현을 모두 마친 뒤 최종 확인으로 `pnpm gate:scope`를 돌렸더니 `playwright.config.ts`가 revision 1의 변경 허용 경로 밖이라는 위반이 실제로 발생했다. `SUPER_ADMIN_EMAIL` E2E 픽스처 방식(RADIO 미결 사항이 위임한 결정)을 이행하려면 Playwright의 `webServer.env`로 스폰 프로세스에만 값을 주입해야 하는데, 그 설정 지점이 저장소 루트의 `playwright.config.ts`뿐이라 발생한 구조적 필연이었다.
- 이 시점에 구현을 멈추고 `[질문]`으로 상황·근거(Next.js env 로드 우선순위, 로컬 반복 실행 검증 결과)·선택지(① RADIO 허용 경로에 `playwright.config.ts` 추가 후 재봉인, ② `.env` 값을 직접 읽는 대안으로 재설계 — 로컬 반복 실행 견고성 저하 트레이드오프 동반) 두 가지를 조정자에게 반환했다.
- 조정자가 선택지 ①을 채택했다: "RADIO가 이미 위임한 결정의 이행 경로라 사용자 재량 없는 보정으로 처리했다(P1-T01 rev4 전례)." `docs/execution/radio/P1-T04-radio.md`를 revision 2(SHA-256 `2351df47bdcf46d81029feec952d4572fd230eb035a5da44e6fb6229777c7832`)로 재봉인했다 — 변경 허용 경로에 `playwright.config.ts` 한 줄 추가, 개정 이력에 보정 사유 기록, Architecture와 미결 사항 절에 확정 방식(웹서버 env 주입·실행별 무작위 픽스처·`.env` 무수정)을 동반 갱신했다. `index.jsonl`의 `development_approval`도 `radio_revision: 2`로 갱신됐다.
- 구현(webServer.env 주입 + 무작위 픽스처)은 재설계 없이 그대로 유지했다 — 재봉인은 범위 선언만 보정했을 뿐 기술 설계 자체를 바꾸지 않았다.
- `pnpm gate:scope` 재확인 GREEN(재봉인 RADIO·갱신된 index.jsonl을 함께 스테이징한 뒤 실행).

### 미결 사항

- 이전 절과 동일 — 관리자 화면 디자인 최소 구성(사용자 확인 필요), `SUPER_ADMIN_EMAIL` 운영 환경 실값 설정(사용자 소유), 감사 이벤트 확장(P1-T03 소유).

### 다음 행동

1. 이전 절과 동일 — 교차 검증, 관리자 화면 디자인 확인, `done` 전환 후 `ci-finisher` 오프로드.

### 증거·산출물 경로

- `docs/execution/radio/P1-T04-radio.md`(revision 2로 재봉인, SHA-256 `2351df47bdcf46d81029feec952d4572fd230eb035a5da44e6fb6229777c7832`).
- `docs/execution/phases/index.jsonl`의 P1-T04 `development_approval.radio_revision: 2`.

## 2026-08-07 · 조정자 검증 절(교차 검증)

- 대조: 구현 커밋 e55cb7b의 변경 파일 50개 전부가 revision 2 허용 경로 안임을 `git diff ea9b231..HEAD`로 확인. tdd.json 33개 시각 전부 커밋 이전(미래 0건), `gate:all` exit 0.
- 교차 검증: opus·codex 2자 병렬 + 상호 되물음. 확정 13건(medium 8·low 5), critical·high 0건 — REVIEW.md 수정 라운드 기본 범위(critical·high)에 따라 수정 라운드 없이 done. 기각 1건(성공 스낵바 — 레지스트리가 오류 문구만 소유, 선례 훅 미러, revalidate가 성공 신호라는 근거 반박).
- 결과: `docs/execution/reviews/P1-T04-review.json`(총점 77), backlog에 13건 누적. F-01(역할 파생 앱 중복)·F-05(픽스처)·F-09(감사 z.enum)는 P1-T03·정비 task에서 해소 후보로 표기.
