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

다음을 고정한다.

- 최상위 레이어 순서
- 레이어별 책임
- import 방향
- `app` 과 `screens` 의 route 대응 규칙
- `_components`, `_hooks`, `_helpers`, `_tests` 같은 private support 폴더 규칙
- 모든 레이어의 `_tests` 배치 규칙

## Canonical Layer Order

```text
app -> screens -> mutations -> queries -> entities -> shared
```

각 레이어의 의미:

- `app`
  - Next.js route entry
  - `page.tsx`, `layout.tsx`, `route.ts`
  - hydration entry
  - provider wiring
- `screens`
  - 화면 조합
  - route-local UI
  - 필요한 client island
- `mutations`
  - write use case
  - server action
  - mutation hook
  - write schema
- `queries`
  - read use case
  - query key
  - query options
  - client fetcher
  - read hook
- `entities`
  - domain core
  - schema
  - mapper
  - policy
  - repository
- `shared`
  - domain-neutral primitive
  - infra
  - generic helper

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

## Import Direction

| From        | Can import                                                        |
| ----------- | ----------------------------------------------------------------- |
| `app`       | `screens`, `mutations`, `queries`, `entities`, `shared`           |
| `screens`   | `mutations`, `queries`, `entities`, `shared`                      |
| `mutations` | same-domain `queries/constants`, same-domain `entities`, `shared` |
| `queries`   | same-domain `entities`, `shared`                                  |
| `entities`  | same-domain `entities`, `shared`                                  |
| `shared`    | package import, same-layer shared module                          |

추가 규칙:

- 내부 import 는 모두 `#/*` 절대 경로를 사용한다.
- `shared` 는 상위 레이어를 import 하지 않는다.
- `entities`, `queries`, `mutations` 는 같은 레이어 안에서 다른 도메인을 import 하지 않는다.
- `queries/options` 는 query key 와 query function 을 묶는 canonical read contract 로 본다.

## app Rule

`app` 은 Next.js route layer 다.

여기에 둘 수 있는 것:

- `page.tsx`
- `layout.tsx`
- `route.ts`
- server read 시작점
- hydration seed
- provider wiring

여기에 두지 않는 것:

- 화면 전용 조합 UI
- form state
- domain rule
- mapper
- repository logic

## screens Rule

`screens` 는 `app` 의 route 구조를 그대로 따라가는 화면 조합 레이어다.

핵심 규칙:

- `screens` 는 `app` route 구조를 따른다.
- route 전용 코드는 그 route screen 아래에 둔다.
- sibling route 가 같이 쓰는 코드는 가장 가까운 부모 screen 아래에 둔다.
- `screens` 는 UI 와 화면 상호작용 조합을 담당하지만, 도메인 규칙 자체는 소유하지 않는다.

예시:

```text
src/app/admin/templates/page.tsx
src/app/admin/templates/new/page.tsx
src/app/admin/templates/[templateId]/edit/page.tsx

src/screens/admin/templates/AdminTemplatesScreen.tsx
src/screens/admin/templates/new/AdminTemplateCreateScreen.tsx
src/screens/admin/templates/[templateId]/edit/AdminTemplateEditScreen.tsx
```

## screens Support Folder Rule

`app` 과 `screens` 의 private support 폴더는 `_` prefix 를 사용한다.

허용:

- `_components`
- `_hooks`
- `_helpers`
- `_tests`

의미:

- `_components`
  - route-local dumb UI
  - client island
- `_hooks`
  - route-local interaction state
  - route-local orchestration
- `_helpers`
  - route-local pure helper
  - route-local formatter
  - route-local form helper
- `_tests`
  - 해당 screen 또는 route support code 테스트

예시:

```text
src/screens/admin/templates/
  AdminTemplatesScreen.tsx
  _components/
    AdminTemplatesClient.tsx
    EventTemplateEditorCard.tsx
    EventTemplateListItem.tsx
    EventTemplatesListPanel.tsx
    TemplateBasicsFields.tsx
    TemplateEditorActions.tsx
    TemplateEditorPageClient.tsx
    TemplateEditorPageSection.tsx
    TemplateField.tsx
    TemplateSlotDefaultRow.tsx
    TemplateSlotDefaultsSection.tsx
  _helpers/
    templateForm.ts
  _hooks/
    useAdminTemplatesScreenState.ts
    useTemplateEditorFormState.ts
  _tests/
    templateForm.test.ts
    useTemplateEditorFormState.test.ts
  new/
    AdminTemplateCreateScreen.tsx
  [templateId]/
    edit/
      AdminTemplateEditScreen.tsx
```

중요:

- `new` 와 `[templateId]/edit` 가 공용으로 쓰는 editor UI 는 부모인 `templates` 아래에 둔다.
- `new` 전용 코드가 생기면 `screens/admin/templates/new/_components` 같은 구조로 내린다.
- `edit` 전용 코드가 생기면 `screens/admin/templates/[templateId]/edit/_components` 같은 구조로 내린다.

## mutations Rule

기본 구조:

```text
src/mutations/events/
  actions/
  hooks/
  schemas/
  _tests/
```

책임:

- `actions/`
  - server action entry
  - write orchestration
- `hooks/`
  - mutation hook
  - cache invalidation
- `schemas/`
  - write input schema
  - parse 함수
- `_tests/`
  - mutation layer 테스트

`mutations` 는 UI component 를 두지 않는다.

## queries Rule

기본 구조:

```text
src/queries/events/
  constants/
  options/
  services/
  hooks/
  _tests/
```

책임:

- `constants/`
  - query key factory
- `options/`
  - `queryOptions(...)`
  - canonical read contract
- `services/`
  - client fetcher
  - read transport
- `hooks/`
  - query hook
  - read-side state
- `_tests/`
  - query layer 테스트

`queries` 도 UI component 를 두지 않는다.

## entities Rule

기본 구조:

```text
src/entities/events/
  models/
    schemas/
    mappers/
    policies/
    normalizeEventTemplateCollection.ts
  repositories/
  _tests/
```

책임:

- `models/schemas`
  - domain schema
- `models/mappers`
  - DB row -> domain model 변환
- `models/policies`
  - domain rule
  - 예: 대표 템플릿 삭제 가능 여부
  - 예: 슬롯 포지션 중복 허용 여부
  - 예: 기본 인원보다 낮출 때 confirm 필요 여부
- `repositories`
  - domain-level data access layer
  - read/write persistence 진입점
- `_tests/`
  - entity layer 테스트

`entities` 는 현재 기준으로 non-UI 레이어다.

## shared Rule

기본 구조:

```text
src/shared/
  components/
  config/
  hooks/
  lib/
  _tests/
```

책임:

- `components/ui`
  - primitive dumb UI
- `components/common`
  - domain-neutral reusable UI
- `config`
  - env parsing
- `lib`
  - infra
  - Supabase client
  - TanStack Query helper
  - generic utility
- `hooks`
  - domain-neutral shared hook
- `_tests/`
  - shared layer 테스트

`shared` 는 특정 도메인 의미를 알면 안 된다.

## Test Placement Rule

현재 프로젝트는 모든 레이어에서 `_tests` 를 사용한다.

예시:

- `src/screens/admin/templates/_tests/templateForm.test.ts`
- `src/screens/admin/positions/_tests/useAdminPositionsScreenState.test.ts`
- `src/mutations/events/_tests/createEventTemplateAction.test.ts`
- `src/queries/events/_tests/getEventTemplateCollectionQueryOptions.test.ts`
- `src/entities/events/_tests/eventTemplatePolicy.test.ts`
- `src/shared/_tests/createQueryKeyFactory.test.ts`

배치 기준:

- 가장 가까운 owner 아래에 colocate 한다.
- route 전용 support code 테스트는 해당 route 또는 부모 screen 의 `_tests` 에 둔다.
- lower layer 도 모두 `_tests` 로 통일한다.

## Naming Rules

- 폴더명: `kebab-case`
- React component: `PascalCase.tsx`
- 일반 함수 파일: `camelCase.ts`
- hook: `useXxx.ts`
- test: `camelCase.test.ts`
- query fetch 함수: `fetch*`
- repository read 함수: `read*`

## Current Practical Rule

실제 구현에서는 아래 순서로 판단한다.

1. 먼저 `app` route 를 본다.
2. 같은 구조를 `screens` 에 만든다.
3. route 전용 UI/상태면 `screens` 아래에 둔다.
4. read use case 면 `queries`
5. write use case 면 `mutations`
6. 도메인 규칙/mapper/schema/repository 면 `entities`
7. 어떤 도메인에도 속하지 않으면 `shared`

## Anti-Patterns

이 문서 기준으로 피해야 하는 것:

- `app` 에 form state 넣기
- `screens` 에 repository 로직 넣기
- `mutations` 에 UI component 넣기
- `queries` 에 UI component 넣기
- `entities` 에 화면 전용 helper 넣기
- `shared` 에 도메인 rule 넣기
- 다른 도메인의 `entities`, `queries`, `mutations` 를 직접 import 하기

## Source Of Truth

세부 구조가 헷갈리면 이 문서를 우선 기준으로 본다.  
화면 트리 예시는 [./codebase-architecture.md](./codebase-architecture.md),  
레이어 의미는 [./fsd-profile.md](./fsd-profile.md) 와 함께 본다.
