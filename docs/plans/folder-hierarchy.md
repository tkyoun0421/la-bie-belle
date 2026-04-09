# Folder Hierarchy

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 `src/` 폴더 계층의 기준 문서다.  
새 파일을 어디에 둘지, 어떤 레이어가 무엇을 소유하는지, 어느 방향으로 import해야 하는지를 여기서 판단한다.

## Canonical Layer Order

현재 canonical order는 아래와 같다.

```text
app -> screens -> mutations -> queries -> entities -> shared
```

이 순서는 책임 순서다.  
`app`이 가장 바깥 엔트리이고, `shared`가 가장 아래 공용 기반이다.

## Mental Model

- `app`
  - 라우팅과 Next.js 엔트리
- `screens`
  - 화면 조합
- `mutations`
  - 변경 흐름
- `queries`
  - 조회 흐름
- `entities`
  - 도메인 코어와 data access
- `shared`
  - 도메인 중립 공용 기반

## Top-Level Tree

```text
src/
  app/
  screens/
  mutations/
  queries/
  entities/
  shared/
```

## Layer Responsibilities

### 1. app

`app`은 Next.js route layer다.

- `page.tsx`, `layout.tsx`, `route.ts`
- route-local hydration setup
- provider wiring
- 화면 진입점 선택

`app`이 하면 안 되는 것:

- 도메인 로직 보유
- form state 관리
- DB row shape 정의
- 화면 조각 컴포넌트 재사용 레이어 역할

대표 예시:

- `src/app/admin/templates/page.tsx`
- `src/app/admin/positions/page.tsx`
- `src/app/_providers/AppProviders.tsx`

### 2. screens

`screens`는 화면 조합 레이어다.  
route 하나 또는 route subtree 하나가 어떤 query, mutation, entity 데이터를 묶어서 보여줄지 결정한다.

- server screen shell
- screen-local dumb UI
- screen-local interaction hook
- 꼭 필요한 client island

`screens`가 하면 안 되는 것:

- DB 직접 접근
- query client 생성
- domain rule 소유
- reusable primitive UI 소유

대표 예시:

- `src/screens/admin/templates/AdminTemplatesScreen.tsx`
- `src/screens/admin/templates/_components/AdminTemplatesClient.tsx`
- `src/screens/admin/templates/_hooks/useAdminTemplatesScreenState.ts`
- `src/screens/admin/positions/AdminPositionsScreen.tsx`

### 3. mutations

`mutations`는 write use case 레이어다.

- server action
- mutation hook
- edit form state
- optimistic update / cache update
- write-side input schema

`mutations`가 하면 안 되는 것:

- UI component 소유
- route 책임 소유
- 다른 도메인의 mutation import

대표 예시:

- `src/mutations/events/actions/createEventTemplate.ts`
- `src/mutations/events/hooks/useCreateEventTemplateMutation.ts`
- `src/screens/admin/positions/_hooks/useAdminPositionsScreenState.ts`

### 4. queries

`queries`는 read use case 레이어다.

- query key
- query options
- client fetcher
- React Query hook
- read-side collection state

`queries`가 하면 안 되는 것:

- UI component 소유
- write action 소유
- DB schema/core model 소유

대표 예시:

- `src/queries/events/constants/eventTemplateQueryKeys.ts`
- `src/queries/events/options/getEventTemplateCollectionQueryOptions.ts`
- `src/queries/events/services/fetchEventTemplates.ts`
- `src/queries/events/hooks/useEventTemplatesQuery.ts`

### 5. entities

`entities`는 도메인 코어 레이어다.  
현재 기준으로 `entities`는 non-UI layer다.

- schema
- mapper
- repository
- constant
- formatter
- policy
- entity-level tests

`entities/repositories`는 도메인별 data access layer다.

- Supabase/Postgres 호출
- row -> entity mapping
- read/write repository function
- DB 상세를 상위 레이어에서 숨기는 역할

`entities`가 하면 안 되는 것:

- React component 소유
- route 조합
- mutation cache update
- query hook 소유

대표 예시:

- `src/entities/events/models/schemas/eventTemplate.ts`
- `src/entities/events/repositories/eventTemplateRepository.ts`
- `src/entities/positions/models/constants/allowedGender.ts`

### 6. shared

`shared`는 어느 도메인에도 속하지 않는 공용 기반이다.

- primitive UI
- infra client
- env/config
- generic util
- framework-agnostic helper

`shared`가 하면 안 되는 것:

- events, positions 같은 도메인 의미를 아는 코드
- 상위 레이어 import

대표 예시:

- `src/shared/lib/supabase/admin.ts`
- `src/shared/lib/tanstack-query/createQueryClient.ts`
- `src/shared/components/ScreenPlaceholder.tsx`

## Import Direction

실무 기준 allowed import는 아래처럼 본다.

| From        | Can import                                              |
| ----------- | ------------------------------------------------------- |
| `app`       | `screens`, `mutations`, `queries`, `entities`, `shared` |
| `screens`   | `mutations`, `queries`, `entities`, `shared`            |
| `mutations` | `entities`, `shared`, same-domain `queries/constants`   |
| `queries`   | `entities`, `shared`                                    |
| `entities`  | `shared`                                                |
| `shared`    | package import only, same-layer shared modules          |

- `queries/options` binds a query key and fetcher into one canonical read contract.

추가 규칙:

- `app`과 `screens`만 여러 도메인을 조합할 수 있다.
- `mutations`, `queries`, `entities`는 같은 레이어 안에서 다른 도메인을 import하지 않는다.
- `mutations`가 `queries`를 보는 것은 현재 기준으로 same-domain `queries/constants`까지만 허용한다.
- repository 재사용은 `queries`가 아니라 `entities`를 통해 해결한다.

## Folder Shape By Layer

### app

```text
src/app/
  layout.tsx
  page.tsx
  _providers/
  admin/
    page.tsx
    templates/page.tsx
    positions/page.tsx
```

### screens

```text
src/screens/admin/templates/
  AdminTemplatesScreen.tsx
  _components/
    AdminTemplatesClient.tsx
    EventTemplateEditorCard.tsx
    EventTemplatesListPanel.tsx
  _hooks/
    useAdminTemplatesScreenState.ts
  _tests/
```

규칙:

- `screens`의 private support folder는 `_` prefix를 쓴다.
- `_components`는 screen-local UI와 client island용이다.
- `screens`에는 `_hooks`를 기본 구조로 두지 않는다.
- 화면 조합 state는 먼저 `mutations` 또는 `queries` owner로 내려보내고, 정말 필요한 경우에만 client component 내부로 국소화한다.

### mutations

```text
src/mutations/events/
  actions/
    createEventTemplate.ts
    updateEventTemplate.ts
    deleteEventTemplate.ts
  hooks/
    useCreateEventTemplateMutation.ts
    useCreateEventTemplateMutation.ts
  schemas/
    createEventTemplate.ts
  tests/
```

규칙:

- `mutations`에는 `components/`를 두지 않는다.
- `schemas`에는 write-side input schema를 둔다.
- server action entry는 `actions/`에 둔다.

### queries

```text
src/queries/events/
  constants/
    eventTemplateQueryKeys.ts
  options/
    getEventTemplateCollectionQueryOptions.ts
  hooks/
    useEventTemplatesQuery.ts
    useEventTemplateCollectionState.ts
  services/
    fetchEventTemplates.ts
  tests/
```

규칙:

- `queries`에는 `components/`를 두지 않는다.
- `services`는 query transport와 read orchestration이다.
- `constants`는 query key factory 같은 read-side constant를 둔다.

### entities

```text
src/entities/events/
  models/
    schemas/
      eventTemplate.ts
    mappers/
      mapEventTemplateRow.ts
  repositories/
    eventTemplateRepository.ts
  tests/
```

규칙:

- `entities`는 non-UI만 둔다.
- `repositories`가 domain-level DAL이다.
- `models`는 pure domain shape만 둔다.

### shared

```text
src/shared/
  components/
  config/
  lib/
  api/
  hooks/
  models/
  tests/
  types/
  utils/
```

규칙:

- `shared/components`는 primitive dumb UI 위주로 유지한다.
- `shared/lib`는 infra adapter를 둔다.
- `shared/hooks`는 truly shared한 것만 둔다.

## Placement Rules

아래 질문으로 위치를 결정한다.

### 이 파일이 route entry인가?

- 맞다 -> `app`

### 이 파일이 화면 조합인가?

- 맞다 -> `screens`

### 이 파일이 write use case인가?

- 맞다 -> `mutations`

### 이 파일이 read use case인가?

- 맞다 -> `queries`

### 이 파일이 domain core인가?

- 맞다 -> `entities`

### 이 파일이 domain-neutral primitive 또는 infra인가?

- 맞다 -> `shared`

## UI Placement Rules

### `shared/components`로 가는 것

- Button
- Input
- Card
- Select
- Dialog shell
- layout-agnostic primitive

### `screens/*/_components`로 가는 것

- admin templates 화면에서만 쓰는 editor card
- admin positions 화면에서만 쓰는 list panel
- route-specific section header
- client island

### `entities`에 넣지 않는 것

- React component
- screen-specific badge
- route wording에 묶인 UI

현재 기준으로 `entities`는 non-UI를 유지한다.

## State Placement Rules

- server state source of truth는 server render + TanStack Query다.
- query-side state는 `queries/*/hooks`
- mutation-side edit state는 `mutations/*/hooks`
- route-only temporary state는 `screens/*/_components/*Client.tsx`
- `app`은 state owner가 아니다.

## Naming Rules

- 폴더명: `kebab-case`
- React component: `PascalCase.tsx`
- 일반 함수 파일: `camelCase.ts`
- hook: `useXxx.ts`
- test: `camelCase.test.ts`
- repository read 함수: `read*`
- query fetch 함수: `fetch*`

## Private Folder Rule

- `app`, `screens`의 support folder는 `_` prefix를 사용한다.
- 예: `_providers`, `_components`, `_tests`
- `mutations`, `queries`, `entities`, `shared`는 `_` prefix 대신 명시적인 일반 폴더명을 사용한다.

## Example End-To-End Placement

`/admin/templates`를 예로 들면:

- route entry: `src/app/admin/templates/page.tsx`
- screen shell: `src/screens/admin/templates/AdminTemplatesScreen.tsx`
- client island: `src/screens/admin/templates/_components/AdminTemplatesClient.tsx`
- query hook: `src/queries/events/hooks/useEventTemplatesQuery.ts`
- mutation action: `src/mutations/events/actions/createEventTemplate.ts`
- entity repository: `src/entities/events/repositories/eventTemplateRepository.ts`
- shared infra: `src/shared/lib/supabase/admin.ts`

## Current Rule

- 폴더 위치가 애매하면 이 문서를 먼저 본다.
- route tree와 실제 현재 파일 배치는 [Codebase Architecture](./codebase-architecture.md)를 본다.
- naming/import rule의 짧은 요약은 [FSD Profile](./fsd-profile.md)를 본다.
