# Progress Status

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Phase Plan: [./phases/phase-0-5-core-operational-loop.md](./phases/phase-0-5-core-operational-loop.md)  
Status: ACTIVE  
Date: 2026-04-10

## Completed Foundations

- TDD 운영 규칙을 문서화했고, slice를 `red -> green -> refactor` 기준으로 닫도록 정했다.
- GitHub Actions CI를 추가해서 `lint`, `typecheck`, `test`, `build`, `test:e2e`를 자동 검증하도록 맞췄다.
- GitHub roadmap 운영 레일을 만들었고, 이슈/PR 템플릿과 `develop -> master` phase PR 흐름을 정리했다.
- Supabase 원격 프로젝트를 초기화하고, 현재 프로젝트 기준 초기 migration과 seed를 다시 깔았다.
- TanStack Query provider와 hydration 기반 read path를 연결했다.

## Implemented Product Surface

### Phase 1 / Slice 1

- `/admin/positions`
  - 포지션 생성, 수정, 삭제
  - 포지션별 가능 성별 지정
- `/admin/templates`
  - 행사 템플릿 생성, 수정, 삭제
  - 포지션 슬롯 기본값 저장

두 화면 모두 실제 Supabase DB를 사용하며, mock 데이터는 제거했다.

## Current Architecture Decisions

- top-level 레이어는 `app / flows / queries / mutations / shared`를 유지한다.
- `queries/models/{constants,mappers,repositories,schemas,types}`는 same-domain pure-read core다.
- `mutations`는 같은 도메인의 query core만 import할 수 있다.
- `queries`와 `mutations`에는 UI 컴포넌트를 두지 않는다.
- 화면 전용 UI는 `flows/*/_components`에 둔다.
- `flows`는 server shell을 기본으로 하고, 꼭 필요한 부분만 client island로 분리한다.
- flow-local hooks는 기본 구조가 아니며, client state owner는 가능한 도메인 hooks다.
- private support folder는 `_components`, `_tests`처럼 `_` prefix를 사용한다.

## Current Stack Snapshot

- Next.js App Router + React 19
- Supabase + Postgres
- TanStack Query
- Zod
- Tailwind CSS v4
- Vitest + Playwright

현재 local client state는 React built-in state를 우선 사용하고, 별도 global client store는 도입하지 않았다.

## Next Priority

- Phase 1 / Slice 2: 템플릿 기반 행사 생성
- admin bootstrap gate 또는 perimeter protection 정리
- 이후 event/application/assignment/replacement happy path 확장
