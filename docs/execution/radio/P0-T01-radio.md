# P0-T01 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-04
- 개발 설계 승인: user, 2026-08-04 (revision 2 재승인)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-04 | 최초 승인. |
| 2 | 2026-08-04 | 실행 중 드러난 세 가지를 반영해 재승인했다. ①변경 허용 경로에 `postcss.config.mjs`(Tailwind v4가 PostCSS 플러그인으로 동작)와 이 RADIO 파일 자신을 추가 ②서버 경계 모듈 위치를 TDD guard와 양립하도록 정정 ③`app-build` 검증을 재실행 가능한 명령으로 고정. 함께 코드 주석 정책을 명시했다. |
- 관련 spec: ADR:0001
- 적용 깊이: 일반
- test mode: verification
- 예정 check IDs: app-build, typecheck

## Requirements

- 범위와 비목표:
  - 범위: pnpm 기반 Next.js App Router + TypeScript 프로젝트 생성, `src/` FSD 계층 골격과 절대 경로 alias, 서버·클라이언트 경계 규약, 모바일 viewport와 한국어 metadata, Tailwind CSS 설치와 빈 테마 골격, 부트스트랩 확인용 최소 화면 1개.
  - 비목표: 디자인 토큰·컴포넌트(P0-T34), PWA manifest·아이콘(P0-T04), service worker와 Web Push(P4-T02), ESLint·formatter·테스트 도구(P0-T02), Supabase 연동(P0-T03), CI(P0-T05).
- 불변 규칙:
  - [FSD 계층](../../standards/DEVELOPMENT.md#fsd와-서버-경계)의 의존 방향(위 → 아래)과 `app`만 route 파일을 갖는 규칙을 골격 단계부터 지킨다.
  - 서버 전용 값은 클라이언트 번들에 들어가지 않는다. 이 task는 검증 수단을 세우는 것까지가 범위다.
  - MVP 밖 기능을 위한 선행 추상화를 만들지 않는다. 빈 계층 디렉터리는 `.gitkeep`과 한 줄 README 대신 실제로 쓰이는 시점에 만든다.
- 기술 인수 조건:
  - `pnpm dev`로 개발 서버가 뜨고 모바일 viewport에서 최소 화면이 렌더된다.
  - `pnpm build`(production)와 `pnpm typecheck`가 오류 없이 끝난다.
  - `src/` 디렉터리 이름과 계층 순서가 개발 컨벤션과 일치한다.
  - 서버 전용 모듈의 값이 클라이언트 번들에 포함되지 않음을 실제 빌드 산출물에서 확인한다.
- 위험 기반 테스트:
  - 이 task의 위험은 "설정이 잘못돼도 화면이 뜬다"는 착시다. 따라서 검증은 단위 테스트가 아니라 **빌드와 산출물 검사**로 배치한다(테스트 도구 자체가 P0-T02 범위이기도 하다).
  - `app-build`: `pnpm build`가 성공하고, 생성된 클라이언트 번들에 서버 전용 표식 문자열이 없음을 확인한다.
  - `typecheck`: `tsc --noEmit`이 오류 0건.
- DEV-* 적용 상태:
  - `DEV-ARCH-01`~`DEV-ARCH-03`: 추가 결정 — 골격과 경계 규약으로 선반영하고, 기계적 강제(ESLint 규칙)는 P0-T02가 맡는다.
  - `DEV-ARCH-04`, `DEV-ARCH-05`: 해당 없음 — 도메인 코드가 없다.
  - `DEV-TEST-*`: 예외 — 이 task는 테스트 도구 설치 전 단계라 자동 테스트 대신 빌드·산출물 검증으로 대체한다. 되돌림 조건: P0-T02 완료 후 이 task의 인수 조건을 회귀 테스트로 옮길 필요가 생기면 새 task로 제안한다.
  - `DEV-SEC-*`: 기본 적용 — 이 단계에는 비밀값이 없다. 환경변수 처리는 P0-T04.

## Architecture

### 버전과 런타임

- Next.js **16.3**(2026-08-03 릴리스), React **19.2**, TypeScript 5.x, Tailwind CSS **v4**.
- Node.js는 Next.js 16이 20.9+를 요구하고 harness가 type stripping 때문에 22.6+를 요구하므로 `engines.node`는 현행 `>=22.6`을 유지한다.
- Turbopack이 Next.js 16의 dev·build 기본값이다. `--turbopack` 플래그를 붙이지 않는다. webpack 설정을 두지 않는다.
- React Compiler는 **켜지 않는다**(사용자 결정, 2026-08-04). Babel 의존으로 dev·build가 느려지는 비용에 비해 이 규모에서 얻을 이득이 없다. 필요해지면 `reactCompiler: true` 한 줄로 켠다.
- `cacheComponents`(PPR)와 그 밖의 실험 플래그는 쓰지 않는다.

### FSD 계층 이름 (Pages Router 충돌 해소)

Next.js는 `src/pages/`를 Pages Router 디렉터리로 해석해 그 아래 모든 파일을 라우트로 만들려 한다. FSD의 `pages` 계층을 그대로 두면 화면 조합 파일이 라우트가 되거나 빌드가 깨진다. 사용자 결정(2026-08-04)에 따라 계층 이름을 `views`로 바꾼다.

```text
src/
  app/       Next.js route, layout, provider, 얇은 route adapter
  views/     route 화면 조합 (기존 이름: pages)
  widgets/   독립적인 화면 블록
  features/  사용자 행위, Server Action, mutation 상태
  entities/  도메인 모델, 순수 규칙, DTO, entity 조회
  shared/    재사용 UI, 설정, 공통 서버 client 기반
```

- 계층의 **책임과 의존 방향은 그대로**다. 이름만 바꾼다.
- 정본인 [개발 컨벤션](../../standards/DEVELOPMENT.md)의 계층 표와 `CLAUDE.md` 요약을 같은 변경으로 맞춘다. 두 문서가 이 task의 변경 허용 경로에 포함되는 이유다.
- 절대 경로 alias는 계층별로 준다: `@/app/*`, `@/views/*`, `@/widgets/*`, `@/features/*`, `@/entities/*`, `@/shared/*`. 계층 밖을 가리키는 alias는 만들지 않는다.

### 서버·보안 경계

- 서버 전용 모듈은 첫 import로 `import "server-only"`를 선언한다. 이 task에서는 `src/shared/config/server-only.config.ts`에 그 규약을 보여주는 최소 선언과, 클라이언트 번들에 새지 않음을 확인하는 절차를 남긴다.
- 위치를 `src/shared/lib/server/`가 아니라 `shared/config`로 잡는 이유(revision 2): `.claude/hooks/tdd-guard.sh`가 대응 테스트 없는 `src/` 로직 파일 편집을 막는데, 이 task는 테스트 도구 설치 전 단계이고(`DEV-TEST-*` 예외) `server-only`를 import하는 모듈은 `react-server` 조건 밖에서 로드되면 예외를 던져 Node 테스트로도 검증할 수 없다. 파일 내용이 상수 선언뿐이라 `shared`의 설정 소유 책임과 가드 예외(`*.config.*`) 양쪽에 맞는다. 가드를 우회하지 않는다.
- `server-only` 패키지가 그 강제를 담당한다. 별도 런타임 코드를 만들지 않는다.
- 클라이언트 번들 검사는 빌드 산출물(`.next/static/**`)에서 서버 전용 표식 문자열을 grep해 0건인지 보는 방식으로 한다. 이 task에는 아직 비밀값이 없으므로 표식은 테스트용 상수다.

### 코드 주석 정책 (revision 2)

- 코드에 설명 주석과 JSDoc 블록을 쓰지 않는다(사용자 결정, 2026-08-04). 의도는 이름과 구조로 드러낸다.
- 설계 근거는 RADIO와 handoff가 소유한다. 코드에 중복해 적지 않는다.
- 예외는 코드로 표현할 수 없는 제약(외부 명세 링크, 우회 사유)뿐이며 한 줄로 최소화한다.
- 이 정책은 프로젝트 전체 규약이므로 [개발 컨벤션](../../standards/DEVELOPMENT.md)에 규칙으로 함께 기록한다.

### Clean Code·재사용

- 라우트 파일은 얇은 adapter로만 둔다. 부트스트랩 화면의 실제 마크업은 `src/views/`에 두고 `src/app/page.tsx`가 그것을 렌더한다. 첫 화면부터 계층 규약을 어기지 않기 위함이다.
- 지금 쓰이지 않는 계층 디렉터리는 만들지 않는다. `app`, `views`, `shared`만 실제로 만들고 나머지는 사용 시점에 만든다. 빈 디렉터리와 `.gitkeep`은 `DEV-CODE-04`가 금지하는 이름뿐인 구조다.

### DEV-* 적용 상태

- `DEV-ARCH-01`: 추가 결정 — 계층 이름 `pages` → `views`. 의존 방향 규칙은 불변.
- `DEV-ARCH-02`, `DEV-ARCH-03`: 기본 적용.
- `DEV-CODE-04`: 기본 적용 — 미사용 계층 디렉터리를 선행 생성하지 않는다.

## Data model

- 이 task는 도메인 데이터를 다루지 않는다. 정본·파생 데이터 구분이 없다.
- 설정 파일의 소유권만 정한다.
  - `next.config.ts` — Next.js 설정. 이 task에서는 최소 설정만 둔다.
  - `tsconfig.json` — strict, 계층별 path alias. `strict: true`는 이 task에서 켠다(P0-T02는 lint 도구를 다룬다).
  - `src/app/globals.css` — Tailwind v4의 CSS-first 설정 위치. `@import "tailwindcss"`와 **빈 `@theme` 블록**만 둔다. 토큰 값은 P0-T34가 이 블록을 채운다. Tailwind v4는 `tailwind.config.js`를 쓰지 않으므로 "설정 파일 골격"은 이 `@theme` 블록이다.

## Interface

- `pnpm dev` — 개발 서버(Turbopack).
- `pnpm build` — production 빌드(Turbopack).
- `pnpm start` — production 서버.
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm check:app-build` — `app-build` check의 실행 가능한 형태. `scripts/check-app-build.mjs`가 production 빌드를 돌린 뒤 `.next/static/**`에서 서버 전용 표식을 찾아 1건이라도 있으면 한국어 오류와 종료 코드 1로 끝낸다. 수동 확인이 아니라 명령으로 남겨야 이후 회귀에서도 같은 검증이 돈다(revision 2).
- 등록 check
  - `app-build`: `pnpm check:app-build` 종료 코드 0.
  - `typecheck`: `pnpm typecheck` 오류 0건.
- 기존 harness 명령(`pnpm gate:*`, `pnpm harness:*`, `pnpm dashboard`)은 그대로 유지한다. 앱 스크립트와 이름이 겹치지 않는다.

## Optimizations

- 근거 없는 최적화를 하지 않는다. Turbopack 파일시스템 캐시는 Next.js 16 기본값이라 그대로 둔다.
- 이미지·폰트 최적화는 각각의 소비 task(P0-T34 폰트, 이후 화면 task)에서 다룬다.

## 변경 허용 경로

```
package.json
pnpm-lock.yaml
next.config.ts
postcss.config.mjs
tsconfig.json
next-env.d.ts
.gitignore
src/**
scripts/**
public/**
docs/standards/DEVELOPMENT.md
CLAUDE.md
docs/execution/radio/P0-T01-radio.md
docs/execution/runs/P0-T01/**
docs/execution/reviews/**
docs/execution/phases/index.jsonl
docs/execution/dashboard/**
```

## 미결 사항

- 없음. 버전 채택(Next.js 16.3 / React 19.2 / Tailwind v4), 계층 이름(`views`), React Compiler 미사용, revision 2의 세 항목과 주석 정책은 2026-08-04 사용자 결정으로 확정했다.
