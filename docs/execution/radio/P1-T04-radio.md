# P1-T04 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-06
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. 기획 인터뷰 확정(권한 판정 DB 정본 단일화·worker 암묵·bootstrap 자동 active와 pending 승격·/admin 셸과 임명 최소 화면·감사 기록 최초 도입) 반영. 기존 pgTAP의 정책 개수 고정 단언(05, exactly two policies)과의 충돌을 설계에 명시. |

- 관련 spec: PRD:AC-12, DOMAIN:IDENTITY, ADR:0002
- 적용 깊이: 심화 (권한 판정 정본의 최초 확립 — 이후 모든 RLS·서버 검사가 이 위에 선다)
- test mode: tdd
- 예정 check IDs: role-rls, super-admin-bootstrap (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① 역할 저장·판정 마이그레이션(`profile_role` enum 2종, `profile_roles` 테이블, `effective_roles()` 정본 함수와 래퍼, 임명·해제·bootstrap SECURITY DEFINER 함수, `identity_audit_logs`, profiles admin 조회 정책) + pgTAP ② bootstrap 소비(콜백 로그인 경로·가입 제출 경로) ③ `/admin` 셸(관리자 홈)과 `/admin/roles` 임명·해제 화면 ④ 역할 소비 계층(`role.ts` 값 집합, `find-own-roles`, `require-admin`·`require-super-admin`, 서비스 롤 클라이언트) ⑤ 더보기 화면의 관리자 진입 링크 ⑥ E2E·pgTAP 확장.
- 비목표(기획 승인 그대로): 슈퍼 관리자의 화면 임명·해제(env가 유일 정본), 다중 슈퍼 관리자, 역할 변경 알림(P4), 감사 조회 화면(P7-T03), 휴면 전이(P1-T06), 범용 `can(role, action)` 매트릭스(P2~P3에서 파생 구조 위에 얹기), 가입 승인·거절(P1-T03). 설계 비목표: proxy 수정(인증만 유지), JWT 커스텀 클레임(역할은 매 요청 DB 판정), 기존 가입 검증·게이트 의미 변경.

### 불변 규칙

- **권한 판정의 정본은 DB다.** 파생 규칙(활성이면 worker + 부여분, super_admin은 admin을 포함해 전개)은 `effective_roles()` 한 곳에만 존재한다. RLS 래퍼(`is_admin`·`is_super_admin`)와 앱(`own_effective_roles()` RPC 결과 소비) 모두 이 함수를 소비하고, 앱은 역할을 계산하지 않는다. 검증(입력)의 "앱 정본 + DB 방어 투영"(P1-T02)과 구분되는 원칙: 검증은 앱 정본, 권한은 DB 정본.
- 역할 저장은 admin·super_admin 부여분만이다. worker는 저장하지 않으며 근무자 판정 근거는 `profiles.status = 'active'`다. `profile_roles`에 직접 쓰기 정책을 만들지 않는다 — 모든 쓰기는 SECURITY DEFINER 함수(임명·해제·bootstrap)를 경유해 권한 확인과 감사 기록을 원자적으로 수행한다(DOMAIN: 역할 변경은 권한 확인과 감사 기록을 함께 저장).
- 역할 변경은 즉시 효력을 가진다: JWT에 역할을 굽지 않고 매 요청 DB에서 판정한다(인수 조건 "역할 변경 후 세션과 RLS 결과가 일치" 충족 수단).
- Server Action 실패는 `{ ok: false, code }`(레지스트리 ErrorCode)다(`DEV-ERR-08`). 역할 거부는 기존 `COMMON_FORBIDDEN`을 소비하고 신설 코드는 만들지 않는다.
- 기존 pgTAP `05-profiles-rls.test.sql`의 "profiles has exactly two policies" 단언은 admin 조회 정책 추가로 3이 된다 — 단언 수치만 갱신하고 기존 정책의 의미 단언(본인 select·본인 pending insert·타인 차단)은 불변이다. 타인 차단 단언은 역할 없는 사용자 기준으로 유지된다.
- 기존 E2E 시나리오(가입·게이트·로그인)는 의미 불변으로 유지된다. 기존 E2E 사용자 이메일은 `SUPER_ADMIN_EMAIL`과 겹치지 않아 bootstrap의 영향을 받지 않는다. env 불일치 시 bootstrap 경로는 완전 무동작이다.
- P1-T01 인증 경계(proxy·getUser·fail-closed)와 P1-T02 가입 검증·상태 가드의 의미는 바뀌지 않는다. `(protected)/layout.tsx`의 프로필 게이트는 그대로 두고, `/admin` 하위에 역할 가드를 중첩한다.

### 기술 인수 조건

1. `effective_roles()`가 사례 표를 만족한다: 활성 일반인 → `{worker}` · 활성+admin 부여 → `{worker,admin}` · 활성+super_admin 부여 → `{worker,admin,super_admin}`(계층 전개) · pending·휴면 등 비활성 부여자 → `{}` · 무프로필 → `{}`. pgTAP이 전 사례를 단언한다.
2. bootstrap 신규 경로: `SUPER_ADMIN_EMAIL` 일치자가 온보딩 폼을 제출하면 pending 생성 직후 active로 승격되고 super_admin이 부여되며 감사 기록이 남고 홈으로 이동한다. 승격 실패(서비스 장애) 시 pending으로 남아 `/pending`으로 가고, 다음 로그인 콜백에서 재시도로 수렴한다.
3. bootstrap 승격 경로: env 일치자가 이미 pending 프로필로 존재하면 로그인 콜백에서 active 승격 + super_admin 부여 + 감사 기록이 수행된다. bootstrap은 멱등이다 — 재로그인 시 상태·역할 무변화, 감사 기록 중복 생성 없음.
4. 슈퍼 관리자가 `/admin/roles`에서 active 근무자 목록과 현재 역할을 보고 admin 임명·해제할 수 있으며, 임명·해제는 처리자·시각과 함께 감사 기록에 남는다. 임명 대상은 active만이다(비활성 대상 임명은 함수가 거부).
5. 해제는 즉시 효력을 가진다: 세션을 유지한 채 해제된 admin의 `/admin` 접근과 관리자 Server Action 호출이 다음 요청부터 거부된다(E2E).
6. 권한 강제가 서버 경계와 DB 양쪽에서 성립한다: 일반 admin의 임명·해제 호출이 코드와 함께 거부되고(서버) 함수 직접 호출도 예외로 거부되며(pgTAP), 비관리자의 `/admin` 접근은 홈으로, 일반 admin의 `/admin/roles` 접근은 `/admin`으로 보내진다. `profile_roles` 직접 insert·update·delete는 정책 부재로 거부된다. 임명·해제 함수는 admin만 취급하므로 super_admin을 부여·해제하는 사용자 경로가 존재하지 않는다.
7. 감사 기록: bootstrap 승격·임명·해제가 각각 이벤트 행(처리자·대상·역할·시각)을 남기고, 개인정보(이름·휴대폰·생년월일)는 detail에 기록되지 않는다.
8. 더보기 화면에 관리자 진입 링크가 역할 보유자에게만 노출되고, 비보유자 화면에는 나타나지 않는다.
9. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과. 기존 E2E와 05 pgTAP(정책 수 3 갱신)이 계속 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 판정 정본 | 테스트함 — 활성 일반인·활성+admin·활성+super 전개를 pgTAP으로 | 테스트함 — 무프로필 uid가 빈 배열 | 테스트함 — pending·dormant 부여자가 빈 배열(상태가 역할을 끔) | 테스트함 — own_effective_roles()가 본인 것만 반환하고 effective_roles(uid) 직접 실행은 authenticated에 거부 | 해당 없음 — 조회는 상태를 만들지 않는다 | 해당 없음 — stable 함수의 요청별 독립 판정이다 |
| 2 bootstrap 신규 | 테스트함 — env 일치자 제출→active·super_admin·감사·홈 도달 E2E | 테스트함 — 승격 RPC 실패 시 pending 유지·/pending 이동(액션 단위 테스트) | 테스트함 — env 대소문자 차이 이메일 일치 판정 단위 테스트 | 테스트함 — bootstrap 함수가 service_role 전용임을 pgTAP으로(authenticated 실행 거부) | 테스트함 — 제출 재호출은 기존 프로필 보유 코드로 거부(P1-T02 계약 유지) | 해당 없음 — 부여·승격 멱등이라 경합 결과가 수렴한다(3행이 소유) |
| 3 bootstrap 승격 | 테스트함 — 기가입 pending 일치자 로그인→승격·부여·감사 | 테스트함 — RPC 실패 시 콜백이 기존 흐름대로 진행(로그인은 성공, pending 유지) | 테스트함 — 비일치 이메일 로그인은 완전 무동작(기존 콜백 테스트 불변) | 테스트함 — 승격이 서비스 롤 경유임을 단위 테스트로(사용자 세션은 status 변경 불가 — 기존 RLS) | 테스트함 — 재로그인 멱등: 상태·역할 무변화·감사 중복 없음 pgTAP | 테스트함 — 같은 사용자 동시 콜백에도 unique(PK)와 조건부 갱신으로 최종 상태 동일 pgTAP |
| 4 임명·해제 | 테스트함 — 슈퍼가 목록에서 임명·해제, 목록 반영 E2E | 테스트함 — 비활성 대상 임명이 함수에서 거부 pgTAP | 테스트함 — 이미 admin인 대상 재임명이 무변화·감사 중복 없음 | 테스트함 — 일반 admin의 함수 호출이 예외로 거부 pgTAP + 액션 거부 단위 테스트 | 테스트함 — 해제 재호출이 무변화로 수렴 | 테스트함 — 동시 임명이 PK(profile_id, role)로 단일 행 수렴 pgTAP |
| 5 해제 즉시 효력 | 테스트함 — 해제 직후 같은 세션의 /admin 접근·액션 거부 E2E | 테스트함 — 해제된 admin의 Server Action이 COMMON_FORBIDDEN 반환 | 해당 없음 — 즉시성은 매 요청 DB 판정 구조 자체가 보장하고 그 구조를 5행 E2E가 검증한다 | 테스트함 — 판정 입력이 JWT가 아니라 DB 조회임을 단위 테스트로 | 해당 없음 — 거부 응답은 멱등 판정이다 | 해당 없음 — 요청별 독립 판정이다 |
| 6 권한 강제 | 테스트함 — 슈퍼 경로 허용·비슈퍼 경로 거부의 대칭을 서버·DB 각각 | 테스트함 — 직접 insert·update·delete가 정책 부재로 거부 pgTAP | 테스트함 — super_admin 부여를 시도할 사용자 경로가 없음(함수 시그니처가 admin 고정) pgTAP | 테스트함 — 비관리자 /admin→홈, 일반 admin /admin/roles→/admin 리다이렉트 E2E | 해당 없음 — 거부는 상태를 만들지 않는다 | 해당 없음 — 쓰기 경로는 4행 동시성이 소유한다 |
| 7 감사 기록 | 테스트함 — 세 이벤트 각각 행 생성·처리자·대상 기록 pgTAP | 테스트함 — 함수 실패 시 감사 행도 남지 않음(원자성) pgTAP | 테스트함 — detail에 PII 필드 부재 단언 | 테스트함 — 감사 테이블 직접 select·insert가 사용자에게 거부 pgTAP | 테스트함 — 멱등 재호출은 감사 중복을 만들지 않음 | 해당 없음 — 같은 트랜잭션 기록이라 별도 경합이 없다 |
| 8 진입 노출 | 테스트함 — 역할 보유자 더보기에 링크 노출 단위 테스트 | 테스트함 — 비보유자에 링크 부재 단위 테스트 | 해당 없음 — 노출은 UI 보조이고 실 차단은 6행이 소유한다 | 테스트함 — 링크 부재가 차단 수단이 아님을 6행 서버 경계 테스트가 보장 | 해당 없음 — 정적 노출 판정이다 | 해당 없음 — 요청별 독립 렌더다 |
| 9 회귀 | 테스트함 — verify 전체·db:test 통과 | 테스트함 — 기존 E2E(가입·게이트·로그인) 갱신 없이 통과 | 테스트함 — 05 pgTAP 정책 수 3 갱신 후 기존 의미 단언 불변 | 해당 없음 — 시나리오별 권한은 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — E2E는 격리 세션을 쓴다(P1-T01 확립) |

- 보충: bootstrap 경합(2·3행)은 애플리케이션 락 없이 PK·조건부 갱신의 멱등성에 위임한다. 감사 기록의 원자성은 SECURITY DEFINER 함수가 단일 트랜잭션임을 근거로 한다.

### DEV-* 적용 상태

- `DEV-SEC`·AC-12: 권한은 서버 경계(require 헬퍼)와 DB(정책 부재 + DEFINER 함수 내부 검사) 이중 강제. UI 노출은 보조.
- `DEV-SSOT-01`: 파생 규칙은 `effective_roles()` 한 곳. 앱 역할 값 집합은 `entities/identity/model/role.ts`의 `as const` + `z.enum`(TS `enum` 키워드 금지 유지)이 소비 계약을 소유한다.
- `DEV-ERR-01`·`DEV-ERR-08`: 예상 거부는 typed Result + `COMMON_FORBIDDEN`. 신설 코드 없음.
- `DEV-CODE-08`·`DEV-CODE-09`·`DEV-ARCH-06`: 화면은 서버 컴포넌트 + 액션 배선 client leaf. 라우트 상수는 `auth-routes.config.ts` 확장. UI는 계산하지 않는다.
- `DEV-TEST-01`: 위 렌즈 표. RED→GREEN 증거를 `tdd.json`에 실제 실행 시각으로만 남긴다.

## Architecture

- `supabase/migrations/<ts>_identity_roles.sql`:
  - `profile_role` enum(`admin`·`super_admin`) — worker는 저장 값이 아니므로 DB enum에 없다(의도적 비대칭, 방어 투영은 저장 집합만).
  - `profile_roles(profile_id fk→profiles on delete cascade, role profile_role, granted_at, granted_by fk→profiles, primary key(profile_id, role))`, RLS enable, 직접 쓰기 정책 없음, select는 admin 조회 정책(`is_admin`)만.
  - `effective_roles(uid) returns text[]`(SECURITY DEFINER·stable): 비활성·무프로필 `{}`, 활성 `{worker}+부여분`, super_admin은 admin 포함 전개. `own_effective_roles()`(무인자, `auth.uid()` 고정)만 authenticated 실행 허용, `effective_roles(uid)`·임명·해제·bootstrap 함수의 실행 권한은 최소로 제한.
  - `is_admin(uid)`·`is_super_admin(uid)`: `effective_roles` 소비 래퍼 — RLS 정책이 쓴다.
  - `grant_admin_role(target)`·`revoke_admin_role(target)`(SECURITY DEFINER): 내부에서 `is_super_admin(auth.uid())` 확인, 대상 active 확인(임명), 멱등 쓰기 + 실변경 시에만 감사 insert. authenticated 실행 허용(내부 검사가 거부).
  - `bootstrap_super_admin(bootstrap_email)`(SECURITY DEFINER, **service_role 전용**): 해당 이메일 사용자에게 super_admin 멱등 부여 + pending이면 active 승격 + 실변경 시 감사. 콜백·가입 제출 두 진입점이 같은 함수 하나를 소비한다.
  - `identity_audit_logs(id, event text non-blank, actor_profile_id null 허용, target_profile_id, detail jsonb, created_at)`: RLS enable, 사용자 정책 없음(기본 거부) — 쓰기는 DEFINER 함수 내부, 조회는 P7-T03 소유. 이벤트 값 집합의 앱 정본은 z.enum, DB는 text + 비공백 CHECK(이후 task의 이벤트 추가가 마이그레이션 없이 가능 — `DEV-SSOT-04`의 투영 범위 판단).
  - `profiles`에 `profiles_select_admin`(using `is_admin(auth.uid())`) 추가 — 목록 조회 근거, P1-T05 재사용.
- `supabase/tests/07-roles.test.sql`(pgTAP): 인수 조건 1·3·4·6·7 단언. `05-profiles-rls.test.sql`: 정책 수 3 갱신.
- `src/entities/identity/model/role.ts`: `ROLE_VALUES = ["worker","admin","super_admin"] as const` + `z.enum` + `hasRole(roles, role)` 순수 멤버십 헬퍼 — 단위 테스트.
- `src/entities/identity/api/find-own-roles.ts`(server-only): getUser → `own_effective_roles()` RPC → typed Result. `api/require-admin.ts`·`api/require-super-admin.ts`(server-only): `require-active-profile` 패턴 미러 — 첫 줄 소비, 실패 시 `COMMON_FORBIDDEN`. `api/bootstrap-super-admin.ts`(server-only): env 이메일 비교(불일치 시 무동작) → 일치 시 서비스 롤 클라이언트로 RPC. 콜백 route(app)와 submit-signup(features)이 같은 헬퍼를 소비한다(features 간 직접 import 불가 제약의 해소 위치).
- `src/entities/identity/api/list-active-profiles-with-roles.ts`(server-only): admin 조회 정책 하에 active 프로필 + 부여 역할 조인 조회(임명 화면 데이터).
- `src/shared/lib/supabase-service.ts`(server-only): 서비스 롤 클라이언트 정본 — bootstrap 전용 소비를 주석 없이 이름·배치로 드러내고, `supabase-server.ts` 테스트 패턴을 미러한 단위 테스트.
- `src/features/role-management/api/grant-admin.ts`·`revoke-admin.ts`(Server Action, server-only): `requireSuperAdmin` → RPC → typed Result·revalidate. `hooks/useRoleActions.ts`: 액션 오케스트레이션. `ui/RoleActionButtons.tsx`: client leaf(배선만).
- `src/features/signup/api/submit-signup.ts`: insert(pending) 후 bootstrap 헬퍼 호출 삽입 — 승격 성공 시 홈, 아니면 기존 `/pending` redirect. 기존 검증·오류 계약 불변.
- `src/app/auth/callback/route.ts`: 교환 성공 후 bootstrap 헬퍼 호출 삽입(불일치 시 무동작). 기존 리다이렉트 분기는 승격 결과를 findOwnProfile 재조회로 자연 반영.
- `src/app/(protected)/admin/layout.tsx`: `find-own-roles` → admin 미만이면 홈 리다이렉트(역할 가드 소유). `admin/page.tsx`: 관리자 홈(최소 — 역할 관리 진입, P1-T03이 메뉴 확장). `admin/roles/page.tsx`: super_admin 아니면 `/admin` 리다이렉트 후 `AdminRolesView` 렌더.
- `src/views/admin/ui/AdminRolesView.tsx`(서버 컴포넌트): 목록 + RoleActionButtons 조립. `src/views/more/ui/MoreView.tsx`: 역할 보유 시 관리자 진입 링크 노출(서버 조회 결과 소비, UI는 조건 렌더만).
- `src/shared/config/auth-routes.config.ts`: `/admin`·`/admin/roles` 상수 추가. `route-access.ts` 공개 목록 무수정(보호가 기본값).
- `tests/e2e/roles.spec.ts`: bootstrap 완주(로그인→온보딩 제출→자동 active→/admin 진입)·임명→피임명자 진입·해제 즉시 차단·비관리자 차단. `global-setup`: `SUPER_ADMIN_EMAIL` 사용자 픽스처 추가(기존 사용자와 이메일 분리 유지).

## Data model

- `profile_roles`는 부여 사실만 저장한다(부여분·처리자·시각). 판정 결과(worker 포함 3값)는 저장하지 않고 `effective_roles()`가 도출한다.
- 앱 역할 값 집합 `ROLE_VALUES`(worker·admin·super_admin)는 `z.enum` 정본이고, DB `profile_role`(admin·super_admin)은 저장 집합의 방어 투영이다 — 두 집합의 차이(worker)는 "저장하지 않는 파생"이라는 설계 사실 자체를 표현한다.
- `identity_audit_logs.detail`에는 역할·이전 상태 등 판정 사실만 담고 PII(이름·휴대폰·생년월일)는 담지 않는다.
- `granted_by`·`actor_profile_id`는 bootstrap(시스템 수행)에서 null이다 — 이벤트 이름이 주체를 구분한다.

## Interface

- 리다이렉트 규칙: 비관리자 × `/admin/**` → 홈 · 일반 admin × `/admin/roles` → `/admin` · 해제 직후 요청부터 동일 적용. 기존 게이트 규칙(P1-T02)은 불변이고 `/admin`은 `(protected)` 하위라 프로필 게이트를 먼저 통과한다.
- `/admin/roles` UX: active 근무자 목록(이름·현재 역할 뱃지) + 행별 임명/해제 액션, 처리 결과 스낵바(레지스트리 문구). 관리자 화면 전용 디자인 정본이 없으므로 기존 토큰·`shared/ui` 컴포넌트로 최소 구성한다.
- 더보기: 역할 보유자에게만 "관리자" 진입 행 노출. 노출은 보조이고 차단은 서버 경계가 소유한다.
- 오류 표시: 거부는 `COMMON_FORBIDDEN` 문구, 원문·스택 미노출(`DEV-ERR-03`).

## Optimizations

- `/admin` 하위는 (protected) 프로필 조회 + admin 레이아웃 역할 조회로 요청당 2회 단건 조회다. 중복 제거(React cache 등)는 실측 근거가 생길 때까지 도입하지 않는다(P1-T02 전례).
- bootstrap 검사는 콜백·가입 제출에서만 실행되고(요청 경로 아님), env 불일치 시 문자열 비교 1회로 끝난다.

## 변경 허용 경로

```
src/app/**
src/views/admin/**
src/views/more/**
src/features/role-management/**
src/features/signup/**
src/entities/identity/**
src/shared/lib/**
src/shared/config/**
supabase/migrations/**
supabase/tests/**
tests/**
docs/execution/radio/P1-T04-radio.md
docs/execution/runs/P1-T04/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 관리자 화면(관리자 홈·역할 관리)의 전용 디자인 정본이 없다 — 기존 토큰·컴포넌트로 최소 구성하고 사용자가 검증 단계에서 확인한다. 결정 주체: 사용자.
- 감사 이벤트 값 집합의 확장(승인·거절 등)은 P1-T03 소유 — 이 task는 bootstrap 승격·임명·해제 3종만 선언한다.
- 로컬 `.env`의 `SUPER_ADMIN_EMAIL` 실값 설정은 사용자 소유다(현재 placeholder면 E2E가 픽스처 이메일로 대체 설정하는 방식을 구현이 확정).
