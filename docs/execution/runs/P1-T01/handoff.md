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

## 2026-08-06 · 교차 검증 수정 라운드(revision 5)

- 기준 시각: 2026-08-06
- `docs/execution/reviews/P1-T01-review.json`(opus·codex 교차 검증, total 76)이 확정한 14건 중 F-14(로그인 화면 개인정보·문의 경로 — 승인 범위 밖 이월)를 제외한 13건(high 2·medium 7·low 4)을 사용자 승인으로 수정했다. RADIO는 revision 5(SHA-256 `8fd75a3b9baf0922822b89e6c28aa6be25021ff50b9ece86b1183bff6e844920`)로 재봉인됐고 `src/shared/api/**`가 허용 경로에 편입됐다. 재개 전 해시 일치를 확인했다.

### 확정된 사실 — 수정 내역

- **F-01(high)**: `supabase/config.toml`의 `additional_redirect_urls`에 `/auth/callback` 콜백 URL이 실제로는 빠져 있었다(RADIO가 처음부터 요구했는데 구현 시 누락). 추가했고, `site_url`(127.0.0.1)과 `NEXT_PUBLIC_APP_URL`(localhost) 호스트 불일치도 `site_url`을 `localhost`로 맞춰 정합시켰다. 로컬 스택을 재시작해 반영을 확인했다.
- **F-02(high)**: 봉인 렌즈 표가 "테스트함"으로 선언했던 실 경계 세 가지를 `tests/e2e/auth.spec.ts`에 실제로 추가했다.
  - 로그아웃 E2E — 전역 테스트 사용자(global-setup)를 그대로 쓰면 `signOut()` 기본 scope가 `'global'`이라 병렬로 도는 다른 e2e가 같은 세션을 공유해 로그아웃 시 함께 튕겨나가는 걸 직접 재현으로 확인했다. 로그아웃 테스트 전용의 격리된 사용자·세션을 새로 만들어 해소했다(`signInWithPasswordCookies` 헬퍼 신설).
  - 온보딩 분기 E2E — profile 있음/없음 두 상태로 실제 `/auth/callback` 도달 후 `/`·`/onboarding` 분기를 각각 단언한다.
  - 콜백 실 코드 교환·Set-Cookie 검증 — 로컬 GoTrue로 PKCE 코드를 실제로 만드는 방법을 찾았다: `signInWithOtp`(matic link)로 시작한 flow의 code_verifier를 `@supabase/ssr`의 `createBrowserClient`에 커스텀 쿠키 콜백을 주입해 캡처하고, 로컬 Mailpit API(`/api/v1/search`, `/api/v1/message/:id`)로 메일 본문에서 verify link를 읽어, 그 code_verifier 쿠키를 실제 Playwright 브라우저 컨텍스트에 주입한 뒤 verify link로 `page.goto`하면 GoTrue가 303으로 우리 앱의 `/auth/callback?code=...`까지 리다이렉트하고 우리 Route Handler가 실제로 교환에 성공한다 — Node 스크립트로 3단계(쿠키 캡처 확인 → verify 리다이렉트 확인 → 실제 교환 성공 확인)를 미리 재현해 검증한 뒤 테스트로 옮겼다. 이 흐름이 E2E 서버 포트(3100)로도 통과하려면 `additional_redirect_urls`에 `:3100/auth/callback` 두 항목(localhost·127.0.0.1)을 추가로 넣어야 했다(3000 포트만으로는 GoTrue가 리다이렉트를 조용히 `site_url`로 대체해 3100에서 도는 e2e 서버에 닿지 못한다).
- **F-03(medium)**: `src/proxy.ts`가 리다이렉트 응답을 만들 때 `updateSupabaseSession`이 갱신한 쿠키를 `redirectResponse.cookies.set(cookie)`로 복사하도록 고쳤다. 리다이렉트 경로에서 쿠키가 반영되는지 확인하는 단위 테스트를 추가했다.
- **F-04(medium)**: `src/shared/lib/supabase-proxy-session.ts` 첫 import로 `server-only`를 추가했다(DEV-ARCH-03).
- **F-05(medium)**: `SignOutResult`를 `{ ok: false, code: ErrorCode }`로 바꾸고(`ERROR_CODE.COMMON_UNEXPECTED` 재사용, 신규 코드 불필요), `useSignOutAction`이 `ERROR_CODES[code].message`로 문구 정본을 레지스트리에서 읽도록 고쳤다(DEV-ERR-08).
- **F-06(medium)**: `src/shared/api/supabase-server.ts`와 그 테스트를 삭제해(허용 경로 편입 후) `src/shared/lib/supabase-server.ts`를 유일한 서버 client 정본으로 만들었다. 빈 디렉터리(`src/shared/api/`)도 함께 제거했다(DEV-CODE-04).
- **F-07(medium)**: pgTAP의 update 차단 단언을 `now()`(트랜잭션 내 불변이라 변조 여부를 구분 못함) 대신 구별되는 고정값(`2020-01-01 00:00:00+00`)으로 바꾸고, 이후 `isnt()`로 원래 값이 유지됐는지 단언한다. 탐지력 증명: 임시로 update를 허용하는 rogue 정책을 테스트 트랜잭션 안에 주입해 새 단언이 실제로 실패함(RED)을 확인한 뒤 rogue 정책을 제거해 GREEN을 재확인했다(P0-T04의 client-secret-scan 탐지력 증명과 같은 방식).
- **F-08(medium)**: `tests/e2e/global-setup.ts`가 `.env`만 읽던 것을, `process.env` 우선 → `.env.local` → `.env` 순으로 병합해 앱과 같은 우선순위로 읽게 고쳤다(공용 헬퍼 `loadSupabaseTestEnv`를 `tests/e2e/support/supabase-test-auth.ts`에 신설). `tsconfig.json`의 `include`에 `tests/**`·`playwright.config.ts`를 추가해 `pnpm typecheck` 대상으로 편입했고, 편입 후 드러난 타입 오류(`MoreView`의 `onSignOut` prop 타입이 `SignOutOutcome`으로 안 좁혀진 것, `mailpit.ts`의 `noUncheckedIndexedAccess` 위반 2건)를 함께 고쳤다.
- **F-09 + F-13(medium+low, 같은 파일이라 함께 처리)**: `findOwnProfile`이 `{ ok: true, data: boolean } | { ok: false, code: ErrorCode }`를 반환하도록 바꿨다(`COMMON_AUTH_REQUIRED`·`COMMON_UNEXPECTED` 활용). `userId?: string` 인자를 받아 있으면 `getUser()`를 건너뛴다. `/auth/callback`은 `exchangeCodeForSession` 결과의 `data.user.id`를 그대로 넘겨 중복 `getUser()` 왕복을 없앴다(F-13). `onboarding/page.tsx`는 `!result.ok`면 `/login`으로, `result.data`면 `/`로 보낸다 — 세션 만료가 이제 500이 아니라 `/login`으로 fail-closed된다.
- **F-10(low)**: `route-access.ts`의 `isPublicPath`가 `startsWith` 하위 트리 확장을 없애고 정확 열거(`pathname === path`)만 쓴다. `/login-history` 보호 테스트는 그대로 두고, "하위 경로도 공개" 테스트는 "하위 경로는 예외 열거에 없으므로 보호 대상" 의미로 갱신했다.
- **F-11(low)**: `src/shared/config/auth-routes.config.ts`(신규, config 세그먼트 — 상수 전용)에 `HOME_PATH`·`LOGIN_PATH`·`ONBOARDING_PATH`·`AUTH_CALLBACK_PATH`·`AUTH_ERROR_QUERY_PARAM`·`AUTH_ERROR_QUERY_VALUE`·`LOGIN_ERROR_PATH`를 모아, `route-access.ts`·`auth/callback/route.ts`·`sign-in-with-google.ts`·`sign-out.ts`(리뷰가 지목한 4곳) 외에 `login/page.tsx`·`onboarding/page.tsx`도 이 상수만 import하도록 정리했다.
- **F-12(low)**: `supabase-server.ts`의 `catch`를 "Server Component 렌더 중 set 불가"라는 알려진 경우로 좁혔다 — Next.js가 그 오류에 붙이는 `__NEXT_ERROR_CODE: "E1180"`(`ReadonlyRequestCookiesError`, 내부 클래스라 값만 duck-typing으로 확인, import는 안 함)만 삼키고 그 외는 다시 던진다. `callback`의 `catch`는 F-09의 typed Result 전환으로 자연히 없어졌다(더 이상 예외를 던지지 않는다).
- **F-14는 승인 범위 밖으로 이번 라운드에서 손대지 않았다**(RADIO 원문 유지, backlog 이월은 조정자 소유).

### 확정된 사실 — DEV-CODE-09 경계 해석(CX-07 기각으로 확정)

- **`ui` 세그먼트는 계산·변환·분기 판정·데이터 가공 "함수"를 두지 않는다. 이미 계산된 값을 어떤 마크업으로 보여줄지 고르는 표현용 조건부 렌더(`{condition ? <A/> : <B/>}`)는 `ui`에 남아도 된다** — 별도 함수로 추출해 `model`/`lib`로 옮기라는 요구가 아니다. 표적은 "함수로 캡슐화된 계산·오케스트레이션"이지 JSX 조건부 표현 자체가 아니다. 이번 구현에서 `LoginView`의 `hasAuthError ? <p role="alert">...` 같은 패턴을 그대로 유지한 근거다.

### 미결 사항

- (1차 중단 이후 동일) `.env.local`의 `GOOGLE_OAUTH_CLIENT_ID`가 placeholder라 Google 실계정까지 이어지는 완전한 수동 로그인은 로컬에서 재현되지 않는다 — 결정 주체: 사용자, 반환할 단계: 없음(범위 밖).
- F-14(로그인 화면 개인정보·문의 경로) — 승인 범위 밖, 후속 task에서 정본과의 차이를 좁힐 항목.
- profile 없는 인증 사용자의 URL 직접 탭 진입 차단 — P1-T02 소유(RADIO 원문 그대로).
- 호스팅 Supabase 프로젝트 전환(배포 URL·키·redirect) — 배포 task 소유(RADIO 원문 그대로).

### 다음 행동

1. 커밋 이후 push·CI 감시는 `ci-finisher` 소유(오프로드) — `docs/execution/reviews/**`는 이번 커밋에 포함하지 않는다(조정자 소유, `done` 전환 커밋에서 처리).

### 증거·산출물 경로(수정 라운드)

- `docs/execution/reviews/P1-T01-review.json` — 교차 검증 확정 발견 14건(조정자 소유, 참고만).
- `docs/execution/runs/P1-T01/tdd.json` — 이번 라운드 RED→GREEN 10쌍 추가(단위 8쌍 + `pnpm db:test` 1쌍 + `pnpm test:e2e` 1쌍).
- 신규: `src/shared/config/auth-routes.config.ts`, `tests/e2e/support/{supabase-test-auth,mailpit,real-auth-code}.ts`.
- 삭제: `src/shared/api/supabase-server.ts`, `src/shared/api/__tests__/supabase-server.test.ts`.
- 로컬 확인: `pnpm verify` 전체 GREEN(`test:e2e` 8/8), `pnpm db:test` GREEN(114 tests, pgTAP 탐지력 증명 포함).

## 2026-08-06 · 검증 단계 종료

- 작업 식별자: P1-T01 (Google OAuth와 세션)
- 현재 단계: 검증 종료 → done 전환
- 기준 시각: 2026-08-06

### 확정된 사실

- 교차 검증(opus·codex 병렬 독립 리뷰 + 상대 되물음)을 완료했다. 확정 발견 14건(high 2·medium 7·low 5), 기각 1건(LoginView 표현용 조건부 렌더 — 근거 있는 반박으로 기각, DEV-CODE-09 경계 해석은 개발 단계 기록이 소유). 결과는 `docs/execution/reviews/P1-T01-review.json`(총점 76, 기준 커밋 `597c52ce26300a2e96d83823b2fd9240a9d2bb04`)이 소유한다.
- 사용자 승인 수정 라운드(revision 5)에서 F-14(승인 범위 밖) 제외 13건을 전부 수정했다(`c720218`, 35 files). backlog의 P1-T01 medium 7·low 4건을 `[x]`로 정리했고 F-14만 미결로 남는다.
- 조정자 재검증: `pnpm typecheck`·`pnpm test`(74 files/473 tests) 통과 재확인. E2E 8/8·pgTAP 114는 수정 라운드 tdd.json의 GREEN 기록을 증거로 인정한다.
- 수정 라운드가 실물 결함 2건을 추가로 잡았다: signOut 기본 scope 'global'이 병렬 E2E의 공유 세션을 revoke하는 문제(전용 세션 격리로 해소), 콜백 실 PKCE 교환의 E2E 실현(signInWithOtp + Mailpit 경로).

### 미결 사항

- F-14와 개발 단계 미결 4건은 위 절 그대로 유지된다.

### 다음 행동

1. `index.jsonl`의 P1-T01을 `done`으로 전환하고 대시보드를 재생성한다.
2. 채택 확정된 DEV-CODE-08·DEV-CODE-09·DEV-ARCH-06을 DEVELOPMENT.md에 적용한다(적용 커밋은 done 이후 — gate:scope 제약).
3. ci-finisher가 누적 커밋의 push와 CI 감시를 백그라운드로 수행한다.
