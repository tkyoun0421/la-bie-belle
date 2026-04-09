# Codebase Architecture

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 현재 repository의 canonical tree와 route-to-screen 매핑을 기록한다.  
레이어 책임 자체는 [Folder Hierarchy](./folder-hierarchy.md)를 source of truth로 본다.

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
- `/admin/payroll-rules` -> `screens/admin/payroll-rules`

## Canonical Module Shapes

### Screens

```text
src/screens/admin/templates/
  AdminTemplatesScreen.tsx
  _components/
    AdminTemplatesClient.tsx
    EventTemplateEditorCard.tsx
    EventTemplatesListPanel.tsx
```

### Mutations

```text
src/mutations/events/
  actions/
  hooks/
  schemas/
  tests/
```

### Queries

```text
src/queries/events/
  constants/
  options/
  hooks/
  services/
  tests/
```

### Entities

```text
src/entities/events/
  models/
  repositories/
  tests/
```

### Shared

```text
src/shared/
  components/
  config/
  lib/
  tests/
```

## Rendering And Data Flow

현재 기본 데이터 흐름은 아래와 같다.

1. `app/*/page.tsx`가 server component로 시작한다.
2. route entry가 `entities/*/repositories/*`로 server read를 수행한다.
3. route entry가 query cache를 hydrate한다.
4. route entry가 `screens/*` screen shell을 렌더한다.
5. `screens/*/_components/*Client.tsx`가 필요한 범위만 client island로 동작한다.
6. client island가 `queries/*/hooks`와 `mutations/*/hooks`를 사용한다.
7. write는 `mutations/*/actions/*.ts`로 들어가고, read/write data access는 `entities/*/repositories/*`에서 끝난다.

## Current Domain Snapshot

현재 구조상 먼저 정리된 도메인은 아래와 같다.

- `events`
  - templates CRUD
- `positions`
  - positions CRUD
- `users`
  - profile read legacy leaf
- `auth`
  - logout legacy leaf

## Legacy Notes

아직 완전히 정리되지 않은 legacy 경로가 있다.

- `src/queries/users/get-my-profile/*`
- `src/mutations/auth/logout/*`

이 두 경로는 현재 canonical naming과 다르게 남아 있는 과도기 구조다.  
새 구현은 이 패턴을 따라 늘리지 않는다.

## Current Rule

- 새 폴더를 만들기 전에는 먼저 [Folder Hierarchy](./folder-hierarchy.md)를 본다.
- 현재 repo의 실제 route 배치와 screen 매핑은 이 문서를 기준으로 본다.
