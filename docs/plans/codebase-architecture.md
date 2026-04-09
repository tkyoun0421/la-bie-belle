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
- `/admin/templates/[templateId]/edit` -> `screens/admin/templates/[templateId]/edit`
- `/admin/payroll-rules` -> `screens/admin/payroll-rules`

## Current Template Screen Shape

```text
src/screens/admin/templates/
  AdminTemplatesScreen.tsx
  _components/
    AdminTemplatesClient.tsx
    EventTemplateListItem.tsx
    EventTemplatesListPanel.tsx
    TemplateEditorPageClient.tsx
    TemplateEditorPageSection.tsx
    EventTemplateEditorCard.tsx
    TemplateBasicsFields.tsx
    TemplateEditorActions.tsx
    TemplateField.tsx
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

정리 기준:

- 목록 전용 코드는 `templates` 루트에 둔다.
- `new` 와 `[templateId]/edit` 가 공유하는 editor 코드는 부모 `templates` 폴더에 둔다.
- `new` 전용 또는 `edit` 전용 코드가 생기면 각 route 폴더 아래 `_components/_hooks/_helpers` 로 내리고, 테스트는 해당 route 폴더 루트의 `_tests` 로 둔다.

## Current Position Screen Shape

```text
src/screens/admin/positions/
  AdminPositionsScreen.tsx
  _components/
    AdminPositionsClient.tsx
    PositionEditorCard.tsx
    PositionsListPanel.tsx
  _hooks/
    useAdminPositionsScreenState.ts
  _tests/
    useAdminPositionsScreenState.test.ts
```

## Rendering And Data Flow

1. `app/*/page.tsx` 가 server component 로 시작한다.
2. route entry 가 `entities/*/repositories/*` 로 server read 를 수행한다.
3. route entry 가 query cache 를 hydrate 한다.
4. route entry 가 `screens/*` screen shell 을 렌더한다.
5. 필요한 부분만 `screens/*/_components/*Client.tsx` 에서 client island 로 동작한다.
6. client island 는 `queries/*/hooks` 와 `mutations/*/hooks` 를 사용한다.
7. read/write data access 는 `entities/*/repositories/*` 에서 끝난다.

## Current Rule

- `screens` 는 `app` 구조를 따라간다.
- 공용 코드만 부모 screen 폴더에 둔다.
- 새 테스트는 owner 폴더 아래 `_tests` 로 colocate 한다.
