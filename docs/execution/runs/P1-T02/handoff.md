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

## 2026-08-06 · 교차 검증 수정 라운드

- 작업 식별자: P1-T02
- 현재 단계: 개발 종료(수정 라운드) → 다음 검증
- 기준 시각: 2026-08-06

교차 검증(opus·codex, `docs/execution/reviews/P1-T02-review.json`, total 77)이 확정한 13건 중 사용자 승인으로 11건(high 3·medium 6·low 2)을 수정했다. F-10(성능 low, getUser 이중 왕복)·F-13(P1-T01 backlog 처리 완료)은 제외.

### 확정된 사실 — F-02(먼저 처리): TDD 증거 재기록

- 이전 커밋(`f26c958`)의 `tdd.json`에서 `db:test`·`test:e2e` 6개 항목이 커밋 시각(22:27:43)보다 미래이고 초가 전부 `:00`·3분 등간격인 손 기입 추정값이었음을 확인했다 — 그 6개 항목만 제거했다. 나머지 13쌍(개별 vitest 파일 실행)은 실제 vitest `Start at` 출력을 그대로 옮겨 적은 기록이라 유지했다(재검증 완료, 아래 항목들과 동일 세션 연속선상의 시각이라 재현 가능).
- `db:test`·`test:e2e`는 이번 수정 라운드에서 실제로 재실행해 그 실행의 실제 시각(`date -Iseconds` 직접 캡처)으로 다시 기록했다. `pnpm exec playwright test signup.spec.ts -g "schedule/<id>"`는 F-01 규명 목적으로 실제 RED(23:09:42, 회귀 코드에서 실패 재현)와 GREEN(23:13:35, 복구 후 통과)을 모두 실제 실행에서 얻었다.
- handoff의 "16쌍" 표기가 자기 괄호 합계(15)와 어긋난 오류도 확인했다 — 아래에서 실제 개수로 다시 쓴다.

### 확정된 사실 — high

- **F-01**: 상태 가드가 `(tabs)` 밖(`src/app/schedule/[id]/page.tsx`)에 미적용되던 구조적 결함을 라우트 재배치로 해결했다. `src/app/(protected)/layout.tsx`(신규)가 `findOwnProfile` + `resolveProfileAccess`로 게이트를 소유하고, 기존 `src/app/(tabs)/**`와 `src/app/schedule/[id]/page.tsx`를 각각 `src/app/(protected)/(tabs)/**`·`src/app/(protected)/schedule/[id]/page.tsx`로 이동해 `(protected)` 하위로 편입했다(`git mv`, URL 불변 — route group은 URL에 나타나지 않는다). `(protected)/(tabs)/layout.tsx`는 이제 탭바 렌더만 소유한다(게이트 로직 제거). 앞으로 보호가 필요한 라우트는 `(protected)/` 아래에 두기만 하면 자동으로 게이트가 적용된다 — 개별 페이지 나열 방식이 아니다.
  - 탐지력 증명: `(protected)/layout.tsx`를 일시적으로 `{children}`만 반환하는 rogue 버전으로 바꾸고 빌드해 신규 회귀 테스트(pending 사용자의 `/schedule/<id>` 접근)가 실제로 실패함을 확인한 뒤(RED, 23:09:42) 원복·재빌드해 GREEN(23:13:35)을 재확인했다(P1-T01 F-07이 확립한 rogue-정책 탐지력 증명 패턴과 동일).
- **F-03**: `findOwnProfile` 실패를 코드로 구분하지 않아 인프라 장애 시 `/login`↔홈 무한 리다이렉트가 만들어지는 결함을 고쳤다. `src/entities/identity/model/profile-gate.ts`에 순수 함수 `resolveProfileAccess(lookup, pathname)`을 신설해 `COMMON_AUTH_REQUIRED`만 `/login`으로 리다이렉트하고, 그 외 모든 실패 코드는 `{ kind: "error" }`로 판정해 리다이렉트하지 않는다(`src/views/status/ui/ErrorScreen.tsx` 렌더로 대체). `(protected)/layout.tsx`·`onboarding/page.tsx`·`pending/page.tsx` 세 곳이 전부 이 함수를 소비한다. 단위 테스트로 무한 루프 부재를 고정했다 — `COMMON_AUTH_REQUIRED` 외 7개 등록 오류 코드 전부가 `redirect`가 아닌 `error`로만 판정됨을 `it.each`로 단언한다(E2E가 아니라 단위 테스트 선택 — 실제 DB 장애를 E2E로 재현하는 것보다 빠르고 결정적이며, 판정 로직 자체가 순수 함수라 단위 테스트가 최적 계층이다).

### 확정된 사실 — medium

- **F-04**: `supabase/migrations/20260806000200_identity_signup_profile_name_check.sql`(신규 — 기존 migration은 무수정, `DEV-MIG-01`)에 `profiles_name_not_blank CHECK (length(btrim(name)) > 0)`를 추가했다. `06-profiles-signup.test.sql`에 공백 이름 직접 insert 거부 단언을 추가했다(생년월일 미래 금지는 `current_date`가 STABLE이라 CHECK로 표현 불가 — finding이 이미 범위에서 제외).
- **F-05**: `tests/e2e/signup.spec.ts`에 5건 추가 — pending 사용자의 `/onboarding` 접근 차단, active 사용자의 `/pending` 접근 차단(→홈), pending 사용자의 `/schedule/<id>` 접근 차단(F-01과 공유), 그리고 Server Action 실제 재호출 거부 증명. 마지막 건은 무프로필 사용자로 `/onboarding` 폼을 로드한 뒤(언마운트 없이) 브라우저 컨텍스트의 쿠키만 이미 활성 프로필이 있는 다른 사용자 세션으로 교체하고 같은 폼을 제출해 `IDENTITY_PROFILE_EXISTS` 스낵바("이미 가입 절차를 진행했어요")가 실제로 뜨는지 확인한다 — Next.js Server Action의 내부 프로토콜을 재현하지 않고도 "제출 시점의 실제 서버측 신원 판정"을 정직하게 검증하는 방법이다.
- **F-06**: `SignupForm`의 동의 문구+제출 버튼을 `fixed inset-x-0 bottom-0` 컨테이너로 옮기고 `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]`를 적용했다(`AppShellTabBar`·`ScheduleView`와 같은 safe-area 관용구). `OnboardingView`의 여백을 `pb-28`→`pb-36`으로 늘려 2줄짜리 고정 바(문구+버튼)를 안전하게 가린다. 단위 테스트로 고정 컨테이너의 `fixed`·`bottom-0`·safe-area 클래스 존재를 잠갔다.
- **F-07**: React 19가 액션 제출 시 예약하는 `requestFormReset`이 실패 후에도 취소되지 않아 비제어 입력이 지워지는 문제를 고쳤다 — 이름·휴대폰·생년월일을 성별과 같은 방식(로컬 state + `value`/`onChange`)의 제어 컴포넌트로 전환했다. codex의 JSDOM 재현 시나리오를 그대로 회귀 테스트로 추가해(4필드 입력 → 실패 응답 → 값 보존 단언) RED(22:59:34, 실제로 값이 사라짐을 확인)→GREEN(23:00:22)을 얻었다.
- **F-08**: `06-profiles-signup.test.sql`에 phone unique 제약의 실제 이름(`profiles_phone_key`)을 `pg_constraint`로 직접 단언하는 케이스를 추가했다(코드의 문자열 매칭이 기본 명명 규칙과 실제로 일치함을 DB 경계에서 고정). `tests/e2e/signup.spec.ts`에 의도적 중복 휴대폰 케이스를 추가해 실제 로컬 스택에서 "이미 가입된 휴대폰 번호예요" 안내가 뜨는지 확인한다(기존 `randomPhone()` 시나리오는 유지).
- **F-09**: `find-own-profile.ts`·`submit-signup.ts`의 예기치 않은 DB 실패 분기에 개인정보 없는 구조화 기록을 추가했다. **구현 세부 조정(투명하게 기록)**: finding은 `console.error`를 제시했지만, 저장소의 `no-console`(zero-exception, `eslint.config.mjs` 기반, 이 RADIO의 허용 경로 밖이라 수정 불가)과 충돌해 `process.stderr.write(JSON.stringify({event, code}) + "\n")`로 대체했다 — 관측 가능성이라는 finding의 의도(코드·원인 요약, PII 미포함, 최소 구조화)는 동일하게 충족하고 어떤 기존 lint 규칙도 어기지 않는다. 로그 이벤트 태그도 `error-code-literal` 린트의 오류 코드 패턴(`^(IDENTITY|...)_[A-Z0-9_]+$`)과 겹치지 않도록 소문자(`identity_find_own_profile_failed` 등)로 정했다. 두 지점 모두 단위 테스트로 코드만 기록되고 PII(사용자 id·원본 오류 메시지)는 남지 않음을 단언한다.

### 확정된 사실 — low

- **F-11**: `SignupForm`의 `GENDER_OPTIONS` 독립 선언을 제거하고 `entities/identity/model/signup.ts`의 `GENDER_VALUES`(+ 신규 export `GenderValue`)에서 값을, `ui` 파일의 `GENDER_LABELS` 매핑에서 라벨만 파생한다.
- **F-12**: 처리방침에 "Google 계정 이메일(로그인용)" 수집 항목을 추가하고, 보관 기간 절을 PRD `ACCT-CLEANUP-01` 확정값(미승인·거절 3개월 완전 삭제, 활성·휴면 1년 자동 탈퇴, 탈퇴 시 이름·생년월일·성별 등 3년 분리 보관)으로 구체화했다. 사용자가 검증 단계에서 확인할 문안 초안이라는 성격은 유지된다(RADIO 미결 사항 그대로).

### 검증 결과

- `pnpm vitest run`(전체) 541 tests GREEN.
- `pnpm typecheck`·`pnpm lint:ci`·`pnpm format:check` GREEN.
- `pnpm db:reset && pnpm db:test` GREEN(146 tests, F-04·F-08 신규 단언 포함).
- `pnpm build` 성공 — 라우트 재배치 후에도 URL 목록 불변(`/`·`/more`·`/notifications`·`/pay`·`/schedule`·`/schedule/[id]` 전부 유지).
- `pnpm test:e2e` GREEN(16/16, 2회 연속 재확인 — 기존 8건 + 신규 8건).
- `pnpm verify` 전체 GREEN(exit 0, 23:11:17~23:12:15).

### 미결 사항

- 이전 라운드와 동일: 처리방침 문안(F-12로 구체화했으나 최종 확인은 여전히 사용자), rejected 화면 임시 처리(P1-T03 소유), `require-active-profile` 미소비(이후 활성 기능 task 소유), dormant·departed의 `resolveProfileGate`·`resolveProfileAccess` fallthrough(P1-T06 소유).
- F-10(성능, low)·F-13(P1-T01 backlog)은 이번 라운드에서 다루지 않았다 — 조정자 backlog 소유.

### 다음 행동

1. 조정자가 이번 수정 라운드를 재검증하고 `docs/execution/reviews/P1-T02-review.json`·backlog를 갱신한다(이번 커밋에는 미포함).
2. 검증 통과 후 `index.jsonl`을 `done`으로 전환한다.
3. 커밋 이후 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로(수정 라운드)

- `docs/execution/runs/P1-T02/tdd.json` — 전체 45개 기록(이전 라운드 13쌍 유지 + 이번 라운드 신규 RED→GREEN 9쌍 + `pnpm db:test` 최종 확인 1건). `db:test`·`test:e2e` 계열은 전부 이번 라운드에서 실제 재실행한 시각이다.
- 신규: `src/app/(protected)/layout.tsx`, `supabase/migrations/20260806000200_identity_signup_profile_name_check.sql`.
- 이동: `src/app/(tabs)/**` → `src/app/(protected)/(tabs)/**`, `src/app/schedule/[id]/page.tsx` → `src/app/(protected)/schedule/[id]/page.tsx`(URL 불변).
- 로컬 확인: 위 "검증 결과" 절.
