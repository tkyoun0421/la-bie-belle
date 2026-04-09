# Architecture Spec: 웨딩홀 근무 운영 PWA

Build Plan: [./build-plan.md](./build-plan.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-09

## Purpose
이 문서는 구현 전 기술 규칙의 source of truth다.  
화면 구조와 UX fallback은 [Screen Spec](./screen-spec.md)에서 다룬다.

## Boring Defaults
- Frontend: Next.js App Router + TypeScript + PWA
- Backend: Supabase
- DB: Postgres
- Auth: Google provider
- Push: Service Worker + Web Push subscriptions

## Core Data Model
첫 버전은 `users` 중심 모델이다. `teams`, `team_memberships`, 복수 현장 구조는 두지 않는다.

### Identity And Access
- `users`
  - `id`, `email`, `google_sub`, `role`
  - `name`, `phone`, `hourly_wage`
  - `venue_lat`, `venue_lng`, `checkin_radius_m`
  - `install_confirmed_at`, `onboarding_completed_at`
  - `push_enabled`, `push_subscribed_at`
- `membership_requests`
  - `id`, `user_id`, `status`
  - `requested_at`, `reviewed_at`, `reviewed_by`
- `push_subscriptions`
  - `id`, `user_id`
  - `endpoint`, `p256dh`, `auth`
  - `user_agent`, `last_seen_at`, `revoked_at`

### Scheduling And Staffing
- `positions`
  - `id`, `name`
- `member_positions`
  - `id`, `user_id`, `position_id`, `status`
  - `status = qualified | training`
- `event_templates`
  - `id`, `name`, `time_label`
  - `first_service_at`, `last_service_end_at`
- `events`
  - `id`, `template_id`, `title`, `time_label`
  - `event_date`, `first_service_at`, `last_service_end_at`, `status`
- `event_position_slots`
  - `id`, `event_id`, `position_id`
  - `required_count`, `training_count`
- `applications`
  - `id`, `event_id`, `user_id`, `status`, `applied_at`
- `assignments`
  - `id`, `event_id`, `user_id`, `position_id`
  - `assignment_kind = regular | training`
  - `status = assigned | confirmed | cancel_requested | cancelled`

### Replacement, Attendance, Payroll
- `replacement_requests`
  - `id`, `cancelled_assignment_id`, `position_id`, `status`
  - `approved_assignment_id`, `closed_at`, `closed_by`
- `replacement_applications`
  - `id`, `replacement_request_id`, `user_id`, `applied_at`
- `checkins`
  - `id`, `assignment_id`, `user_id`, `status`
  - `checked_in_at`, `lat`, `lng`, `accuracy_m`, `within_radius`
  - `exception_request_reason`, `exception_requested_at`
  - `exception_approved_by`, `exception_approved_at`
- `payroll_overrides`
  - `id`, `assignment_id`, `user_id`
  - `overridden_amount`, `override_reason`, `overridden_by`, `created_at`
- `audit_logs`
  - `id`, `entity_type`, `entity_id`, `action_type`
  - `before_json`, `after_json`, `reason`
  - `actor_user_id`, `created_at`

### Model Notes
- `users.push_enabled`와 `users.push_subscribed_at`는 `push_subscriptions`의 파생 상태다.
- 포지션 필요 인원은 시간대별이 아니라 행사 단위로 관리한다.
- 급여 계산의 source of truth는 행사 시간과 사용자 시급이며, 예외만 override로 저장한다.

## Access Boundary
- 읽기 경로는 RLS를 통과한 query 기준으로 구현한다.
- 상태 변경은 Next.js `server actions` 또는 `route handlers`로만 처리한다.
- 승인, 배정, 대타 승인, 체크인 예외 승인, 급여 override는 모두 감사 로그를 남긴다.
- 클라이언트에서 직접 privileged mutation을 호출하지 않는다.

## Permission Matrix
| Action | Admin | Manager | Member |
|---|---|---|---|
| 운영 기본 설정 | O | - | - |
| 사용자 역할/자격 관리 | O | - | - |
| 가입 승인/거절 | O | - | - |
| 행사 템플릿 관리 | O | O | - |
| 행사 생성/수정 | - | O | - |
| 포지션 필요 인원 설정 | - | O | - |
| 행사 신청/취소 | - | - | O |
| 배정/확정 | - | O | - |
| 취소 처리 | - | O | - |
| 대타 승인 | - | O | - |
| 체크인 예외 승인 | - | O | - |
| 급여 규칙 설정 | O | - | - |
| 예상 급여 조회 | O | O | O(본인) |
| 급여 override | O | O | - |

## State Machines
- `membership_requests`
  - `pending -> approved | rejected`
- `events`
  - `draft -> recruiting -> staffed -> in_progress -> completed`
  - `draft -> cancelled`
- `assignments`
  - `assigned -> confirmed -> checked_in`
  - `assigned -> cancel_requested -> cancelled`
- `replacement_requests`
  - `open -> pending_manager_approval -> approved -> closed`
  - `approved`는 새 assignment 생성까지 포함한다

## DB Invariants
- 사용자당 활성 가입 요청은 최대 1개
- 사용자당 포지션 자격은 `user_id + position_id` 기준 최대 1개
- 같은 행사에 같은 사용자의 신청은 최대 1개
- 같은 행사에서 같은 포지션으로 같은 사용자의 활성 assignment는 최대 1개
- 취소된 assignment당 replacement request는 최대 1개
- assignment당 checkin은 최대 1개
- 대타 승인, 새 assignment 생성, 모집 종료는 하나의 트랜잭션으로 처리한다
- 동일 날짜/시간대 중복 배정은 금지 대신 경고 대상으로 다룬다

## Domain Conventions
- 상태 enum과 transition table은 중앙 도메인 모듈에서 관리한다.
- 화면과 서버 코드에서 상태 문자열을 직접 하드코딩하지 않는다.
- 중복 배정 경고 규칙은 중앙 도메인 규칙으로 관리한다.
- 예상 급여는 read-time 계산으로 제공하고, 수동 예외만 저장한다.
- 사용자 세션 정보는 cross-cutting concern으로 취급하고 도메인 데이터와 분리한다.

## Query Guardrails
- 대타 후보 조회는 서버 쿼리 1회로 끝나는 형태를 기본 요구사항으로 둔다.
- replacement fan-out은 `replacement_requests -> assignments -> member_positions -> push_subscriptions`를 서버에서 조합한다.
- 예상 급여 조회는 페이지 단위 assignment를 배치로 읽고 한 번에 계산한다.
- 리스트 카드마다 개별 계산 쿼리를 날리는 N+1 패턴은 금지한다.

### Recommended Indexes
- `member_positions(position_id, status, user_id)`
- `applications(event_id, user_id, status)`
- `assignments(event_id, position_id, user_id, status)`
- `replacement_requests(cancelled_assignment_id, status)`
- `replacement_applications(replacement_request_id, user_id)`
- `push_subscriptions(user_id, revoked_at)`
