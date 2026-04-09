# Progress Status

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Phase Plan: [./phases/phase-0-5-core-operational-loop.md](./phases/phase-0-5-core-operational-loop.md)  
Status: ACTIVE  
Date: 2026-04-10

## Completed Foundations

- TDD 운영 규칙을 문서화했고 slice 기준 `red -> green -> refactor`를 기본 루프로 고정했다.
- GitHub Actions CI를 추가해서 `lint`, `typecheck`, `test`, `build`, `test:e2e`를 자동 검증한다.
- GitHub roadmap 운영 레일, issue 템플릿, PR 템플릿, `develop -> master` phase PR 규칙을 정리했다.
- Supabase 프로젝트를 초기화하고 baseline migration과 seed를 다시 잡았다.
- TanStack Query provider와 hydration 기반 read path를 연결했다.
- `src/` 계층 규칙을 `app -> screens -> mutations -> queries -> entities -> shared`로 재정의했다.

## Implemented Product Surface

### Phase 1 / Slice 1

- `/admin/positions`
  - 포지션 생성, 수정, 삭제
  - 포지션별 가능 성별 지정
- `/admin/templates`
  - 행사 템플릿 생성, 수정, 삭제
  - 포지션 슬롯 기본값 저장

현재 이 두 화면은 실제 Supabase DB를 사용하고, mock 데이터는 제거된 상태다.

## Current Architecture Decisions

- top-level layer는 `app / screens / mutations / queries / entities / shared`
- `screens`는 화면 조합만 담당한다.
- `mutations`와 `queries`에는 UI component를 두지 않는다.
- `entities`는 현재 기준으로 non-UI domain core다.
- `entities/repositories`는 domain-level data access layer다.
- `screens/*/_components`에 screen-local dumb UI와 client island를 둔다.
- server state는 server hydration + TanStack Query를 기준으로 관리한다.
- client-only local state는 React built-in state와 domain hook을 우선 사용한다.

## Current Stack Snapshot

- Next.js App Router + React 19
- Supabase + Postgres
- TanStack Query
- Zod
- Tailwind CSS v4
- Vitest + Playwright

## Next Priority

- Phase 1 / Slice 2: 템플릿 기반 행사 생성
- admin bootstrap gate 또는 perimeter protection 정리
- event/application/assignment/replacement happy path 확장
