# FSD Profile: 웨딩홀 근무 운영 PWA

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-09

## Purpose
이 문서는 이 프로젝트에서 쓰는 개인화된 FSD 규칙을 고정한다.  
반복 예시는 줄이고, 실제로 코드베이스를 자를 때 필요한 규칙만 남긴다.

## Layer Model
- `app`
  - route, layout, provider, auth/session bootstrap, 최상위 context
- `flows`
  - 화면 조합 전용 레이어
- `mutations`
  - 쓰기 유스케이스 완결 레이어
- `queries`
  - 읽기 유스케이스 완결 레이어
- `shared`
  - 공용 로직과 공용 UI

기본 뼈대:

```text
src/
  app/
  flows/
  mutations/
  queries/
  shared/
```

## Layer Responsibilities

### App
- route segment와 Next.js 예약 파일만 둔다
- layout, provider, auth bootstrap까지만 가진다
- 화면 조합 로직은 두지 않는다

### Flows
- 화면 기준으로 자른다
- 여러 `queries`, `mutations`, `shared`를 조합한다
- business logic은 두지 않는다
- section ordering, empty state, action wiring 같은 화면 조합 로직만 둔다

### Mutations
- 도메인 기준으로 자른다
- 권한 검사, 도메인 검증, 상태 전이 검증, 트랜잭션, audit log, side effect까지 포함한다
- 얇은 command wrapper로 두지 않는다

### Queries
- 도메인 기준으로 자른다
- 권한/가시성 필터, join, aggregation, view model 조립까지 포함한다
- raw read wrapper로 두지 않는다

### Shared
- 도메인에 속하지 않는 공용 요소를 둔다
- 세션/auth 같은 cross-cutting concern도 여기서 다룬다

## Partition Rule
- `flows`는 화면 기준
- `queries`와 `mutations`는 도메인 기준
- `flows` 아래에 도메인 트리를 복제하지 않는다

초기 도메인 집합:
- `auth`
- `users`
- `events`
- `assignments`
- `replacements`
- `checkins`
- `payroll`
- `workflow`

## Shared Structure
```text
src/shared/
  components/
  lib/
  config/
  api/
  models/
  utils/
  types/
```

## Import Rules
- 같은 도메인 내부 import는 자유롭게 허용한다
- barrel file `index.ts`는 쓰지 않는다
- 프로젝트 내부 소스 import는 모두 `#/*` 절대 경로를 사용한다
- `./`, `../` 기반 상대 경로 import는 내부 소스 코드에서 금지한다
- `flows`는 여러 도메인을 조합할 수 있다
- `queries`와 `mutations`의 cross-domain import는 기본 금지다
- 사용자 세션 정보는 `shared/lib/auth` 같은 shared 경계에서 처리한다
- 실제 사용자 도메인 데이터는 `queries/users/*`를 통해서만 읽는다
- `app`은 `flows`와 `shared`만 본다

예시:
- `#/flows/dashboard/components/DashboardScreen`
- `#/queries/users/get-my-profile/models/services/getMyProfile`
- `#/shared/lib/auth/getSessionActor`
- 외부 패키지는 `react`, `next/navigation`, `zod`처럼 package import를 그대로 쓴다

## Internal Shape

### Flows
```text
src/flows/dashboard/
  components/
  hooks/
  models/
  tests/
```

- `components`: 화면 조합용 UI
- `hooks`: polling, form wiring, action binding 같은 React 전용 로직
- `models`: 화면 조합 로직
- `tests`: flow 조합 테스트

### Queries And Mutations
```text
src/mutations/replacements/approve-replacement/
  actions/
  components/
  hooks/
  models/
  tests/
```

- `actions`: 진입점
- `components`: 유스케이스 전용 UI가 있을 때만 추가
- `hooks`: React 전용 wiring
- `models`: 유스케이스 로직
- `tests`: 해당 유스케이스 테스트

### Models Subfolders
- `services`
- `schemas`
- `types`
- `constants`

모든 하위 폴더는 강제가 아니라 필요할 때만 만든다.

## Server Boundary Rule
- server action 파일은 최상위 `actions` 레이어를 만들지 않는다
- 각 mutation 유스케이스 내부 `actions/`에 둔다
- 기본 파일명은 `actions/action.ts`
- `app`은 action을 정의하지 않고 호출만 한다

## Hooks Rule
- hook은 해당 flow 또는 유스케이스의 `hooks/` 아래에 둔다
- route 근처에 ad-hoc hook을 만들지 않는다
- 순수 business logic은 hook이 아니라 같은 유스케이스의 `models/`로 내린다

## Test Rule
- 테스트는 각 flow 또는 유스케이스 폴더 내부 `tests/`에 colocate한다
- global `tests/`를 기본값으로 두지 않는다
- cross-flow E2E가 커질 때만 별도 `e2e/`를 검토한다

## Naming
- 폴더는 `kebab-case`
- React 컴포넌트 파일은 `PascalCase.tsx`
- 일반 파일은 `camelCase.ts` 또는 `camelCase.tsx`
- hook 파일은 `useXxx.ts` 또는 `useXxx.tsx`
- test 파일은 `camelCase.test.ts` 또는 `camelCase.test.tsx`
- Next.js 예약 파일은 framework naming을 그대로 따른다
- import 경로는 내부 소스 기준 항상 `#/*` 절대 경로를 사용한다

## Current Rule
- 현재 canonical tree는 [Codebase Architecture](./codebase-architecture.md)를 따른다
- 새 케이스가 애매하면 먼저 기존 규칙에 맞춰 최소 구조로 추가하고, 반복 패턴이 생길 때만 규칙을 확장한다
