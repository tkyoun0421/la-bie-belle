# FSD Profile

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 이 프로젝트의 폴더 계층 규칙과 import 규칙을 짧게 고정한다.  
상세한 폴더 책임과 배치 기준은 [Folder Hierarchy](./folder-hierarchy.md)를 source of truth로 본다.

## Layer Order

현재 canonical layer order는 아래와 같다.

```text
app -> screens -> mutations -> queries -> entities -> shared
```

- `app`
  - Next.js route, layout, provider, hydration entry
- `screens`
  - 화면 조합 전용 레이어
- `mutations`
  - write use case, server action, mutation hook
- `queries`
  - read use case, query key, fetcher, query hook
- `entities`
  - domain core, repository, schema, mapper, formatter, policy
- `shared`
  - domain-neutral primitive UI, infra, util

## Import Rules

- 내부 import는 모두 `#/*` 절대 경로를 사용한다.
- `./`, `../` 기반 상대 경로 import는 테스트 코드 외에는 금지한다.
- barrel file `index.ts`는 두지 않는다.
- `shared`는 `app`, `screens`, `mutations`, `queries`, `entities`를 import하지 않는다.
- `entities`는 `shared`만 import할 수 있다.
- `queries`는 `entities`, `shared`만 import할 수 있다.
- `mutations`는 `entities`, `shared`, 그리고 같은 도메인의 `queries/constants`를 import할 수 있다.
- `screens`는 `mutations`, `queries`, `entities`, `shared`를 조합할 수 있다.
- `app`은 route entry로서 `screens`, `mutations`, `queries`, `entities`, `shared`를 import할 수 있다.
- `app`과 `screens`만 여러 도메인을 조합할 수 있다.
- `mutations`, `queries`, `entities`는 같은 레이어 안에서 다른 도메인을 import하지 않는다.

## Folder Rules

- `app`, `screens`의 private support folder는 `_` prefix를 사용한다.
- 예: `_components`, `_providers`, `_tests`
- `mutations`, `queries`, `entities`, `shared`는 `_` prefix 대신 의미가 드러나는 일반 폴더명을 쓴다.
- 예: `actions`, `hooks`, `models`, `services`, `repositories`, `constants`, `tests`

## UI Rules

- `shared/components/ui`에는 primitive dumb UI만 둔다.
- `screens/*/_components`에는 화면 전용 dumb UI와 client island를 둔다.
- `mutations`와 `queries`에는 UI component를 두지 않는다.
- `entities`에는 현재 기준으로 React component를 두지 않는다.

## State Rules

- server state는 `TanStack Query`와 server hydration을 기준으로 관리한다.
- read-side client state는 `queries/*/hooks`에 둔다.
- write-side edit state와 mutation orchestration은 `mutations/*/hooks`에 둔다.
- `screens`는 상태 owner가 아니라 조합 owner다.
- 화면 전용 state가 불가피할 때만 `screens/*/_components` 내부의 client component에 국소적으로 둔다.

## Naming Rules

- 폴더명은 `kebab-case`
- React component 파일은 `PascalCase.tsx`
- 일반 파일은 `camelCase.ts` 또는 `camelCase.tsx`
- hook 파일은 `useXxx.ts`
- test 파일은 `camelCase.test.ts`
- query transport 함수는 `fetch*`
- repository read 함수는 `read*`
- mutation action 파일은 `create*`, `update*`, `delete*`, `approve*`처럼 동사 기준으로 짓는다.

## Test Rules

- 테스트는 owner 가까이에 colocate한다.
- `screens` 테스트는 `screens/*/_tests`
- `mutations`, `queries`, `entities` 테스트는 각 도메인 폴더의 `tests`
- truly cross-route E2E만 `e2e/`에 둔다.

## Current Rule

- 폴더 배치 판단이 애매하면 [Folder Hierarchy](./folder-hierarchy.md)를 우선한다.
- 실제 route와 현재 canonical tree는 [Codebase Architecture](./codebase-architecture.md)를 따른다.
