# Phase 0.5 Plan: Core Operational Loop

Build Plan: [../build-plan.md](../build-plan.md)  
Architecture: [../architecture-spec.md](../architecture-spec.md)  
Screens: [../screen-spec.md](../screen-spec.md)  
Stack: [../stack-spec.md](../stack-spec.md)  
Codebase: [../codebase-architecture.md](../codebase-architecture.md)  
Folder Hierarchy: [../folder-hierarchy.md](../folder-hierarchy.md)  
Execution: [../execution-plan.md](../execution-plan.md)  
Status: REVIEW_REQUIRED  
Date: 2026-04-10

## Goal

첫 번째 실제 운영 루프를 닫는다.

이 phase가 끝나면 아래 happy path가 이어져야 한다.

- 관리자가 행사 템플릿을 만든다.
- 관리자가 템플릿 기반으로 행사를 생성한다.
- 멤버가 행사에 신청한다.
- 관리자가 멤버를 배정한다.
- 배정된 멤버가 취소를 요청한다.
- 다른 멤버가 대타에 지원한다.
- 관리자가 대타를 승인한다.

체크인과 예상 급여는 이 루프 직후 다음 slice 또는 다음 phase에서 바로 붙일 수 있어야 한다.

## In Scope

- 행사 템플릿 CRUD
- 행사 생성과 조회
- 행사 신청과 취소
- 멤버 배정
- 취소 요청과 replacement request 생성
- 대타 지원과 승인
- 최소 happy path 테스트

## Out Of Scope

- Google Auth
- 가입 승인 기반 권한 게이트 완성
- 실제 푸시 발송
- 체크인 예외 승인 UI 완성
- 급여 override UI 완성
- 저빈도 admin 관리 화면 확장

## Stack Assumptions

- UI primitive: `shadcn/ui`
- server state: `TanStack Query`
- client local state: React built-ins + domain hooks
- validation: `Zod`
- writes: Next.js `server actions`
- read transport: `queries/*`
- data access: `entities/*/repositories`

## Route And Screen Impact

### Routes

- `/`
- `/events/[eventId]`
- `/replacements`
- `/admin/templates`
- `/admin/positions`

### Screens

- `screens/dashboard`
- `screens/events/detail`
- `screens/replacements`
- `screens/admin/templates`
- `screens/admin/positions`

## Domain Touch Points

### Entities

- `entities/events/models/*`
- `entities/events/repositories/*`
- `entities/positions/models/*`
- `entities/positions/repositories/*`

### Queries

- `queries/events/constants/*`
- `queries/events/services/*`
- `queries/events/hooks/*`
- `queries/positions/constants/*`
- `queries/positions/services/*`
- `queries/positions/hooks/*`
- `queries/applications/*`
- `queries/assignments/*`
- `queries/replacements/*`

### Mutations

- `mutations/events/actions/*`
- `mutations/events/hooks/*`
- `mutations/applications/actions/*`
- `mutations/assignments/actions/*`
- `mutations/replacements/actions/*`

### Schema And Rules

- `positions`
- `member_positions`
- `event_templates`
- `event_template_position_slots`
- `events`
- `event_position_slots`
- `applications`
- `assignments`
- `replacement_requests`
- `replacement_applications`
- overlap warning rule
- replacement candidate filter rule

## Slice Breakdown

### Slice 1. Event Template Foundation

목표:

- 템플릿 생성과 조회 happy path를 닫는다.

포함:

- template schema
- template create/update/delete mutation
- template collection query
- admin 템플릿 화면
- unit + integration test

완료 기준:

- 사용자가 템플릿을 만들고 바로 목록에서 볼 수 있다.

### Slice 2. Manager Create Event

목표:

- 템플릿 기반으로 행사를 만들 수 있다.

포함:

- event create mutation
- event list/detail query
- slot 기본값 복사
- `/events/[eventId]` 기본 detail 화면
- unit + integration test

완료 기준:

- 템플릿을 골라 행사 생성 후 상세 화면으로 이동할 수 있다.

### Slice 3. Member Apply To Event

목표:

- 멤버가 행사 목록을 보고 신청/취소할 수 있다.

포함:

- event list query hook
- apply mutation
- cancel application mutation
- dashboard와 event detail에 신청 상태 표시
- unit + integration + smoke UI test

완료 기준:

- 멤버가 신청/취소를 반복할 수 있고 상태가 화면에 즉시 반영된다.

### Slice 4. Manager Assign Member

목표:

- 관리자가 신청자 중 한 명을 포지션에 배정한다.

포함:

- assignment create mutation
- assignment list query
- overlap warning rule
- 배정 UI
- unit + integration test

완료 기준:

- 배정 후 event detail에서 assignment가 보이고 중복 배정은 경고된다.

### Slice 5. Cancellation To Replacement Request

목표:

- 배정 취소가 replacement request로 이어진다.

포함:

- cancel assignment mutation
- replacement request create logic
- replacements list query
- `/replacements` 기본 목록
- integration test

완료 기준:

- 취소 요청 후 replacement request가 열리고 목록에 나타난다.

### Slice 6. Candidate Apply And Manager Approve

목표:

- 다른 멤버가 대타 지원하고 관리자가 승인한다.

포함:

- candidate filter query
- apply-to-replacement mutation
- approve-replacement mutation
- 새 assignment 생성
- request close 처리
- transaction + integration test

완료 기준:

- 대타 승인 후 새 assignment가 생기고 replacement request가 닫힌다.

## TanStack Query And Local Client State

### TanStack Query

- list/detail read hook은 `queries/*/hooks`에서 제공한다.
- dashboard, event detail, replacements 화면은 TanStack Query로 읽는다.
- mutation 성공 후 관련 query invalidation 또는 cache update를 적용한다.
- polling이 필요한 replacement 목록은 refetch interval로 관리한다.

### Local Client State

- form state
- list search term
- 현재 편집 중인 항목 id
- 저장 직후 highlight 같은 일시 UI state

규칙:

- 서버 데이터 캐시는 local state로 복제하지 않는다.
- domain truth는 query cache 또는 server render 결과만 사용한다.
- local state owner는 가능한 해당 도메인의 `queries/*/hooks` 또는 `mutations/*/hooks`다.
- `screens/_hooks`는 기본 구조가 아니다.

## Test Plan

### Unit

- 템플릿 슬롯 복사
- overlap warning
- replacement candidate filter
- assignment 상태 전이

### Integration

- template create -> event create
- apply -> assign
- cancel assignment -> replacement request create
- replacement apply -> approve -> new assignment create

### E2E

- manager creates event
- member applies
- manager assigns
- assigned member requests cancel
- another member applies as replacement
- manager approves replacement

## Risks

- 행사 생성과 슬롯 복사가 schema 결정에 강하게 묶일 수 있다.
- replacement 승인 트랜잭션이 느슨하면 상태 경합이 생긴다.
- query invalidation 설계가 약하면 dashboard와 detail 상태가 어긋난다.

## Open Questions

- 체크인과 예상 급여를 이 phase 마지막 slice로 포함할지, 다음 phase 시작 slice로 넘길지
- replacement 목록 polling을 첫 버전부터 켤지, 수동 새로고침으로 시작할지

## Definition Of Done

- 위 6개 slice의 happy path가 모두 있다.
- 관련 route가 placeholder가 아니라 실제 데이터로 동작한다.
- `typecheck`, `lint`, `test`, `build`, 핵심 Playwright E2E가 통과한다.
- 다음 phase로 넘어가기 전에 checkpoint와 progress status가 갱신된다.
