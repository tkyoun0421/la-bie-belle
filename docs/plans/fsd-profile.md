# FSD Profile

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 현재 프로젝트의 실제 FSD 운용 규칙을 짧게 고정한다.  
상세한 폴더 배치는 [Folder Hierarchy](./folder-hierarchy.md)를 source of truth 로 본다.

## Layer Order

```text
app -> screens -> mutations -> queries -> entities -> shared
```

- `app`
  - route, layout, provider, hydration entry
- `screens`
  - 화면 조합
- `mutations`
  - write use case
- `queries`
  - read use case
- `entities`
  - domain core, repository
- `shared`
  - primitive UI, infra, generic helper

## Core Rules

- 내부 import 는 `#/*` 절대 경로만 사용한다.
- `app` 과 `screens` 만 여러 도메인을 조합한다.
- `mutations`, `queries`, `entities` 는 같은 레이어 안에서 다른 도메인을 import 하지 않는다.
- `shared` 는 상위 레이어를 import 하지 않는다.

## screens Rule

- `screens` 는 `app` 의 route 구조를 따른다.
- route 전용 코드는 해당 route 폴더 아래에 둔다.
- sibling route 가 공유하는 코드만 가장 가까운 부모 screen 폴더에 둔다.
- 예:
  - `app/admin/templates/new/page.tsx`
  - `screens/admin/templates/new/AdminTemplateCreateScreen.tsx`
  - `app/admin/templates/[templateId]/edit/page.tsx`
  - `screens/admin/templates/[templateId]/edit/AdminTemplateEditScreen.tsx`

## Support Folder Rule

- `app` 과 `screens` 는 private support folder 에 `_` prefix 를 쓴다.
  - `_components`
  - `_hooks`
  - `_helpers`
  - `_tests`
- `mutations`, `queries`, `entities`, `shared` 도 새 테스트는 `_tests` 에 colocate 한다.

## UI Rule

- `shared/components/ui`
  - primitive dumb UI
- `screens/*/_components`
  - route-local dumb UI
  - client island
- `mutations`, `queries`
  - UI component 를 두지 않는다
- `entities`
  - 현재 기준 non-UI 유지

## State Rule

- server state 는 server render + TanStack Query hydration 을 기본으로 둔다.
- read-side state 는 `queries/*/hooks`
- write execution 은 `mutations/*/hooks`
- route-local interaction state 는 `screens/*/_hooks` 또는 leaf client component

## Test Rule

- 새 테스트는 owner 레이어 폴더 루트 바로 아래 `_tests` 에 둔다.
- legacy `tests/` 는 touched scope 에서만 점진적으로 옮긴다.

## Current Rule

- route 를 먼저 보고 `app` 과 `screens` 위치를 정한다.
- 공용이면 부모 폴더, 전용이면 해당 route 폴더 아래로 둔다.
- 새 테스트는 `_tests` 규칙을 따른다.
