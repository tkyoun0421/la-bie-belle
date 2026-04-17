# Progress Status

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Phase Plan: [./phases/phase-0-5-core-operational-loop.md](./phases/phase-0-5-core-operational-loop.md)  
Status: ACTIVE  
Date: 2026-04-11

## Completed Foundations

- TDD 운영 규칙과 `red -> green -> refactor` 루프를 문서화했다.
- GitHub Actions CI에 `lint`, `typecheck`, `test`, `build`, `test:e2e`를 연결했다.
- GitHub roadmap, phase PR 규칙, issue/PR 템플릿을 정리했다.
- Supabase 프로젝트를 초기화하고 baseline migration과 seed를 다시 적용했다.
- `src/` 레이어 구조를 `app -> screens -> mutations -> queries -> entities -> shared`로 고정했다.
- `events`, `positions` 도메인의 CRUD와 admin 화면을 Supabase 기준으로 연결했다.
- React Query hydration, query key factory, React Compiler를 적용했다.

## Implemented Product Surface

### Phase 1 / Slice 1

- `/admin/positions`
  - 포지션 생성, 수정, 삭제
  - 기본 필수 인원 설정
  - 드래그 정렬
- `/admin/templates`
  - 템플릿 목록
  - 대표 템플릿 관리
  - 템플릿 생성 / 수정 전용 페이지
  - 슬롯 드래그 정렬
  - 포지션 기본값 기반 슬롯 구성

### Phase 1 / Slice 2

- `/admin/events/new`
  - 템플릿 기반 대량 행사 생성
  - 달력 multi-select 날짜 선택
  - 중복 날짜 방지 (duplicate-date guard)
  - 생성 결과 확인 UI
  - 템플릿 기본값(시간, 슬롯) 자동 복사
- 기존 `/admin/templates/[templateId]/create-event` 제거 (transitional route)

### Phase 1 / Slice 3

- `/`
  - `react-day-picker` 기반 달력 대시보드
  - 열린 스케줄 날짜 multi-select
  - 선택 날짜 기준 bulk 신청 / 취소
  - 빈 상태에서 템플릿 관리 진입
- `/events/[eventId]`
  - 행사 메타데이터 detail read model
  - 템플릿에서 복사된 포지션 슬롯 표시
  - 신청 상태 fallback panel

### Phase 1 / Slice 4, 5, 6

- `/events/[eventId]` (Admin/Manager view)
  - 신청자 목록 조회 및 포지션 배정
  - 중복 배정 경고 표시
  - 배정 취소 및 대타 요청 생성 루프
- `/replacements`
  - 진행 중인 대타 요청 목록 조회
  - 대타 지원 (Member)
  - 대타 지원자 목록 조회 및 승인 (Admin/Manager)
  - 승인 시 기존 배정 취소 및 새 배정 생성 자동화
- Domain Invariants
  - 본인 취소 건에 대한 대타 지원 방지
  - 자격(member_positions) 보유자만 대타 지원 가능
  - 대타 승인 시 상태 전이 원자성 확보 (assignment: cancel_requested -> cancelled, new assignment: assigned)

## Current Architecture Decisions

- `screens`는 `app` route 구조를 그대로 따른다.
- `mutations`와 `queries`에는 UI 컴포넌트를 두지 않는다.
- `entities`는 non-UI domain core와 persistence를 담당한다.
- `entities/repositories`는 domain-level data access layer다.
- repository는 필요 시 `read*Repository.ts`, `write*Repository.ts`로 분리한다.
- `mutations/actions`는 raw Supabase 호출 대신 repository orchestration만 맡는다.
- server state는 server hydration + TanStack Query를 기본으로 관리한다.
- client-only local state는 screen-local hook과 React built-in state를 우선 사용한다.
- admin privileged path는 bootstrap admin gate 뒤에 둔다.
- bootstrap gate는 `BOOTSTRAP_ADMIN_EMAILS` allowlist를 기준으로 하고, non-production에서는 development bypass를 기본 허용한다.

## Current Stack Snapshot

- Next.js App Router + React 19
- Supabase + Postgres
- TanStack Query
- Zod
- Tailwind CSS v4
- shadcn/ui
- Vitest + Playwright

## Next Priority

- 현재 달력 범위는 explicit date select까지만 포함하고 반복 규칙 자동 생성은 제외
- auth callback / 로그인 진입점 구현
- event / application / assignment / replacement happy path 확장
- lower layer 에러를 코드 중심으로 정리하고 화면에서 문구를 매핑하는 구조로 이동
