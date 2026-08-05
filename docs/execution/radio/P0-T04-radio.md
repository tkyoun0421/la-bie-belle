# P0-T04 RADIO 개발 설계

- 상태: Approved
- revision: 3
- 기획 승인: user, 2026-08-05
- 개발 설계 승인: user, 2026-08-05 (revision 3 재승인)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-05 | 최초 작성. |
| 2 | 2026-08-05 | 구현 착수 중 worker가 발견한 도구 공백을 정정해 재승인했다(사용자 결정). `vitest.config.ts`에 `@/*` alias가 없어 화면 컴포넌트 테스트가 정본 레지스트리를 import하지 못한다 — tsconfig가 이미 `@/*`를 경로 정본으로 정했으므로 vitest alias 추가는 새 결정이 아니라 기존 결정의 정합화다. `vitest.config.ts`를 변경 허용 경로에 추가했다. P0-T01 교차 검증의 postcss 선례(필요 설정 파일이 봉인 경로 밖, medium 확정)와 같은 유형을 리뷰 전에 정정한 것이다. |
| 3 | 2026-08-05 | 검증 단계의 교차 리뷰(P0-T04-review.json) critical 확정으로 blocked 안전 중단 후, 사용자가 확정 7건(F-01~F-07)의 즉시 수정을 승인해 재봉인했다. 설계 내용 변경은 없다 — 7건 모두 승인 설계 안의 구현 결함이다. F-05(client-secret-scan 미구현)의 수정 대상인 `scripts/**`가 변경 허용 경로 밖이라 경로만 편입한다. 위험표의 '보안 — 서버 비밀 번들 유출' 행이 이 경로의 근거다. |

- 관련 spec: PRD:AC-12, ADR:0001, ADR:0002, DOCS:SDD
- 적용 깊이: 심화 (환경변수 비밀값 경계) + 일반 (화면·manifest)
- test mode: tdd
- 예정 check IDs: app-build, client-secret-scan, env-validation-test, status-screen-test

## Requirements

### 범위와 비목표

- 범위: env zod 스키마와 파서(`shared/model`), 서버·클라이언트 env 상수 2파일(`shared/config`), `.env.example`, Supabase browser·server client factory, Next.js 예약 파일 4종(`loading`·`error`·`global-error`·`not-found`)과 접근 거절 화면 컴포넌트, 오프라인 배너, `app/manifest.ts`와 placeholder 아이콘, 의존성 추가(`zod`, `@supabase/supabase-js`, `@supabase/ssr`).
- 비목표(기획 승인 그대로): service worker·오프라인 캐시(P4-T02), 인증·보호 라우트(P1-T01), 운영 Supabase 프로젝트 생성·배포, 실제 아이콘·브랜드 자산, correlation ID 생성.
- 설계 비목표: `forbidden.tsx`와 `authInterrupts` experimental 플래그(P1이 인증 시점에 채택 여부 결정 — 사용자 결정), Supabase 쿠키·세션 어댑터(P1-T01), TanStack Query 도입(첫 조회 화면 task), `BootstrapScreen` 제거(P0-T35가 실화면으로 대체할 때 정리).

### 불변 규칙

- `process.env` 접근은 `shared/config`의 env 2파일에서만 한다(`DEV-SEC-02`). eslint 예외 경로를 1개에서 2개로 갱신한다.
- 서버 비밀값은 `env.server.ts`만 소유하고 그 파일의 첫 import는 `server-only`다. 클라이언트 코드가 import하면 빌드가 실패한다.
- 필수 환경변수는 ARCHITECTURE 15장의 7범주 전체다(기획 승인). 형식 검증은 환경 무관 상시, placeholder 거부(`changeme` 포함 검사, 대소문자 무시)는 production에서만 한다(사용자 결정).
- 시작 실패 메시지는 문제가 된 키 이름과 사유만 담고 값은 출력하지 않는다(`DEV-OBS-02`).
- 오류·접근 거절 화면은 P0-T37 정본(`ERROR_CODES`·`ERROR_CODE`)의 코드와 기본 문구를 소비하고 새 오류 코드를 만들지 않는다.
- 오프라인은 PATTERNS의 상단 배너 + 변경 행동 비활성화다. 어떤 데이터도 브라우저 저장소에 영속하지 않는다.

### 기술 인수 조건

- `.env.example`을 `.env`로 복사하면 `pnpm dev`와 `pnpm build`가 성공한다. 필수 키 하나를 제거하면 시작이 실패하고 그 키 이름이 오류에 나온다.
- production 모드 검증에서 `changeme` 포함 값이 있으면 시작이 실패한다. dev에서는 같은 값으로 부팅된다.
- 클라이언트 번들에 서버 비밀값(service role·VAPID private·QR 비밀 등)이 포함되지 않는다(`client-secret-scan`). `NEXT_PUBLIC_` 값의 포함은 오탐이 아니다.
- `env.server.ts`를 client 컴포넌트에서 import하면 빌드가 실패한다.
- 예약 파일 4종·접근 거절 화면·오프라인 배너가 컴포넌트 테스트에서 렌더되고, 오류·접근 거절 화면이 레지스트리 기본 문구를 표시한다.
- `/manifest.webmanifest`가 유효한 manifest로 응답하고 192·512 placeholder 아이콘이 존재한다.

### 위험 기반 테스트

| 위험 | 검증 계층 | 배치 |
| --- | --- | --- |
| Happy path — `.env.example` 복사 부팅 | 실행 증거 | `pnpm dev`·`pnpm build` 성공 기록 |
| 주요 실패 — 필수 키 누락·빈 문자열 | 단위 (`shared/model`) | 파서가 키 이름을 담은 오류를 내고 값은 담지 않음을 단언 |
| 경계값 — URL·이메일 형식 위반, 빈 문자열 vs 미정의 | 단위 (`shared/model`) | 형식별 실패 케이스 각 1건 |
| 보안 — production placeholder 거부 | 단위 (`shared/model`) | prod 모드 인자에서 `changeme` 포함 값 거부, dev 모드 통과(오탐 대조군) |
| 보안 — 서버 비밀 번들 유출 | 빌드 검사 | `client-secret-scan`: 번들에서 서버 비밀 문자열 검색, `NEXT_PUBLIC_` 값은 대조군 |
| 화면 — 상태 화면·배너 렌더와 정본 문구 소비 | 컴포넌트 (jsdom) | 화면별 렌더 + `ERROR_CODES` 기본 문구 표시 단언 |
| 동시성 | 해당 없음 | 상수·정적 화면뿐이다 |

오탐 대조군: 유효한 실값은 production 검증을 통과해야 하고, dev는 placeholder로 부팅돼야 한다. 이게 없으면 "전부 거부하는" 구현도 통과한다.

### DEV-* 적용 상태

- `DEV-SEC-02`: 추가 결정 — env 접점을 2파일로 확장하고 eslint 예외 경로를 갱신한다.
- `DEV-SEC-04`, `DEV-OBS-02`: 추가 결정 — 시작 실패 오류는 키 이름·사유만 담고 값을 담지 않는다.
- `DEV-ERR-07`, `DEV-ERR-08`: 기본 적용 — 정본 소비만 하고 코드 추가·응답 구현이 없다.
- `DEV-SSOT-01`: 추가 결정 — env 스키마 정본은 `shared/model/env.ts` 하나다. `shared/config` 2파일은 그 스키마를 호출한 결과 상수만 export한다. placeholder 규약의 정본은 `.env.example`이다.
- `DEV-DATA-*`: 해당 없음 — DB·서버 요청 경로가 없다.
- `DEV-CACHE-*`: 해당 없음 — cache를 도입하지 않는다(TanStack Query는 첫 조회 화면 task).
- `DEV-OFFLINE-01`~`04`: 기본 적용 — 배너는 표시·비활성화 신호만이고 영속 캐시·queue가 없다.
- `DEV-TEST-01`, `DEV-TEST-02`: 기본 적용 — 위 위험 표. env 파서는 mock 없이 실제 객체 입력으로 검증한다.
- `DEV-CODE-07`, `DEV-NAME-*`: 기본 적용.
- `DEV-OPT-*`: 기본값 유지 — 성능 경로가 없다.

## Architecture

- `shared/model/env.ts` — zod 스키마와 파서 함수. 서버·클라이언트 스키마를 분리 정의하고 production placeholder 거부 로직을 갖는다. `model` 세그먼트라 단위 테스트가 필수이고 React import가 금지된다. Zod 스키마의 세그먼트 소유는 `config/fsd.json`의 `model` 정의를 따른다.
- `shared/config/env.server.ts` — 첫 줄 `import "server-only"`, 서버 스키마 파싱 결과 상수 export. `shared/config/env.client.ts` — `NEXT_PUBLIC_`만 파싱한 상수 export. `config` 세그먼트의 `runtimeExports: "constants"`는 함수·클래스 초기화만 금지하므로 파서 호출 상수는 통과한다(`no-runtime-export` 룰 확인 완료).
- `eslint.config.mjs`의 `ENV_MODULE` 예외를 `env.server.ts`·`env.client.ts` 2경로로 바꾼다.
- Supabase factory — `shared/api/supabase-server.ts`(`api` 세그먼트, `requireServerOnly` 충족, `@supabase/ssr` `createServerClient` 얇은 래퍼로 쿠키 어댑터 자리만 두고 미구현), `shared/lib/supabase-browser.ts`(`createBrowserClient` 래퍼 — `api` 세그먼트는 server-only 강제라 브라우저 client는 `lib`에 둔다). 각각 `env.server`·`env.client`만 소비한다.
- 화면 — `views/status/ui/`에 `ErrorScreen`·`AccessDeniedScreen`·`NotFoundScreen`, `app/`의 예약 파일 4종은 views를 소비하는 얇은 어댑터(예약 파일은 fsd `appLayer.exemptFiles`로 테스트 면제, 화면 검증은 컴포넌트 테스트가 담당). `loading.tsx`는 PATTERNS의 skeleton 원칙을 따른다.
- 오프라인 배너 — `widgets/offline/ui/OfflineBanner` + `widgets/offline/hooks/useOnlineStatus`(`navigator.onLine`과 `online`/`offline` 이벤트, `hooks` 세그먼트라 테스트 필수). 문구는 PATTERNS 정본 `인터넷 연결이 끊겼어요`.
- `app/manifest.ts` — Next metadata route. 이름 `라비에벨`, `theme_color` `#0052ff`(FOUNDATIONS `blue-500`), `background_color` `#ffffff`, placeholder 아이콘 192·512는 `public/icons/`.
- `vitest.config.ts` — tsconfig의 `@/*` 경로 정본을 따라가는 alias를 추가한다(revision 2). 화면 컴포넌트 테스트가 정본 레지스트리를 `@/shared/config/error-codes.config`로 import하기 위한 정합화다.

## Data model

DB 변경이 없다. env 스키마의 변수 계약은 다음과 같다. 변수명이 계약이므로 소비 task는 재결정 없이 참조한다.

| 범주 | 변수 | 노출 | 상시 형식 |
| --- | --- | --- | --- |
| Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` | 공개 | URL |
| Supabase publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 | 비어 있지 않음 |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` | 서버 | 비어 있지 않음 |
| Google OAuth | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | 서버 | 비어 있지 않음 |
| VAPID | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`(공개), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | 서버·공개 | 비어 있지 않음 |
| 슈퍼 관리자 | `SUPER_ADMIN_EMAIL` | 서버 | 이메일 |
| QR 서명 비밀 | `QR_SIGNING_SECRET` | 서버 | 비어 있지 않음 |
| 기준 URL | `NEXT_PUBLIC_APP_URL` | 공개 | URL |

- `.env.example`의 placeholder 규약: 문자열은 `CHANGE_ME_<용도>`, 이메일은 `changeme@example.com`. Supabase 로컬 값은 `supabase start`의 고정 공개 키를 실값으로 넣는다.
- production 판정은 `NODE_ENV === "production"`이며 `pnpm build`가 이 경로를 지난다. 로컬 build 검증이 placeholder로 막히지 않도록 거부는 시작(런타임 서버 기동) 시점 파싱에서만 강제하고, 그 구분이 구현에서 어려우면 `VERCEL_ENV` 존재로 판정을 좁힌다 — 세부는 구현이 정하되 "운영에서 placeholder 불가" 결과는 불변이다.

## Interface

- 시작 실패 오류 형식: 문제 키 이름과 사유(누락·형식·placeholder)를 나열하고 값은 출력하지 않는다.
- 상태 화면의 오류 표시: `ErrorScreen`은 `COMMON_UNEXPECTED`, `AccessDeniedScreen`은 `COMMON_FORBIDDEN`, `NotFoundScreen`은 `COMMON_NOT_FOUND`의 기본 문구를 표시하고 안전한 상위 화면 경로(홈)를 제공한다. 문의용 식별자는 optional prop 자리만 둔다 — 생성은 P0-T37 미결(첫 서버 오류 경로)을 따른다.
- factory 시그니처는 얇은 래퍼로 유지하고 세부는 구현이 정한다. 쿠키·세션은 P1-T01 계약이다.
- 멱등성·캐시·오프라인 영속: 해당 없음.

## Optimizations

기본값 유지. 정적 화면과 시작 시 1회 파싱뿐이라 측정할 병목이 없다(`DEV-OPT-01` 기록).

## 변경 허용 경로

```
package.json
pnpm-lock.yaml
.env.example
eslint.config.mjs
vitest.config.ts
scripts/**
src/app/**
src/views/**
src/widgets/**
src/shared/**
public/**
docs/execution/radio/P0-T04-radio.md
docs/execution/runs/P0-T04/**
docs/execution/reviews/**
docs/execution/phases/index.jsonl
docs/execution/phases/00-foundation.md
docs/execution/dashboard/**
```

## 미결 사항

- Google OAuth 변수의 실소비 형태는 P1-T01이 정한다. Supabase 대시보드 설정으로 대체되면 스키마에서 제거하는 조정은 P1-T01 RADIO가 소유한다(7범주 필수라는 기획 결정은 유지하되 범주의 구성 변수는 소비 task가 정합화).
- production 판정의 세부(NODE_ENV vs VERCEL_ENV)는 구현이 확정하고 handoff에 기록한다.
- `forbidden.tsx` 채택, 쿠키 어댑터, correlation ID 생성은 P1 이후 소유.
