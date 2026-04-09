# Stack Spec

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 프레임워크, 주요 라이브러리, 버전 선택의 source of truth다.

중요한 원칙은 두 가지다.

- 초반 구조를 바꾸는 선택은 `Phase 0` 또는 아키텍처 정리 단계에서만 한다
- 보조 라이브러리는 실제 slice가 처음 필요해질 때까지 미룬다

## Decision Rule

- 기본 스택으로 충분하면 새 라이브러리를 추가하지 않는다
- 같은 문제를 여러 라이브러리로 동시에 풀지 않는다
- 새 선택은 이 문서에 바로 기록한다
- 아직 쓰지 않는 라이브러리는 미리 고르지 않는다

## Baseline

| Concern                | Choice                                      | Version                                                                                                       | Why                                                                        |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Framework              | Next.js App Router + React                  | `next@16.2.3`, `react@19.2.5`, `react-dom@19.2.5`                                                             | 서버 중심 구조와 route/screen 분리에 맞는다                                |
| Language               | TypeScript                                  | `typescript@5.9.3`                                                                                            | 도메인 모델과 schema 공유가 필요하다                                       |
| Backend                | Supabase                                    | `@supabase/supabase-js@2.103.0`, `@supabase/ssr@0.10.2`                                                       | Auth, Postgres, RLS 중심 구조와 맞는다                                     |
| Database               | Postgres                                    | remote Postgres 17, local CLI `major_version = 17`                                                            | 현재 데이터 모델과 제약을 담기 충분하다                                    |
| Auth direction         | Google sign-in                              | provider decision, package pin 없음                                                                           | 제품 방향에서 이미 잠겨 있다                                               |
| Package manager        | pnpm                                        | `pnpm@10.32.1`                                                                                                | 현재 repo 기준 boring default다                                            |
| Node version           | Node.js 24 LTS                              | `24.x` target                                                                                                 | 현재 Active LTS이고 Next 요구사항보다 높다                                 |
| Lint                   | ESLint flat config                          | `eslint@9.39.4`, `eslint-config-next@16.2.3`, `eslint-plugin-boundaries@6.0.2`                                | 계층 import 규칙까지 강제한다                                              |
| Format                 | Prettier                                    | `prettier@3.8.1`                                                                                              | 포맷팅을 lint와 분리한다                                                   |
| Styling                | Tailwind CSS v4 + CSS variables             | `tailwindcss@4.2.2`, `@tailwindcss/postcss@4.2.2`                                                             | DESIGN 방향과 App Router 구조에 맞는다                                     |
| UI primitives          | shadcn/ui                                   | package pin 없음, `components.json` 기준 `style = new-york`                                                   | 공용 primitive를 빠르게 확보할 수 있다                                     |
| Server state           | TanStack Query                              | `@tanstack/react-query@5.97.0`                                                                                | hydration, cache, invalidation, optimistic UX에 맞다                       |
| Client state           | React built-in state                        | `react@19.2.5`                                                                                                | 현재 범위는 `useState`, `useDeferredValue`, `startTransition`으로 충분하다 |
| Forms                  | Server Action-first form + `useActionState` | React/Next built-in                                                                                           | App Router와 가장 잘 맞고 초기 복잡도를 낮춘다                             |
| Validation             | Zod                                         | `zod@4.3.6`                                                                                                   | form, mutation, env schema를 한 방식으로 맞춘다                            |
| Date/time              | date-fns                                    | `date-fns@4.1.0`                                                                                              | 행사 시간 계산 범위를 다루기에 충분하다                                    |
| Env loading            | Next.js built-in `.env*` loading            | framework built-in                                                                                            | 별도 env 라이브러리가 필요 없다                                            |
| Env validation         | `src/shared/config/env.ts` + Zod parse      | `zod@4.3.6`                                                                                                   | env 검증을 코드 안에서 일관되게 처리한다                                   |
| Testing                | Vitest + Playwright                         | `vitest@4.1.4`, `@playwright/test@1.59.1`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1` | unit/integration/e2e를 나누기에 적합하다                                   |
| Internal source import | `#/* -> src/*`                              | TypeScript path alias                                                                                         | 내부 import 규칙을 강제하기 쉽다                                           |

## Version Policy

- 이 문서의 버전 수치는 `package.json`과 실제 lockfile 기준과 맞아야 한다
- 라이브러리를 추가하거나 올리면 같은 변경에서 이 문서도 같이 갱신한다
- package version이 없는 선택은 `framework built-in`, `platform decision`, `components.json 기준`처럼 예외 사유를 적는다

## Implementation Note

- `packageManager` 필드는 `pnpm` 기준으로 기록한다
- Node 기준 파일은 bootstrap 시 `.nvmrc`로 고정한다
- ESLint는 structure rule까지 포함하고, Prettier는 포맷만 담당한다
- shadcn/ui는 공용 primitive UI 기준이다
- TanStack Query는 server hydration 이후 client-side server state를 담당한다
- 로컬 client state는 React built-in을 우선 사용한다
- 공통 전역 store는 실제 cross-screen ephemeral state가 생기기 전까지 도입하지 않는다
- form은 server action을 직접 호출하고 Zod schema로 검증한다
- React Hook Form은 기본 스택으로 두지 않는다
- Supabase Next.js 연동은 `@supabase/supabase-js`와 `@supabase/ssr` 조합을 기준으로 한다

## Decide When First Slice Needs It

아래는 실제 slice가 처음 필요해질 때만 도입한다.

| Concern              | First likely slice                  |
| -------------------- | ----------------------------------- |
| Toast                | 첫 mutation 완료 피드백이 필요할 때 |
| Modal or dialog      | 승인/확정/종료 확인 UI가 생길 때    |
| Table or data grid   | admin 목록 화면이 커질 때           |
| Date picker          | 행사 생성 UI가 더 정교해질 때       |
| Icons                | shadcn/ui primitive만으로 부족할 때 |
| Chart                | 분석 요소가 생길 때                 |
| Map or geo UI helper | 체크인 위치 UX를 강화할 때          |
| Push helper wrapper  | 푸시 구독/해제 slice를 구현할 때    |

## Deferred Until Needed

- toast
- modal/dialog
- table/grid
- date picker
- icons
- chart
- map/geo UI helper
- push helper wrapper
- Zustand 같은 별도 client store
