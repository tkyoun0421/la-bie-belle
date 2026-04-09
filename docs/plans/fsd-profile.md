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
  - 읽기 유스케이스와 same-domain pure-read core를 담는 레이어
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

Support folders under `src/app` and `src/flows` must use a private `_` prefix.

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

- ESLint는 FSD 경계를 강제한다.
- `shared`는 `app`, `flows`, `queries`, `mutations`를 import하지 않는다.
- `queries`는 `app`, `flows`, `mutations`를 import하지 않는다.
- `queries`는 같은 레이어 안에서 다른 도메인을 import하지 않는다.
- `queries/models/{constants,mappers,repositories,schemas,types}`는 same-domain pure-read core다.
- `mutations`는 `app`, `flows`를 import하지 않는다.
- `mutations`는 같은 도메인의 query core만 import할 수 있다.
- `mutations`는 `queries/hooks`, `queries/components`, `queries/models/services`, 다른 도메인 query core를 import하지 않는다.
- `flows`는 `app`을 import하지 않는다.
- `app`, `shared`를 제외한 각 레이어는 같은 레이어 안에서 다른 도메인을 import하지 않는다.

- 같은 도메인 내부 import는 자유롭게 허용한다
- barrel file `index.ts`는 쓰지 않는다
- 프로젝트 내부 소스 import는 모두 `#/*` 절대 경로를 사용한다
- `./`, `../` 기반 상대 경로 import는 내부 소스 코드에서 금지한다
- `flows`는 여러 도메인을 조합할 수 있다
- `app`, `shared`를 제외한 레이어의 cross-domain import는 lint로 금지한다
- 사용자 세션 정보는 `shared/lib/auth` 같은 shared 경계에서 처리한다
- 실제 사용자 도메인 데이터는 `queries/users/*`를 통해서만 읽는다
- `app`은 top layer로서 route/page/layout/provider 성격에 맞게 `flows`, `queries`, `mutations`, `shared`를 조합할 수 있다

예시:

- `#/flows/dashboard/DashboardScreen`
- `#/flows/admin/templates/AdminTemplatesScreen`
- `#/queries/events/models/repositories/eventTemplateRepository`
- `#/queries/users/models/services/getMyProfile`
- `#/shared/lib/auth/getSessionActor`
- 외부 패키지는 `react`, `next/navigation`, `zod`처럼 package import를 그대로 쓴다

## Internal Shape

### Flows

```text
src/flows/admin/templates/
  AdminTemplatesScreen.tsx
  _components/
  _tests/
```

- `AdminTemplatesScreen.tsx`: flow 진입점이자 server shell
- `_components`: 화면 전용 dumb UI와 꼭 필요한 client island
- `_tests`: flow 조합 테스트
- `_hooks`는 기본값이 아니다. cross-domain client orchestration을 다른 방법으로 풀 수 없을 때만 예외적으로 둔다.

### Queries And Mutations

```text
src/queries/events/
  hooks/
  models/
  tests/

src/mutations/events/
  actions/
  hooks/
  models/
  tests/
```

- 도메인 폴더 아래에 `actions`, `hooks`, `models`, `tests`를 둔다
- 유스케이스는 `create-event-template/` 같은 하위 폴더가 아니라 파일명으로 구분한다
- 예:
  - `actions/createEventTemplate.ts`
  - `hooks/useCreateEventTemplateMutation.ts`
  - `models/services/fetchEventTemplates.ts`
  - `models/repositories/eventTemplateRepository.ts`
  - `tests/createEventTemplateAction.test.ts`
- `actions`: mutation 진입점
- `hooks`: React 전용 wiring과 도메인 소유 client state를 둔다
- `models`: 도메인 로직
- `tests`: 도메인 단위 테스트
- `queries/models/{constants,mappers,repositories,schemas,types}`는 same-domain pure-read core다
- query core는 `mutations`가 볼 수 있지만, `hooks`, `models/services`는 볼 수 없다

### Models Subfolders

- `repositories`
- `services`
- `schemas`
- `types`
- `constants`

모든 하위 폴더는 강제가 아니라 필요할 때만 만든다.

## Server Boundary Rule

- server action 파일은 최상위 `actions` 레이어를 만들지 않는다
- 각 mutation 도메인 폴더의 `actions/`에 둔다
- 파일명은 `createEventTemplate.ts`, `approveReplacement.ts`처럼 유스케이스가 드러나게 짓는다
- `app`은 action을 정의하지 않고 호출만 한다

## Hooks Rule

- hook은 owner가 분명한 도메인 폴더의 `hooks/` 아래에 둔다
- route 근처에 ad-hoc hook을 만들지 않는다
- 순수 business logic은 hook이 아니라 같은 도메인의 `models/`로 내린다
- query/mutation orchestration, form state, filter state는 가능한 도메인 `hooks/`로 내린다
- `flows/_hooks`는 기본적으로 만들지 않는다
- cross-domain client state가 정말 unavoidable할 때만 `flows/*/_hooks`를 예외적으로 검토한다

## Components Rule

- UI 컴포넌트는 가능한 dumb component로 유지한다
- 도메인 전용 UI여도 side effect, data fetch, mutation 호출은 직접 넣지 않는다
- UI는 기본적으로 `flows/*/_components`에 둔다
- 도메인 로직이 필요한 경우 component가 아니라 같은 도메인의 `hooks/`나 `models/`로 분리한다
- `queries`와 `mutations`에는 UI 컴포넌트를 두지 않는다
- `flows`는 server shell과 화면 레이아웃 조합을 맡고, 도메인 hook과 dumb component를 연결한다

## Test Rule

- 테스트는 각 flow 또는 도메인 폴더 내부 `_tests/` 또는 `tests/`에 colocate한다
- global `tests/`를 기본값으로 두지 않는다
- cross-flow E2E가 커질 때만 별도 `e2e/`를 검토한다

## Naming

- 폴더는 `kebab-case`
- React 컴포넌트 파일은 `PascalCase.tsx`
- 일반 파일은 `camelCase.ts` 또는 `camelCase.tsx`
- hook 파일은 `useXxx.ts` 또는 `useXxx.tsx`
- test 파일은 `camelCase.test.ts` 또는 `camelCase.test.tsx`
- query core read 함수는 `read*`
- query transport 함수는 `fetch*`
- Next.js 예약 파일은 framework naming을 그대로 따른다
- import 경로는 내부 소스 기준 항상 `#/*` 절대 경로를 사용한다

## Current Rule

- 현재 canonical tree는 [Codebase Architecture](./codebase-architecture.md)를 따른다
- 새 케이스가 애매하면 먼저 기존 규칙에 맞춰 최소 구조로 추가하고, 반복 패턴이 생길 때만 규칙을 확장한다
