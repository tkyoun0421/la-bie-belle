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
파일을 어디에 둘지, 어떤 방향으로 import 할지, route 구조와 `screens` 구조를 어떻게 맞출지 여기서 고정한다.

## Canonical Layer Order

```text
app -> screens -> mutations -> queries -> entities -> shared
```

- `app`
  - Next.js route entry, layout, provider, hydration entry
- `screens`
  - 화면 조합
- `mutations`
  - write use case
- `queries`
  - read use case
- `entities`
  - domain core + repository
- `shared`
  - domain-neutral primitive, infra, helper

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

| From | Can import |
| --- | --- |
| `app` | `screens`, `mutations`, `queries`, `entities`, `shared` |
| `screens` | `mutations`, `queries`, `entities`, `shared` |
| `mutations` | `entities`, `shared`, same-domain `queries/constants` |
| `queries` | `entities`, `shared` |
| `entities` | `shared` |
| `shared` | package import, same-layer shared module |

추가 규칙:

- 내부 import 는 모두 `#/*` 절대 경로를 사용한다.
- `app` 과 `screens` 만 여러 도메인을 조합할 수 있다.
- `mutations`, `queries`, `entities` 는 같은 레이어 안에서 다른 도메인을 import 하지 않는다.
- `queries/options` 는 query key 와 query function 을 묶는 canonical read contract 이다.

## app And screens

### app

`app` 은 Next.js route layer 다.

- `page.tsx`, `layout.tsx`, `route.ts`
- hydration entry
- provider wiring
- route entry 에서의 server read 시작점

`app` 에 두지 않는 것:

- 화면 전용 UI 조합
- form state
- domain rule
- row mapper

### screens

`screens` 는 route 를 화면으로 조합하는 레이어다.

- server screen shell
- screen-local UI
- 필요한 client island
- route-local `_hooks`, `_helpers`, `_tests`

중요 규칙:

- `screens` 는 `app` 구조를 따른다.
- route 전용 파일은 해당 route 폴더 아래에 둔다.
- 두 sibling route 가 같이 쓰는 파일만 가장 가까운 부모 폴더에 둔다.

예시:

```text
src/app/admin/templates/page.tsx
src/app/admin/templates/new/page.tsx
src/app/admin/templates/[templateId]/edit/page.tsx

src/screens/admin/templates/AdminTemplatesScreen.tsx
src/screens/admin/templates/new/AdminTemplateCreateScreen.tsx
src/screens/admin/templates/[templateId]/edit/AdminTemplateEditScreen.tsx
```

공용 editor UI 는 `new` 와 `[templateId]/edit` 가 같이 쓰므로 부모인 `templates` 아래에 둔다.

```text
src/screens/admin/templates/
  _components/
    TemplateEditorPageClient.tsx
    TemplateEditorPageSection.tsx
    EventTemplateEditorCard.tsx
  _helpers/
    templateForm.ts
  _hooks/
    useTemplateEditorFormState.ts
  _tests/
    templateForm.test.ts
    useTemplateEditorFormState.test.ts
```

반대로 `new` 전용 또는 `edit` 전용 코드가 생기면 각각 아래로 내린다.

```text
src/screens/admin/templates/new/_components/
src/screens/admin/templates/new/_hooks/

src/screens/admin/templates/[templateId]/edit/_components/
src/screens/admin/templates/[templateId]/edit/_hooks/
```

## Lower Layers

### mutations

```text
src/mutations/events/
  actions/
  hooks/
  schemas/
  _tests/
```

- server action
- mutation hook
- write-side schema

### queries

```text
src/queries/events/
  constants/
  options/
  hooks/
  services/
  _tests/
```

- query key
- query options
- client fetcher
- read-side hook

### entities

```text
src/entities/events/
  models/
  repositories/
  _tests/
```

- schema
- mapper
- repository
- formatter
- policy

`entities/repositories` 는 domain-level data access layer 로 본다.

### shared

```text
src/shared/
  components/
  config/
  lib/
  hooks/
  types/
  _tests/
```

- primitive UI
- infra client
- generic helper
- domain-neutral shared hook

## Test Placement

새 테스트는 owner 옆 `_tests` 에 둔다.

- `screens/admin/templates/_tests/templateForm.test.ts`
- `screens/admin/templates/_tests/useTemplateEditorFormState.test.ts`
- `screens/admin/positions/_tests/useAdminPositionsScreenState.test.ts`

규칙:

- 테스트는 가장 가까운 owner 폴더 밑 `_tests` 에 colocate 한다.
- route 전용 코드는 그 route 폴더 아래 `_tests` 로 간다.
- 공용 screen support 코드는 부모 screen 폴더 루트의 `_tests` 로 간다.
- 기존 `tests/` 폴더는 touched scope 에서만 점진적으로 `_tests` 로 옮긴다.

## Naming Rules

- 폴더명: `kebab-case`
- React component: `PascalCase.tsx`
- 일반 함수 파일: `camelCase.ts`
- hook: `useXxx.ts`
- test: `camelCase.test.ts`
- query fetch 함수: `fetch*`
- repository read 함수: `read*`

## Current Rule

- route 를 먼저 보고 `app` 위치를 정한다.
- 같은 route 구조를 `screens` 에서 그대로 따라간다.
- route 사이에서 공통이면 부모 폴더에 두고, 공통이 아니면 각 route 폴더 아래로 내린다.
- 테스트는 새로 추가하는 코드부터 `_tests` 규칙을 따른다.
