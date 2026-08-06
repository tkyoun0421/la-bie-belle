# P1-T01 RADIO 개발 설계

- 상태: Approved
- revision: 4
- 기획 승인: user, 2026-08-06
- 개발 설계 승인: user, 2026-08-06 (revision 3 재승인 포함, revision 4는 결정 없는 편집 누락 보정)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. 기획 인터뷰 확정(실물 OAuth 클라이언트·전 탭 보호·온보딩 자리표시·세션 주입 E2E)과 설계 결정 2건(profiles 최소 테이블 P1-T01 생성, CI app-verify에 Supabase 기동) 반영. |
| 2 | 2026-08-06 | 구현 전 발견된 구조 계약 충돌 해소(사용자 결정 1안): config 세그먼트는 상수 전용(`config/fsd.json` `runtimeExports: "constants"`)이라 판정 함수를 둘 수 없어 `route-access.ts`를 `shared/config` → `shared/lib`로 이동. 경로 언급 전체(Architecture·DEV-* 절) 동반 갱신. env 스키마의 기존 OAuth 값 노출(P0-T04 소유)과 불변 규칙의 관계를 명문화. |
| 3 | 2026-08-06 | 구현 중 발견된 차단 2건 해소(사용자 결정): ① `src/proxy.ts`가 6-레이어 alias 밖이라 테스트 불가(DEV-NAME-06 상대경로 금지 ∧ tdd-guard 테스트 선행 요구) — `tsconfig.json`·`vitest.config.ts`에 최상위 예약 파일 전용 alias를 추가하고 두 파일을 허용 경로에 편입 ② `.env.example`의 Supabase anon·service role 키가 실제 로컬 스택과 서명 불일치(Auth API 첫 실호출에서 발견) — `supabase status -o env` 실값으로 교정하고 허용 경로에 편입. |
| 4 | 2026-08-06 | 새 결정 없음 — revision 3의 편집 누락 보정. Architecture 절이 이미 명시·승인한 `src/__tests__/proxy.test.ts`가 허용 경로 코드펜스에서 빠져 gate:scope에 걸린 것을 코드펜스에 추가해 정합시켰다. |

- 관련 spec: DOMAIN:IDENTITY, ADR:0001, ADR:0002
- 적용 깊이: 심화 (인증·세션·RLS 경계 — 서버 강제와 DB 정책이 본체다)
- test mode: tdd (index에 봉인 시 기록)
- 예정 check IDs: auth-integration, login-mobile-e2e (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① `supabase/config.toml`에 Google provider 활성화(env 치환)와 redirect 허용 목록 정리 ② `profiles` 최소 테이블 마이그레이션 + RLS + pgTAP ③ `@supabase/ssr` 서버 클라이언트·세션 갱신 계층 ④ `src/proxy.ts` 보호 라우트(Next 16 — middleware의 새 이름) ⑤ `/login` 화면(디자인 정본 준수) ⑥ `/auth/callback` Route Handler(코드 교환 + profile 분기) ⑦ `/onboarding` 자리표시 화면 ⑧ 로그아웃(더보기 화면) ⑨ Playwright E2E(세션 주입)와 CI app-verify의 Supabase 기동.
- 비목표(기획 승인 그대로): 온보딩 폼·프로필 생성·승인 대기 화면(P1-T02), 관리자 승인(P1-T03), 역할·슈퍼 관리자(P1-T04), 휴면(P1-T06). 설계 비목표: `profiles` 컬럼 확장(이름·연락처 등 — P1-T02 소유), profile 없는 **인증** 사용자가 URL 직접 입력으로 목 화면 탭에 진입하는 것의 차단(P1-T02의 상태 가드 소유 — 이번 탭 화면은 전부 목 데이터라 노출 위험이 없다).

### 불변 규칙

- 인증 판정은 서버 경계(`src/proxy.ts`와 서버 모듈)에서 강제한다. UI 숨김은 보조 수단이다(`DEV-SEC`).
- 서버에서 사용자 확인은 `supabase.auth.getUser()`(토큰 서버 검증)로 한다. 쿠키의 세션 값을 검증 없이 신뢰하지 않는다.
- `GOOGLE_OAUTH_CLIENT_SECRET`은 `supabase/config.toml`의 env 치환으로만 소비한다. 앱 코드(src/**)는 이 값을 OAuth 흐름에서 import·소비하지 않으며 `client-secret-scan` 대상이 유지된다. P0-T04가 만든 env 스키마(`src/shared/model/env.ts`)의 필수값 검증·`env.server.ts` 노출은 기존 상태 그대로 두며 이 task의 변경 대상이 아니다.
- `profiles`는 RLS 기본 거부에 본인 행 select 정책만 갖는다. 쓰기 정책은 P1-T02가 소유한다.
- 서버 전용 모듈은 첫 import로 `server-only`를 선언한다.
- 기존 목 화면·게이트·검증 체계의 동작은 바뀌지 않는다(로그아웃 버튼이 더보기 화면에 추가되는 것 외 화면 무수정).

### 기술 인수 조건

1. 미인증 사용자가 보호 라우트(탭 전체)에 접근하면 `/login`으로 리다이렉트된다. 로그인 사용자가 `/login`에 접근하면 홈으로 리다이렉트된다.
2. `/login`이 디자인 정본(제품명·용도 한 문장·`Google로 계속하기`) 요소를 렌더하고, 버튼이 Supabase authorize URL로의 리다이렉트를 시작한다.
3. `/auth/callback`이 인가 코드를 세션으로 교환하고 세션 쿠키를 설정한다. 코드 부재·교환 실패·profile 조회 실패는 `/login?error=auth`로 되돌린다(fail-closed).
4. 콜백 성공 후 `profiles` 행이 있으면 홈으로, 없으면 `/onboarding`으로 리다이렉트된다.
5. `/onboarding`은 자리표시 콘텐츠를 렌더한다. 미인증 접근은 `/login`으로, profile 있는 사용자는 홈으로 보낸다.
6. 로그아웃하면 세션이 제거되어 `/login`으로 이동하고, 보호 라우트 재접근이 다시 차단된다.
7. `src/proxy.ts`가 요청마다 세션을 갱신해(`@supabase/ssr` 패턴) 로그인 상태가 유지된다.
8. `profiles` 최소 스키마(id = `auth.users` 참조, 생성 시각)가 RLS 활성·기본 거부·본인 select 허용으로 만들어지고 pgTAP이 익명 차단·타인 행 차단·본인 조회 허용을 단언한다.
9. E2E가 CI에서 실행된다: 미인증 리다이렉트, 로그인 화면 렌더, Google 버튼의 리다이렉트 시작, 세션 주입 후 탭 진입. CI `app-verify`가 로컬 Supabase를 기동한다.
10. `pnpm verify` 전체 통과. `client-secret-scan`이 Google secret을 검출하지 않는다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 보호 라우트 판정 | 테스트함 — 세션 주입 후 탭 진입 E2E | 테스트함 — 미인증 접근이 /login으로 가는 E2E와 판정 단위 테스트 | 테스트함 — 공개 경로(/login·/auth/callback)·정적 자산 제외를 판정 단위 테스트로 | 테스트함 — 판정이 서버(proxy)에서 강제됨을 쿠키 없는 요청 E2E로 확인 | 해당 없음 — 리다이렉트는 상태를 만들지 않는 멱등 GET이다 | 해당 없음 — 요청별 독립 판정이라 경합이 없다 |
| 2 로그인 화면·시작 | 테스트함 — 렌더 단위 테스트와 버튼 리다이렉트 시작 E2E | 테스트함 — error 쿼리 도착 시 오류 안내 렌더 단위 테스트 | 해당 없음 — 입력 폼 없는 단일 버튼 화면이라 경계 입력이 없다 | 테스트함 — 로그인 사용자의 /login 접근이 홈으로 가는 판정 테스트 | 해당 없음 — 시작 리다이렉트는 서버 상태를 만들지 않는다 | 해당 없음 — 상태 없는 화면이다 |
| 3 콜백 코드 교환 | 테스트함 — 교환 성공 후 세션 쿠키 설정 통합 테스트 | 테스트함 — 코드 부재·교환 실패가 /login?error=auth로 가는 통합 테스트 | 테스트함 — 빈 문자열 코드·알 수 없는 쿼리 조합의 fail-closed 처리 | 해당 없음 — 세션 수립 전 단계라 권한 판정 대상이 없다 | 테스트함 — 같은 코드 재사용이 교환 실패 경로로 처리됨을 통합 테스트로 | 해당 없음 — 인가 코드는 1회성이라 병행 사용이 성립하지 않는다 |
| 4 profile 분기 | 테스트함 — 행 있음→홈, 없음→/onboarding 통합 테스트 | 테스트함 — 조회 오류 시 /login?error=auth(fail-closed) 통합 테스트 | 테스트함 — 행 생성 직후 재로그인이 홈으로 가는 시나리오 | 테스트함 — 본인 행만 조회됨을 RLS pgTAP으로 | 해당 없음 — 읽기 전용 분기다 | 해당 없음 — 단일 조회라 경합이 없다 |
| 5 온보딩 자리표시 | 테스트함 — 자리표시 콘텐츠 렌더 단위 테스트 | 테스트함 — 미인증 접근이 /login으로 가는 판정 테스트 | 테스트함 — profile 있는 사용자의 접근이 홈으로 가는 판정 테스트 | 테스트함 — 인증 없이는 접근 불가함을 E2E로 | 해당 없음 — 정적 안내 화면이다 | 해당 없음 — 정적 안내 화면이다 |
| 6 로그아웃 | 테스트함 — 로그아웃 후 /login 이동과 보호 라우트 재차단 E2E | 테스트함 — signOut 실패 시에도 오류 안내 후 재시도 가능 단위 테스트 | 해당 없음 — 파라미터 없는 단일 동작이다 | 해당 없음 — 본인 세션만 종료하는 동작이다 | 테스트함 — 이미 로그아웃된 상태의 재호출이 오류 없이 /login으로 | 해당 없음 — 세션 제거는 멱등이다 |
| 7 세션 갱신 | 테스트함 — proxy 경유 연속 요청에서 로그인 유지 E2E | 테스트함 — 손상·위조 토큰이 미인증으로 처리되는 판정 테스트 | 해당 없음 — 만료 시점 갱신은 라이브러리 소유라 결정적 재현이 불가하다 | 해당 없음 — 갱신은 소유 토큰에만 작동한다 | 해당 없음 — 갱신은 멱등이다 | 해당 없음 — 라이브러리가 요청 단위 갱신을 보장한다 |
| 8 profiles RLS | 테스트함 — 본인 행 select 허용 pgTAP | 테스트함 — 익명·타인 행 차단 pgTAP | 테스트함 — 정책 밖 mutation(기본 거부) 거부 pgTAP | 테스트함 — service role 없이 사용자 경로로 검증 | 해당 없음 — 이번 범위는 조회 전용이다 | 해당 없음 — 조회 전용이라 경합이 없다 |
| 9 E2E·CI 기반 | 테스트함 — CI app-verify에서 Supabase 기동 후 E2E 전체 실행 | 테스트함 — Supabase 미기동이면 E2E가 명확한 전제 오류로 실패 | 해당 없음 — 인프라 구성이라 경계 입력이 없다 | 해당 없음 — CI 인프라 단계다 | 해당 없음 — CI 인프라 단계다 | 해당 없음 — job은 독립 실행된다 |
| 10 서버 경계·secret | 테스트함 — client-secret-scan·check:app-build 통과 | 테스트함 — 서버 모듈의 클라이언트 유입이 빌드 실패(server-only)로 차단 | 해당 없음 — 이진 빌드 검사다 | 해당 없음 — 빌드 검사다 | 해당 없음 — 빌드 검사다 | 해당 없음 — 빌드 검사다 |

- 보충: 전 항목의 통합 테스트는 Supabase 클라이언트를 계약 수준에서 목으로 대체한 vitest(`auth-integration`)와 로컬 스택 대상 E2E(`login-mobile-e2e`)로 이원화한다. profile 없는 인증 사용자의 탭 직접 진입은 비목표(P1-T02 상태 가드)로 명시했다.

### DEV-* 적용 상태

- `DEV-SEC`: 인증 강제 위치는 proxy·서버 모듈·RLS다. 화면 분기는 보조. secret은 앱 코드 밖(config.toml env 치환).
- `DEV-ARCH`·`DEV-SSOT-01`: 보호 경로 판정 규칙은 `src/shared/lib/route-access.ts` 한 곳이 소유하고 proxy·화면·테스트가 같은 계약을 소비한다. lib 세그먼트는 함수 export와 단위 테스트 필수를 허용·요구하는 세그먼트다(`config/fsd.json` — config 세그먼트는 상수 전용이라 판정 함수를 둘 수 없다, revision 2).
- `DEV-TEST-01`: 위 렌즈 표. `DEV-TEST` 계열의 RED→GREEN 증거를 `tdd.json`에 남긴다.
- `DEV-CODE-07`·`DEV-NAME-*`: 무주석·명명 관행 그대로.

## Architecture

- `supabase/config.toml`: `[auth.external.google]` `enabled = true`, `client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"`, `secret = "env(GOOGLE_OAUTH_CLIENT_SECRET)"`. `additional_redirect_urls`에 `http://localhost:3000/auth/callback`·`http://127.0.0.1:3000/auth/callback` 추가.
- `supabase/migrations/<ts>_identity_profiles.sql`: `profiles(id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now())` + RLS enable + 본인 select 정책. `supabase/tests/05-profiles-rls.test.sql`(pgTAP).
- `src/shared/lib/supabase-server.ts`(신규, server-only): `createServerClient` + `next/headers` cookies. 기존 `supabase-browser.ts` 무수정.
- `src/shared/lib/supabase-proxy-session.ts`(신규): proxy 전용 세션 갱신(`@supabase/ssr` 표준 updateSession 패턴 — 요청·응답 쿠키 동기화, `getUser()` 검증 결과 반환).
- `src/shared/lib/route-access.ts`(신규): 공개 경로 목록(`/login`, `/auth/callback`)과 판정 순수 함수 `resolveAuthRedirect(pathname, isAuthenticated)` — 기본 보호, 예외 열거(fail-closed 방향). lib 세그먼트 규칙에 따라 단위 테스트 필수(revision 2에서 config → lib 이동).
- `src/proxy.ts`(신규): Next 16 proxy 규약(middleware의 새 이름 — 기능 동일). 세션 갱신 → `resolveAuthRedirect` 적용. matcher로 정적 자산 제외.
- `src/features/auth/api/sign-in-with-google.ts`(server action): `signInWithOAuth({ provider: "google", options: { redirectTo: <APP_URL>/auth/callback } })` → 반환 URL로 redirect. `sign-out.ts`: `signOut()` → `/login` redirect.
- `src/entities/identity/api/find-own-profile.ts`(server-only): 현재 사용자의 `profiles` 행 존재 조회.
- `src/app/auth/callback/route.ts`: `exchangeCodeForSession` → `find-own-profile` → 홈/`/onboarding` redirect, 실패는 `/login?error=auth`.
- `src/app/login/page.tsx` → `src/views/login/ui/LoginView.tsx`, `src/app/onboarding/page.tsx` → `src/views/onboarding/ui/OnboardingPlaceholderView.tsx`(둘 다 thin route + view 단위 테스트).
- `src/views/more/**`: 더보기 화면에 로그아웃 버튼(sign-out server action 연결)만 추가.
- `tests/`(Playwright): 미인증 리다이렉트·로그인 렌더·버튼 리다이렉트 시작·세션 주입 후 탭 진입. global setup이 service role admin API로 테스트 사용자를 멱등 생성하고 `signInWithPassword` 세션을 storageState 쿠키로 변환한다(테스트 전용 — 제품 코드에 password 경로 없음).
- `.github/workflows/ci.yml`: `app-verify`에 Supabase CLI 설치·`supabase start`·`supabase db reset` 단계를 `pnpm verify` 앞에 추가.
- `tsconfig.json`·`vitest.config.ts`(revision 3): 레이어 밖 최상위 예약 파일(`src/proxy.ts`, 향후 `instrumentation.ts`) 전용 `@/` alias 항목 추가 — 기존 6-레이어 alias의 경계 강제 의미는 불변이며, proxy 단위 테스트(`src/__tests__/proxy.test.ts`)가 이 alias로 import한다.
- `.env.example`(revision 3): Supabase anon·service role 키를 실제 로컬 스택 값(`supabase status -o env`)으로 교정 — 로컬 전용 공개 가능 값이라는 성격은 불변이고, 자리표시자 정책(진짜 비밀값은 `CHANGE_ME`)도 불변이다.

## Data model

- `profiles` 최소 스키마가 이 task의 유일한 DB 변경이다. 컬럼 확장(이름·휴대폰·생년월일·성별·상태)은 P1-T02 소유로, 이 task는 행 존재 여부만 소비한다.
- 세션 저장은 Supabase 기본 쿠키(`sb-*-auth-token`)를 그대로 쓰고 커스텀 저장을 만들지 않는다.
- 보호 판정 계약: `route-access.ts`가 공개 경로 열거를 소유한다. `/onboarding`은 인증 필요·profile 불요 경로로 분류한다.

## Interface

- 리다이렉트 규칙: 미인증 × 보호 경로 → `/login` · 인증 × `/login` → 홈 · 콜백 성공 × profile 무 → `/onboarding` · 콜백 실패 일체 → `/login?error=auth`.
- `/login`은 `error=auth` 쿼리에 재시도 안내 한 줄을 보여준다(오류 원문 미노출).
- dev 전용 `/preview`·`/catalog`는 프로덕션 라우트가 아니므로 보호 대상 판정에서 공개로 남는다.

## Optimizations

- proxy는 세션 검증 외 DB 조회를 하지 않는다(profile 분기는 콜백 시점 1회). 그 외 최적화 없음 — `@supabase/ssr` 표준 패턴을 그대로 따른다.

## 변경 허용 경로

```
src/proxy.ts
src/__tests__/proxy.test.ts
src/app/**
src/views/login/**
src/views/onboarding/**
src/views/more/**
src/features/auth/**
src/entities/identity/**
src/shared/lib/**
src/shared/config/**
supabase/config.toml
supabase/migrations/**
supabase/tests/**
tests/**
playwright.config.ts
tsconfig.json
vitest.config.ts
.env.example
.github/workflows/ci.yml
docs/execution/radio/P1-T01-radio.md
docs/execution/runs/P1-T01/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- profile 없는 인증 사용자가 URL 직접 입력으로 목 화면 탭에 진입하는 것의 차단 — P1-T02 상태 가드가 소유한다. 결정 주체: 사용자, 반환할 단계: P1-T02 설계 인터뷰.
- 호스팅 Supabase 프로젝트 전환(프로덕션 배포용 URL·키·redirect 등록)은 배포 task에서 다룬다 — 결정 주체: 사용자.
