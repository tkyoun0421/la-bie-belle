# P1-T01 handoff

## 2026-08-06 · 개발 진행 중 (안전 중단, 1차)

- 작업 식별자: P1-T01
- 현재 단계: 개발 진행 중 → 다음 개발(재개, 아래 두 미결 사항 해소 후)
- 기준 시각: 2026-08-06

### 확정된 사실

- RADIO revision 2(SHA-256 `d0a35339168230a3518e3be0bfee4d9366aca27ff66f7a9609e2d1f81dab0122`)를 확인하고 `index.jsonl`의 P1-T01을 `planned → in_progress`로 전환했다.
- 아래 항목을 TDD(RED→GREEN, `tdd.json` 기록)로 구현하고 `pnpm test`(74 files, 470 tests)·`pnpm lint`·`pnpm lint:ci`·`pnpm typecheck` 전부 통과 상태다.
  - `src/shared/lib/route-access.ts` — `PUBLIC_PATHS`·`resolveAuthRedirect` (revision 2 결정에 따라 `shared/lib`에 위치, `config`가 아니다).
  - `src/shared/lib/supabase-server.ts` — `next/headers` cookies 기반 서버 client(server-only).
  - `src/shared/lib/supabase-proxy-session.ts` — proxy 전용 세션 갱신(`@supabase/ssr` updateSession 패턴).
  - `src/entities/identity/api/find-own-profile.ts` — 본인 profile 행 존재 조회(server-only).
  - `src/features/auth/api/sign-in-with-google.ts` — Google OAuth 시작 server action.
  - `src/features/auth/api/sign-out.ts` — 로그아웃 server action(`{ ok: false }` Result, 실패 시 redirect 안 함).
  - `src/features/auth/hooks/useSignOutAction.ts` — `useActionState` + 실패 시 snackbar 안내(코드 스타일 보강 지시에 따라 `ui`에서 분리).
  - `src/features/auth/ui/SignOutButton.tsx` — 위 hook을 소비하는 leaf client 컴포넌트(폼 배선만).
  - `src/app/auth/callback/route.ts` — 코드 교환 → profile 분기 → 실패 전부 `/login?error=auth`(fail-closed).
  - `src/views/login/ui/LoginView.tsx`(서버 컴포넌트) + `src/app/login/page.tsx`.
  - `src/views/onboarding/ui/OnboardingPlaceholderView.tsx`(서버 컴포넌트) + `src/app/onboarding/page.tsx`.
  - `src/views/more/ui/MoreView.tsx`에 로그아웃 버튼 추가(`src/app/(tabs)/more/page.tsx`에서 `signOut` server action을 prop으로 전달) — `ui` 세그먼트의 `forbidImports: ["**/api/**"]` 때문에 action은 route에서 내려받는 구조다. `src/app/preview/page.dev.tsx`의 `MoreView` 사용부도 새 prop에 맞춰 갱신했다.
  - `supabase/config.toml` — `[auth.external.google]` 활성화(env 치환), redirect 허용 목록에 로컬 콜백 URL 추가.
  - `supabase/migrations/20260806000000_identity_profiles.sql` — `profiles` 최소 스키마 + RLS + 본인 select 정책.
  - `supabase/tests/05-profiles-rls.test.sql` — pgTAP 18건(스키마·FK·RLS enable·정책 1개·익명 차단·타인 행 차단·본인 조회 허용·정책 밖 mutation 거부). `pnpm db:test` 전체 113건 통과.
  - `.github/workflows/ci.yml`의 `app-verify`에 Supabase CLI 설치 → `supabase start` → `supabase db reset`을 `pnpm verify` 앞에 추가했다(`db-verify` job은 무수정).
- 중간에 조정자가 보낸 코드 스타일 보강 2건(서버 컴포넌트 기본값, `ui`는 계산·분기·변환 없이 배선만)을 적용했다 — `LoginView`·`OnboardingPlaceholderView`는 애초에 서버 컴포넌트로 작성돼 있었고, `SignOutButton`의 `useActionState` 오케스트레이션을 `useSignOutAction` hook으로 분리해 `ui`는 렌더만 하도록 리팩터링했다(리팩터링 전후 모두 GREEN, 새 RED 불필요).
- `pnpm db:start`/`pnpm db:reset`/`pnpm db:test`를 여러 차례 실행해 로컬 스택이 정상 동작함을 확인했다.

### 미결 사항 (1차 중단 당시)

1. `src/proxy.ts`를 테스트할 alias가 없었다(6-레이어 alias 밖).
2. `.env.example`/로컬 `.env`의 Supabase anon·service-role 키가 실제 로컬 스택과 서명이 안 맞았다.

## 2026-08-06 · 개발 완료(revision 3 반영, 재개 후)

- 기준 시각: 2026-08-06
- 사용자가 두 미결 사항의 추천안을 승인했고, 조정자가 RADIO를 revision 3(SHA-256 `39a4b2625f4c62cb87322acb41ae55e63078bd53b914fd242b5b9ce4bae6ef59`)으로 재봉인·커밋(`597c52c`)했다. 재개 전 해시 일치를 확인했다.

### 확정된 사실

- **alias 추가**: `tsconfig.json`의 `paths`에 `"@/proxy": ["./src/proxy.ts"]`, `vitest.config.ts`의 `alias` 배열에 동일 항목을 추가했다. 기존 6-레이어 alias는 무수정. `tsc --noEmit`으로 `@/proxy`가 정상 해석됨을 확인했다.
- **`src/proxy.ts`**: `src/__tests__/proxy.test.ts`를 RED로 먼저 작성한 뒤 구현했다(TDD). `updateSupabaseSession` → `resolveAuthRedirect` 배선, `matcher`로 `_next/static`·`_next/image`·`favicon.ico`·`icons/`·`manifest.webmanifest` 제외.
- **키 교정**: `supabase status -o env`의 실제 legacy `ANON_KEY`/`SERVICE_ROLE_KEY`로 `.env.example`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY` 두 줄만 교체했다. 로컬 `.env`도 같은 두 줄만 교체했다. 교체 후 HMAC-SHA256으로 직접 재검증해 서명이 로컬 `JWT_SECRET`과 일치함을 확인했다.
  - **추가 발견**: `.env.local`(Next.js 우선순위상 `.env`보다 먼저 읽힘)에도 같은 두 줄이 동일하게 깨져 있어 `.env`만 고치면 실효가 없었다. 지시된 대상은 `.env`였지만, `.env.local`이 있으면 `.env`의 값이 애플리케이션에 전혀 반영되지 않는 Next.js 자체 규칙 때문에 같은 두 줄(anon·service-role 키)만 동일하게 교정했다 — `GOOGLE_OAUTH_*` 등 다른 줄은 손대지 않았다("절대 건드리지 마라" 지시 그대로 유지).
  - **별도로 확인만 하고 손대지 않은 사실**: `.env`에는 실제 Google OAuth Client ID가 있지만 `.env.local`에는 `CHANGE_ME_GOOGLE_OAUTH_CLIENT_ID` placeholder가 남아 있어, `.env.local` 우선순위 때문에 로컬 `supabase start`가 이 placeholder를 읽는다. 첫 E2E 실행에서 "Google 버튼 클릭 시 리다이렉트가 실제 Google 서버까지 이어지면" `invalid_client` 오류로 드러났는데, RADIO 인수 조건 자체가 "로컬 Supabase authorize URL로의 이동 **시작**"만 요구해 이 계정 불일치와 무관하게 테스트를 고쳐 통과시켰다(아래 참고). 이 불일치 자체는 이번 지시 범위(anon·service-role 키) 밖이라 고치지 않았고, 아래 "다음 행동"에 참고로만 남긴다.
- **Playwright E2E**:
  - `tests/e2e/global-setup.ts`: `.env`를 직접 파싱(프로젝트에 `dotenv` 의존성이 없어 `scripts/client-secret-scan.mjs`와 같은 방식의 최소 파서를 자체 구현)해 Supabase URL·anon·service-role 키를 얻는다. service role로 `auth.admin.listUsers`/`createUser`로 테스트 사용자를 멱등 생성하고, `signInWithPassword`로 세션을 얻은 뒤, `@supabase/ssr`의 `createBrowserClient`에 커스텀 `cookies.getAll/setAll`(브라우저 없이 Node에서 직접 호출 가능— `document.cookie`가 아니라 주입한 콜백을 타므로)을 주입해 `auth.setSession()`을 호출하면 실제 라이브러리가 `sb-<ref>-auth-token` 형식(청크·base64url)으로 정확히 인코딩한 쿠키를 얻는다. 이 쿠키를 Playwright `browser.newContext()` + `context.addCookies()` + `context.storageState({ path })`로 저장한다. 저장 경로는 `.gitignore`를 건드리지 않기 위해 이미 무시 대상인 `test-results/e2e-auth/user.json`을 썼다.
  - `playwright.config.ts`: `globalSetup`과 기본 `use.storageState`(위 경로)를 추가했다. 기존 `home.spec.ts`·`schedule.spec.ts`는 이제 기본으로 인증된 컨텍스트를 쓴다(별도 수정 없이 계속 통과).
  - `tests/e2e/auth.spec.ts`(신규): 미인증 `/schedule` 접근이 `/login`으로 리다이렉트되고 로그인 화면 요소(제품명·용도 한 문장·버튼)가 보이는지, `Google로 계속하기` 클릭이 로컬 Supabase `/auth/v1/authorize` 요청을 시작하는지(`page.waitForRequest`로 요청 **시작**만 단언 — "load" 이벤트를 기다리면 로컬 authorize가 즉시 상위로 리다이렉트해 타임아웃난다는 점을 실행하며 확인해 접근을 바꿨다), 세션 주입 후 `/schedule` 진입이 막히지 않는지를 검증한다. `test.use({ storageState: { cookies: [], origins: [] } })`로 미인증 시나리오만 override했다.
- **검증 결과**: `pnpm verify` 전체 통과 — `format:check`(재실행 전 `pnpm format` 1회 필요했다)·`lint:ci`·`typecheck`·`test`(75 files/472 tests)·`harness:typecheck`·`harness:self-test`(196/196)·`check:docs`·`build`(1회, `ƒ Proxy (Middleware)` 확인)·`check:app-build`·`check:client-secret-scan`·`test:e2e`(5/5 — 기존 2건 + 신규 3건)·`gate:all`.

### 미결 사항

- `.env.local`의 `GOOGLE_OAUTH_CLIENT_ID`가 placeholder라 Google 실계정까지 이어지는 완전한 수동 로그인은 로컬에서 재현되지 않는다 — 결정 주체: 사용자, 반환할 단계: 없음(로컬 개발 환경 정리, 이 task 범위 밖). E2E는 이 불일치와 무관하게 통과한다.
- profile 없는 인증 사용자의 URL 직접 탭 진입 차단 — P1-T02 소유(RADIO 원문 그대로).
- 호스팅 Supabase 프로젝트 전환(배포 URL·키·redirect) — 배포 task 소유(RADIO 원문 그대로).

### 다음 행동

1. (선택) 로컬 `.env.local`의 `GOOGLE_OAUTH_CLIENT_ID`/`SECRET`을 `.env`와 맞추면 실제 Google 계정으로 끝까지 수동 확인 가능 — 이번 task 완료 조건은 아니다.
2. 커밋 이후 push·CI 감시는 `ci-finisher` 소유(오프로드).

`git add -A` 이후 `pnpm gate:scope`가 `src/__tests__/proxy.test.ts`를 허용 경로 밖으로 막아, 조정자가 RADIO를 revision 4(SHA-256 `8ed975eed0a35491b44880ab2e2cf6b142da33077279f5901d430f947cde3b2c`)로 재봉인했다 — 새 결정 없이 revision 3의 허용 경로 코드펜스 편집 누락(Architecture 절이 이미 명시한 파일이 코드펜스에서 빠짐)만 보정했다. 재개 전 해시 일치와 `gate:index`·`gate:radio`·`gate:scope` 통과를 확인한 뒤 구현 커밋 하나로 합쳤다.

### 증거·산출물 경로

- `docs/execution/runs/P1-T01/tdd.json` — RED→GREEN 15쌍(단위/통합 12쌍 + `pnpm db:test` 1쌍 + `proxy.test.ts` 1쌍 + `test:e2e` 1쌍).
- 구현 파일: 위 "확정된 사실" 두 라운드의 각 경로.
- 로컬 확인: `pnpm verify` 전체 GREEN(위 상세).
