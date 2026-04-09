# Phase 0.5 Plan: Core Operational Loop

Build Plan: [../build-plan.md](../build-plan.md)  
Architecture: [../architecture-spec.md](../architecture-spec.md)  
Screens: [../screen-spec.md](../screen-spec.md)  
Stack: [../stack-spec.md](../stack-spec.md)  
Codebase: [../codebase-architecture.md](../codebase-architecture.md)  
Execution: [../execution-plan.md](../execution-plan.md)  
Status: REVIEW_REQUIRED  
Date: 2026-04-09

## Goal
첫 번째 실제 운영 루프를 닫는다.

이 phase가 끝나면 아래 흐름이 최소 happy path로 이어져야 한다.
- 팀장이 행사 템플릿을 만든다
- 팀장이 행사 하나를 생성한다
- 팀원이 행사 목록을 보고 신청한다
- 팀장이 한 명을 배정한다
- 배정된 팀원이 취소를 요청한다
- 다른 팀원이 대타로 지원한다
- 팀장이 대타를 승인한다

체크인과 예상 급여는 이 phase 후반부 또는 바로 다음 이어지는 slice로 붙인다.

## In Scope
- 행사 템플릿 생성과 조회
- 행사 생성과 목록 조회
- 팀원 신청
- 팀장 배정
- 취소 요청과 replacement request 생성
- 대타 지원과 승인
- 최소 happy path 테스트

## Out Of Scope
- Google Auth
- 승인 대기와 온보딩 게이트
- 실제 웹 푸시 발송
- 체크인 예외 승인 UI의 완성
- 급여 override UI의 완성
- admin low-frequency 관리 화면 확장

## Stack Assumptions
- UI primitive: `shadcn/ui`
- client-side server state: `TanStack Query`
- client-only UI state: `Zustand`
- validation: `Zod`
- writes: Next.js `server actions`
- reads: `queries/*` 경계

## Route And Flow Impact

### Routes
- `/`
- `/events/[eventId]`
- `/replacements`

### Flows
- `flows/dashboard`
- `flows/event-detail`
- `flows/replacements`

## Domain Touch Points

### Queries
- `queries/events/list-events`
- `queries/events/get-event-detail`
- `queries/events/list-event-templates`
- `queries/applications/list-my-applications`
- `queries/assignments/list-event-assignments`
- `queries/replacements/list-open-replacements`
- `queries/replacements/list-replacement-candidates`

### Mutations
- `mutations/events/create-event-template`
- `mutations/events/create-event`
- `mutations/applications/apply-to-event`
- `mutations/applications/cancel-application`
- `mutations/assignments/assign-member`
- `mutations/assignments/request-cancel-assignment`
- `mutations/replacements/apply-to-replacement`
- `mutations/replacements/approve-replacement`
- `mutations/replacements/close-replacement`

### Schema And Rules
- `positions`
- `member_positions`
- `event_templates`
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
- 템플릿 생성과 조회의 최소 happy path

포함:
- template schema
- template create mutation
- template list query
- admin/manager용 기본 입력 폼
- unit + integration test

완료 기준:
- 새 템플릿을 만들고 바로 목록에서 볼 수 있다

### Slice 2. Manager Create Event
목표:
- 템플릿 기반으로 행사 하나를 만들 수 있다

포함:
- event create mutation
- event list/detail query
- slot 기본값 복사
- `/events/[eventId]` 기본 detail 표시
- unit + integration test

완료 기준:
- 템플릿을 골라 행사 생성 후 상세 화면으로 이동할 수 있다

### Slice 3. Member Apply To Event
목표:
- 팀원이 행사 목록을 보고 신청할 수 있다

포함:
- event list query hook with TanStack Query
- apply mutation
- cancel application mutation
- dashboard와 event detail의 신청 상태 표시
- unit + integration + smoke UI test

완료 기준:
- 팀원이 신청/취소를 반복할 수 있고 상태가 화면에 즉시 반영된다

### Slice 4. Manager Assign Member
목표:
- 팀장이 신청자 중 한 명을 포지션에 배정할 수 있다

포함:
- assignment create mutation
- assignment list query
- overlap warning rule
- 배정 UI
- unit + integration test

완료 기준:
- 배정 후 event detail에서 assignment가 보이고 중복 배정은 경고된다

### Slice 5. Cancellation To Replacement Request
목표:
- 배정 취소가 replacement request로 이어진다

포함:
- cancel assignment mutation
- replacement request create logic
- replacements list query
- `/replacements` 기본 목록
- integration test

완료 기준:
- 취소 요청 후 replacement request가 열리고 목록에 나타난다

### Slice 6. Candidate Apply And Manager Approve
목표:
- 다른 팀원이 대타 지원하고 팀장이 승인할 수 있다

포함:
- candidate filter query
- apply-to-replacement mutation
- approve-replacement mutation
- 새 assignment 생성
- request close 처리
- transaction + integration test

완료 기준:
- 대타 승인 후 새 assignment가 생기고 replacement request가 닫힌다

## TanStack Query And Zustand Usage

### TanStack Query
- list/detail read hook은 `queries/*/hooks`에서 제공
- dashboard, event detail, replacements 화면은 TanStack Query로 읽는다
- mutation 성공 후 관련 query invalidation을 표준으로 사용한다
- polling이 필요한 replacement 목록은 TanStack Query refetch interval 후보로 둔다

### Zustand
- dashboard filter
- replacement list local filter
- event detail local selection state
- modal open state

규칙:
- 서버 데이터 캐시는 Zustand에 넣지 않는다
- domain truth는 query cache 또는 server render 결과만 사용한다

## Test Plan

### Unit
- 템플릿 복사
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
- 행사 생성과 슬롯 복사가 schema 결정에 강하게 묶인다
- replacement 승인 트랜잭션을 느슨하게 잡으면 상태 경합이 생긴다
- query invalidation 설계가 약하면 dashboard와 detail 상태가 어긋날 수 있다

## Open Questions
- 체크인과 예상 급여를 이 phase 마지막 slice로 포함할지, 다음 phase 시작 slice로 뺄지
- replacement 목록 polling을 첫 버전에서 바로 켤지, 수동 새로고침으로 시작할지

## Definition Of Done
- 위 6개 slice의 happy path가 닫혀 있다
- 관련 route가 placeholder가 아니라 실제 데이터로 렌더된다
- `typecheck`, `lint`, `test`, `build`, 핵심 Playwright E2E가 통과한다
- 다음 phase로 넘어가기 전에 checkpoint와 phase status가 갱신된다
