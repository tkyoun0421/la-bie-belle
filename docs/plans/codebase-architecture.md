# Codebase Architecture

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 현재 repository 의 canonical tree 와 route-to-screen 대응을 기록한다.

목표:

- 현재 `src/` 구조를 한눈에 보여주기
- route 와 screen 의 대응을 고정하기
- 템플릿/포지션 화면처럼 이미 구조가 잡힌 영역의 실제 배치를 기록하기

## Top-Level Layout

```text
src/
  app/
  screens/
  mutations/
  queries/
  entities/
  shared/

supabase/
  migrations/
  seed.sql

public/
```

## Current Route Tree

```text
src/app/
  layout.tsx
  page.tsx
  _providers/

  admin/
    layout.tsx
    page.tsx
    payroll-rules/page.tsx
    positions/page.tsx
    requests/page.tsx
    templates/page.tsx
    templates/new/page.tsx
    templates/[templateId]/create-event/page.tsx
    templates/[templateId]/edit/page.tsx
    users/page.tsx

  events/[eventId]/page.tsx
  replacements/page.tsx
  check-in/page.tsx
  pay/page.tsx

  auth/
    callback/route.ts

  api/
    event-templates/route.ts
    health/route.ts
    positions/route.ts
    push/subscribe/route.ts
    push/unsubscribe/route.ts
```

## Route To Screen Mapping

- `/` -> `screens/dashboard`
- `/events/[eventId]` -> `screens/events/detail`
- `/replacements` -> `screens/replacements`
- `/check-in` -> `screens/check-in`
- `/pay` -> `screens/pay`
- `/admin` -> `screens/admin/dashboard`
- `/admin/requests` -> `screens/admin/requests`
- `/admin/users` -> `screens/admin/users`
- `/admin/positions` -> `screens/admin/positions`
- `/admin/templates` -> `screens/admin/templates`
- `/admin/templates/new` -> `screens/admin/templates/new`
- `/admin/templates/[templateId]/create-event` -> `screens/admin/templates/[templateId]/create-event`
- `/admin/templates/[templateId]/edit` -> `screens/admin/templates/[templateId]/edit`
- `/admin/payroll-rules` -> `screens/admin/payroll-rules`

## Current Template Screen Shape

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
    create-event/
      AdminTemplateEventCreateScreen.tsx
    edit/
      AdminTemplateEditScreen.tsx
```

정리 기준:

- 목록 전용 코드는 `templates` 루트 아래에 둔다.
- `new` 와 `edit` 가 공용으로 쓰는 editor 관련 support code 도 `templates` 루트 아래에 둔다.
- `new` 전용 또는 `edit` 전용 코드가 생기면 각 route 폴더 아래로 내린다.
- 템플릿 관련 테스트는 현재 owner 루트인 `templates/_tests` 에 둔다.

## Current Position Screen Shape

```text
src/screens/admin/positions/
  AdminPositionsScreen.tsx
  _components/
    AdminPositionsClient.tsx
    PositionEditorDialog.tsx
    PositionEditorCard.tsx
    PositionsListPanel.tsx
  _hooks/
    useAdminPositionsScreenState.ts
    usePositionEditorDialogState.ts
  _tests/
    AdminPositionsClient.test.tsx
    useAdminPositionsScreenState.test.ts
    usePositionEditorDialogState.test.ts
```

정리 기준:

- 목록과 검색 orchestration 은 `useAdminPositionsScreenState.ts` 에 둔다.
- editor dialog shell 은 `PositionEditorDialog.tsx` 로 분리한다.
- `react-hook-form`, `useWatch`, validation, submit error 는 `usePositionEditorDialogState.ts` 로 내린다.
- 이 구조의 목적은 dialog 입력 중 `PositionsListPanel` 이 함께 리렌더링되지 않게 만드는 것이다.

## Current Event Entity Shape

```text
src/entities/events/
  models/
    errors/
      eventError.ts
    mappers/
      mapEventRow.ts
      mapEventTemplateRow.ts
    policies/
      eventTemplatePolicy.ts
    schemas/
      event.ts
      eventTemplate.ts
    normalizeEventTemplateCollection.ts
  repositories/
    readEventRepository.ts
    readEventTemplateRepository.ts
    writeEventRepository.ts
    writeEventTemplateRepository.ts
  _tests/
    eventTemplatePolicy.test.ts
    readEventRepository.test.ts
    mapEventTemplateRow.test.ts
    normalizeEventTemplateCollection.test.ts
    writeEventTemplateRepository.test.ts
```

핵심:

- 이벤트 도메인 규칙은 `models/policies` 로 간다.
- recoverable domain error codes are defined in `models/errors`.
- read/write persistence 진입점은 `repositories` 가 맡는다.
- `mutations/actions` 는 raw Supabase 호출 대신 repository orchestration 만 맡는다.
- 화면 전용 규칙은 `screens` 로 가고, 도메인 규칙은 `entities` 로 간다.

## Rendering And Data Flow

1. `app/*/page.tsx` 가 server component 로 시작한다.
2. route entry 가 `entities/*/repositories/*` 로 server read 를 수행한다.
3. route entry 가 query cache 를 hydrate 한다.
4. route entry 가 `screens/*` screen shell 을 렌더한다.
5. 필요한 부분만 `screens/*/_components/*Client.tsx` 에서 client island 로 동작한다.
6. client island 는 `queries/*/hooks` 와 `mutations/*/hooks` 를 사용한다.
7. domain rule 은 `entities/*/models/policies/*` 에서 관리한다.
8. read/write data access 는 `entities/*/repositories/*` 에서 관리한다.

## Client State Ownership Rule

- screen root client component 는 list/search/open/close 같은 orchestration state 만 가진다.
- 입력 중 자주 변하는 form state 는 leaf dialog 또는 leaf page section 아래로 내린다.
- `react-hook-form` 과 `useWatch` 는 가능한 가장 좁은 owner 에 둔다.
- sibling panel 이 있는 화면에서 root client component 가 form state 를 가지면 리렌더 범위가 넓어지므로 금지한다.
- 새 create/edit 세션 시작은 `requestKey` 같은 session key 로 분리하고, leaf subtree remount 로 초기화한다.

## Current Rule

- `screens` 는 `app` 구조를 그대로 따라간다.
- 공용 support code 는 가장 가까운 부모 screen 아래에 둔다.
- 테스트는 모든 레이어에서 `_tests` 로 통일한다.
