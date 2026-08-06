# P1-T02 handoff

## 2026-08-06 · 개발 종료

- 작업 식별자: P1-T02
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-06

### 확정된 사실

- RADIO는 구현 시작 전 두 차례 위계 보정을 거쳐 revision 3(SHA-256 `f3d08400ca804ba2a6f0e8a06f077833b8ca645d5c43dcf37a0950833cea6b41`)으로 재봉인됐다. 각각 조정자가 처리했다.
  - revision 2: profiles.gender에 신규 `profile_gender` enum 대신 P0-T03이 이미 예약해 둔 `gender` enum(male·female)을 재사용(`DEV-SSOT-01` MUST).
  - revision 3: `require-active-profile` 헬퍼를 `shared/lib`가 아니라 `entities/identity/api`에 둠(`DEV-ARCH-01`·`DEV-REUSE-04` MUST — shared→entities import 금지).
  - 두 건 모두 구현 시작 전 발견해 `[질문]`으로 멈췄고, 조정자가 MUST 위계로 확정·재봉인했다. `index.jsonl`의 P1-T02를 `planned → in_progress`로 전환한 뒤 구현했다.
- `supabase/migrations/20260806000100_identity_signup_profile.sql`: `profile_status` enum(5종: pending·active·rejected·dormant·departed) 신설, `profiles`에 `name`·`phone`(unique, CHECK `^01[0-9]{8,9}$`)·`gender`(기존 `gender` enum 재사용)·`birth_date`·`status`(default pending) 추가, 본인·pending insert만 허용하는 RLS 정책(`profiles_insert_own_pending`) 추가.
- `supabase/tests/06-profiles-signup.test.sql`(pgTAP 30건): enum·컬럼 스키마, phone CHECK 형식(10·11자리 경계 포함), 본인 pending insert 허용, 타인 id·비pending 상태·익명·중복 id·중복 phone insert 차단, update·delete 거부(값 단언 포함, P1-T01이 확립한 탐지력 증명 패턴).
- `supabase/tests/05-profiles-rls.test.sql`(기존 P1-T01 pgTAP)을 새 NOT NULL 컬럼에 맞춰 픽스처만 갱신했다(정책 개수 단언 1→2, insert 픽스처에 name·phone·gender·birth_date 채움). 시나리오 의미는 불변.
- `src/entities/identity/model/signup.ts`: `normalizePhone`(숫자만 정규화), `createSignupSchema(now?)`(이름 비공백, 휴대폰 형식, 성별 male·female, 생년월일 유효·미래 불가·연령 하한 없음 — Asia/Seoul 기준 "오늘" 판정, UTC 경계 테스트 포함), `toSignupFieldErrors`.
- `src/entities/identity/model/profile-gate.ts`: `PROFILE_STATUS_VALUES`(5종 z.enum), `resolveProfileGate(profile, pathname)` 순수 함수 — 무프로필→온보딩, pending·rejected·dormant·departed(비active 전체)→pending 대기 화면, active→탭(온보딩·pending 접근 시 홈).
- `src/entities/identity/api/find-own-profile.ts`: `status` 포함 조회로 확장(`{ ok: true; data: { status } | null }`), 기존 typed Result 계약 유지. 기존 소비자(`onboarding/page.tsx`, `auth/callback/route.ts`) 전부 갱신.
- `src/entities/identity/api/require-active-profile.ts`(신규, revision 3 위치): active가 아니면 `IDENTITY_NOT_ACTIVE`, 무프로필이면 `IDENTITY_PROFILE_REQUIRED`로 거부. 아직 소비하는 활성 기능이 없어 계약·테스트만 이번 task에서 확립했다(이후 task가 첫 줄에서 호출).
- `src/features/signup/api/submit-signup.ts`(Server Action): getUser→기존 프로필 있으면 `IDENTITY_PROFILE_EXISTS`→Zod 검증 실패면 `IDENTITY_VALIDATION`+fieldErrors→insert 실패 시 phone unique 위반이면 `IDENTITY_PHONE_TAKEN`(fieldErrors.phone도 채움, 인라인 표시 일관성)·그 외 `COMMON_UNEXPECTED`→성공 시 `/pending` redirect.
- `src/features/signup/hooks/useSignupForm.ts` + `src/features/signup/ui/SignupForm.tsx`(client leaf): `useActionState` 오케스트레이션은 hook이, 폼 마크업·이벤트 배선은 ui가 소유(`DEV-CODE-09`). fieldErrors가 있으면 인라인만 표시하고 전역 스낵바는 띄우지 않는다.
- `src/views/onboarding/ui/OnboardingView.tsx`(신규, 서버 컴포넌트)가 `OnboardingPlaceholderView`(구 파일·테스트 삭제)를 대체. `src/views/pending/ui/PendingView.tsx`(신규), `src/views/privacy/ui/PrivacyPolicyView.tsx`(신규, 수집 항목·이용 목적·보관 기간 초안 — 아래 미결 사항). `src/views/login/ui/LoginView.tsx`에 처리방침 링크 추가(F-14 backlog 해소).
- `src/shared/config/auth-routes.config.ts`에 `PENDING_PATH`·`PRIVACY_PATH` 추가. `src/shared/lib/route-access.ts`의 `PUBLIC_PATHS`에 `/privacy` 추가(정확 열거 유지). `src/shared/config/error-codes.config.ts`에 `IDENTITY_VALIDATION`·`IDENTITY_PROFILE_EXISTS`·`IDENTITY_PHONE_TAKEN`·`IDENTITY_PROFILE_REQUIRED`·`IDENTITY_NOT_ACTIVE` 5종 등록.
- `src/app/(tabs)/layout.tsx`(async 서버 컴포넌트, 원래도 서버 컴포넌트였다 — 별도 wrapper 분리 불필요)·`src/app/onboarding/page.tsx`·`src/app/pending/page.tsx`(신규)가 `findOwnProfile` + `resolveProfileGate`를 공유 소비한다. `src/app/privacy/page.tsx`(신규, 공개 정적 페이지). `src/app/auth/callback/route.ts`도 같은 `resolveProfileGate`를 재사용해 pending 분기를 추가했다(`resolveProfileGate(profile, HOME_PATH) ?? HOME_PATH` — active만 gate가 null을 반환하므로 폴백으로 HOME_PATH를 준다). proxy는 무수정(인증만, DB 조회 없음 유지).
- 기존 E2E 충돌 2건을 RADIO 그대로 해소했다: `tests/e2e/global-setup.ts`의 공유 세션 사용자에 active 프로필 upsert 추가, `tests/e2e/auth.spec.ts`의 두 곳(콜백 profile-있음 테스트, 로그아웃 테스트)의 profiles insert에 새 필수 컬럼과 `status: "active"`를 채웠다. 실행 중 발견한 파생 문제: E2E는 트랜잭션 롤백 없는 영속 로컬 DB라 하드코딩 휴대폰 번호가 반복 실행마다 unique 충돌을 냈다 — `randomPhone()` 헬퍼로 매 실행 임의 번호를 쓰도록 고쳤다(`auth.spec.ts`·`signup.spec.ts` 둘 다).
- `tests/e2e/signup.spec.ts`(신규 3건): 무프로필 사용자 가입 완주(폼 제출→`/pending`), pending 사용자 보호 탭 접근 차단(→`/pending`), 프로필 보유(active) 사용자의 `/onboarding` 재접근 차단(→홈, 폼 재노출·재제출 불가 — AC6 "재호출 거부"의 관찰 가능한 증거. Server Action 자체의 방어는 `submit-signup.test.ts`의 통합 테스트가 소유).
- 검증 결과: `pnpm vitest run`(전체) GREEN, `pnpm typecheck`·`pnpm lint`·`pnpm format:check` GREEN, `pnpm db:reset && pnpm db:test` GREEN(144 tests, pgTAP 05·06 포함), `pnpm build` 성공(`/privacy`는 정적, `/onboarding`·`/pending`은 동적), `pnpm test:e2e` GREEN(11/11, 2회 연속 재확인).

### 미결 사항

- 처리방침(`/privacy`) 본문 문안은 이번 task가 초안(수집 항목: 이름·휴대폰·성별·생년월일 / 이용 목적: 근무 배정·연락 / 보관: PRD ACCT-CLEANUP-01 언급 수준)을 작성했다 — 결정 주체: 사용자, 검증 단계에서 확인. RADIO 미결 사항 그대로.
- rejected 사용자 화면은 이번 task가 pending과 같은 대기 화면으로 임시 처리했다(RADIO 명시) — P1-T03이 분리 소유.
- `require-active-profile`은 계약·테스트만 확립했고 아직 소비하는 기능이 없다 — 이후 활성 기능 task(P1-T05 이후)가 첫 줄에서 호출.
- dormant·departed 상태의 `resolveProfileGate` 분기는 이번 task 범위 밖(P1-T06 전이 소유)이라 pending과 동일한 대기 화면으로 fallthrough하도록만 구현했고 별도 테스트는 없다 — P1-T06이 실제 상태 전이를 설계할 때 이 fallthrough를 재검토해야 한다. 결정 주체: 검증 단계 또는 P1-T06 설계.

### 다음 행동

1. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P1-T02-review.json`을 남긴다.
2. 위 미결 사항 중 처리방침 문안을 사용자에게 확인받는다.
3. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 커밋 이후 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- `docs/execution/runs/P1-T02/tdd.json` — RED→GREEN 16쌍(단위/통합 13쌍 + `pnpm db:test` 1쌍 + `pnpm test:e2e` 1쌍, 실행 중 발견한 추가 RED 포함).
- 구현 파일: 위 "확정된 사실" 각 경로.
- 로컬 확인: `pnpm verify`에 포함되는 각 단계(`format:check`·`lint:ci`·`typecheck`·`test`·`build`)와 `pnpm db:test`·`pnpm test:e2e`를 개별 실행해 전부 GREEN을 확인했다. `pnpm gate:all`은 커밋 스테이징 이후 실행한다.
