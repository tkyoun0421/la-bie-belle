# FSD Profile

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Purpose

이 문서는 현재 프로젝트의 실제 FSD 운영 규칙을 고정한다.

세부 폴더 배치는 [Folder Hierarchy](./folder-hierarchy.md)를 source of truth 로 보고,
이 문서는 레이어 의미와 운영 규칙에 집중한다.

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
  - domain core, policy, repository
- `shared`
  - primitive UI, infra, generic helper

## Core Rules

- 내부 import 는 `#/*` 절대 경로만 사용한다.
- `app` 과 `screens` 만 여러 도메인을 조합한다.
- `mutations`, `queries`, `entities` 는 같은 레이어 안에서 다른 도메인을 import 하지 않는다.
- `shared` 는 상위 레이어를 import 하지 않는다.

## screens Rule

- `screens` 는 `app` 의 route 구조를 따른다.
- route 전용 코드는 해당 route screen 아래에 둔다.
- sibling route 가 공용으로 쓰는 코드는 가장 가까운 부모 screen 아래에 둔다.
- `screens` 는 화면 조합과 상호작용 orchestration 을 담당한다.
- 도메인 정책 자체는 `entities` 로 보낸다.
- `mutations/actions` 는 repository call orchestration 을 맡고 raw persistence 코드는 두지 않는다.
- `entities/repositories` 가 커지면 `read*Repository.ts` 와 `write*Repository.ts` 로 분리한다.

예시:

- `app/admin/templates/new/page.tsx`
- `screens/admin/templates/new/AdminTemplateCreateScreen.tsx`
- `app/admin/templates/[templateId]/edit/page.tsx`
- `screens/admin/templates/[templateId]/edit/AdminTemplateEditScreen.tsx`

## Support Folder Rule

`app` 과 `screens` 의 private support folder 는 `_` prefix 를 사용한다.

- `_components`
- `_hooks`
- `_helpers`
- `_tests`

lower layer 도 테스트 폴더는 `_tests` 로 통일한다.

즉 현재 기준:

- `screens/*/_tests`
- `mutations/*/_tests`
- `queries/*/_tests`
- `entities/*/_tests`
- `shared/_tests`

## UI Rule

- `shared/components/ui`
  - primitive dumb UI
- `shared/components/common`
  - domain-neutral reusable UI
- `screens/*/_components`
  - route-local dumb UI
  - client island
- `mutations`, `queries`
  - UI component 를 두지 않는다
- `entities`
  - 현재 기준 non-UI 레이어다

## State Rule

- server state 는 server render + TanStack Query hydration 을 기본으로 둔다.
- read-side state 는 `queries/*/hooks`
- write execution 은 `mutations/*/hooks`
- route-local interaction state 는 `screens/*/_hooks` 또는 leaf client component

## Domain Rule Rule

도메인 규칙은 `entities/*/models/policies` 로 간다.

예:

- 대표 템플릿 삭제 가능 여부
- 대표 템플릿 토글 잠금 여부
- 슬롯 포지션 중복 허용 여부
- 기본 인원보다 낮출 때 confirm 필요 여부

즉 화면 helper 나 mutation action 에 흩어진 규칙을 `entities` 로 올리는 방향이 현재 기준이다.

## Test Rule

- 새 테스트는 모든 레이어에서 `_tests` 규칙을 따른다.
- 테스트는 가장 가까운 owner 폴더 아래에 colocate 한다.
- legacy `tests/` 는 더 이상 유지하지 않는다.

예:

- `src/screens/admin/templates/_tests/useTemplateEditorFormState.test.ts`
- `src/mutations/events/_tests/createEventTemplateAction.test.ts`
- `src/queries/events/_tests/getEventTemplateCollectionQueryOptions.test.ts`
- `src/entities/events/_tests/eventTemplatePolicy.test.ts`
- `src/shared/_tests/createQueryKeyFactory.test.ts`

## Current Rule

- route 를 먼저 보고 `app` 과 `screens` 위치를 정한다.
- 공용이면 부모 폴더, 전용이면 해당 route 폴더 아래로 둔다.
- 도메인 규칙은 `entities`
- read 흐름은 `queries`
- write 흐름은 `mutations`
- 테스트는 `_tests`
