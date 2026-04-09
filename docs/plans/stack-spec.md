# Stack Spec

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 현재 프로젝트에서 사용하는 주요 프레임워크와 라이브러리 버전의 기준 문서다.  
패키지 버전을 올리거나 새 스택을 도입하면 `package.json`, lockfile, 이 문서를 같은 변경에서 같이 맞춘다.

## Decision Rule

- 기본 스택으로 충분하면 새 라이브러리를 늘리지 않는다.
- 같은 문제를 여러 라이브러리로 동시에 풀지 않는다.
- 실제 slice 에서 필요해질 때 도입한다.
- 도입한 기술은 이유와 함께 이 문서에 남긴다.

## Baseline

| Concern | Choice | Version | Why |
| --- | --- | --- | --- |
| Framework | Next.js App Router + React | `next@16.2.3`, `react@19.2.5`, `react-dom@19.2.5` | server-first 구조와 route/screen 분리에 맞는다 |
| React Compiler | Next.js built-in compiler pipeline | `next.config.ts -> reactCompiler: true`, `babel-plugin-react-compiler@1.0.0` | 수동 memo 보일러플레이트를 줄이는 기본 설정으로 둔다 |
| Language | TypeScript | `typescript@5.9.3` | schema, repository, form 타입 경계를 고정한다 |
| Backend | Supabase | `@supabase/supabase-js@2.103.0`, `@supabase/ssr@0.10.2` | auth, Postgres, SSR 연동에 맞는다 |
| Database | Postgres | remote Postgres 17, local CLI `major_version = 17` | 현재 데이터 모델과 마이그레이션 요구에 충분하다 |
| Package manager | pnpm | `pnpm@10.32.1` | 현재 repo 기본값이다 |
| Node version | Node.js 24 LTS | `24.x` target | 프로젝트 기준 런타임이다 |
| Lint | ESLint flat config | `eslint@9.39.4`, `eslint-config-next@16.2.3`, `eslint-plugin-boundaries@6.0.2` | 계층 import 규칙까지 강제한다 |
| Format | Prettier | `prettier@3.8.1` | 포맷팅을 lint와 분리한다 |
| Styling | Tailwind CSS v4 + CSS variables | `tailwindcss@4.2.2`, `@tailwindcss/postcss@4.2.2` | DESIGN 기준 토큰과 App Router 구조에 맞는다 |
| UI primitives | shadcn/ui | `components.json` 기준, `style = new-york` | 공용 primitive UI의 기본 베이스로 쓴다 |
| Server state | TanStack Query | `@tanstack/react-query@5.97.0` | hydration, cache, invalidation에 맞다 |
| Client state | React built-in state | `react@19.2.5` | 현재 범위는 `useState`, `useDeferredValue`, `startTransition`으로 충분하다 |
| Forms | React Hook Form + Zod resolver | `react-hook-form@7.72.1`, `@hookform/resolvers@5.2.2` | 필드 배열, 인라인 검증, 폼 상태 제어가 필요하다 |
| Validation | Zod | `zod@4.3.6` | env, entity, mutation, form 검증을 한 방식으로 맞춘다 |
| Date/time | date-fns | `date-fns@4.1.0` | 행사 시간 계산 범위에 충분하다 |
| Env loading | Next.js built-in `.env*` loading | framework built-in | 별도 env loader가 필요 없다 |
| Env validation | `src/shared/config/env.ts` + Zod parse | `zod@4.3.6` | 런타임 경계를 코드 안에서 검증한다 |
| Testing | Vitest + Playwright | `vitest@4.1.4`, `@playwright/test@1.59.1`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1` | unit, interaction, e2e를 나눠 가져간다 |
| Internal source import | `#/* -> src/*` | TypeScript path alias | 절대 import 규칙을 강제하기 쉽다 |

## Version Policy

- 이 문서의 버전은 `package.json`과 lockfile 기준과 맞아야 한다.
- 패키지 버전을 올리면 문서도 같은 커밋에서 갱신한다.
- 패키지 pin 이 없는 선택은 `framework built-in`, `platform decision`, `components.json 기준`처럼 이유를 같이 남긴다.

## Implementation Note

- React Compiler는 켠다고 해서 구조 문제를 대신 해결하지 않는다.
- 상위 레벨의 과한 `useWatch`, 넓은 client island, 잘못된 state ownership은 계속 직접 정리해야 한다.
- shadcn/ui 는 컴포넌트 구조와 접근성 패턴의 베이스로 사용하고, 색/폰트는 theme token으로 덮어쓴다.
- form 은 `react-hook-form`으로 관리하고, 저장은 server action + mutation hook 조합으로 연결한다.
- Supabase Next.js 연동은 `@supabase/supabase-js`와 `@supabase/ssr` 조합을 기준으로 한다.

## Decide When First Slice Needs It

| Concern | First likely slice |
| --- | --- |
| Toast | 첫 mutation 완료 피드백이 필요할 때 |
| Table or data grid | admin 목록 화면이 더 복잡해질 때 |
| Date picker | 행사 생성 UI가 시간 외 날짜 입력까지 필요할 때 |
| Chart | 정산/분석 화면이 생길 때 |
| Push helper wrapper | 알림 구독/해지 흐름이 본격화될 때 |

## Deferred Until Needed

- toast library
- data grid
- date picker
- chart
- Zustand 같은 전역 client store
