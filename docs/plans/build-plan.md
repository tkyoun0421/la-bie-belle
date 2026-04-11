# Build Plan

Based on: [../designs/pwa.md](../designs/pwa.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
Stack: [./stack-spec.md](./stack-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Refactoring: [./refactoring-guide.md](./refactoring-guide.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: ACTIVE  
Date: 2026-04-10

## Goal

첫 버전에서 관리자와 멤버가 실제 운영 가능한 교대 운영 PWA를 만든다.

핵심 사용자 가치는 아래 세 가지다.

- 관리자: 행사 생성, 신청 확인, 배정, 취소 처리, 대타 승인
- 멤버: 행사 신청, 취소, 대타 지원, 체크인, 예상 급여 확인
- 운영: 카톡과 수기 기록 의존을 줄이고 화면에서 상태를 일관되게 본다

## Doc Map

- 이 문서
  - 범위, 고정 결정, shipping slice, 전체 build order
- [Architecture Spec](./architecture-spec.md)
  - 데이터 모델, 권한, 상태 전이, DB/query 규칙
- [Screen Spec](./screen-spec.md)
  - IA, 사용자 흐름, 화면 책임, fallback
- [Stack Spec](./stack-spec.md)
  - 프레임워크, 라이브러리, 버전 기준
- [Folder Hierarchy](./folder-hierarchy.md)
  - 폴더 계층 책임과 배치 기준
- [Codebase Architecture](./codebase-architecture.md)
  - 실제 `src/` 구조와 route-to-screen 매핑
- [FSD Profile](./fsd-profile.md)
  - naming, import, 테스트, private folder 규칙
- [Refactoring Guide](./refactoring-guide.md)
  - refactor entry 조건, SOLID 적용 방식, over-engineering guardrail
- [Execution Plan](./execution-plan.md)
  - phase, slice, 테스트 원칙, 구현 순서
- `docs/plans/phases/*`
  - phase별 구현 계획

## Locked Decisions

- 배포 형태는 비공개 운영 PWA
- 알림 채널은 웹 푸시만 사용
- 읽기는 query 기준, 쓰기는 Next.js `server actions` 또는 `route handlers`
- 첫 버전은 단일 조직, 단일 현장, `users` 중심 모델
- 역할은 `admin | manager | member`
- 체크인은 고정 반경 기반 위치 확인만 사용하고 기본 반경은 150m
- 행사 시간 모델은 `first_service_at`, `last_service_end_at`
- 필요 인원은 시간대별이 아니라 행사 단위로 관리
- 대타 승인 시 기존 assignment를 되살리지 않고 새 assignment를 만든다
- 예상 급여는 read-time 계산, 예외만 `payroll_overrides`에 저장
- 중복 배정은 기본 경고 정책
- 구조는 `app -> screens -> mutations -> queries -> entities -> shared`
- 테스트 스택은 `Vitest + Playwright`

## What Already Exists

- 제품 방향과 화면 초안은 [pwa.md](../designs/pwa.md)에 정리돼 있다.
- roadmap, TDD, CI, phase PR 규칙은 문서와 GitHub 운영 레일에 반영돼 있다.
- Supabase baseline schema와 seed, admin positions/templates CRUD는 이미 구현돼 있다.

## Not In Scope

- 앱스토어 배포
- 카카오/SMS 백업 알림
- 생체 체크인
- 체크인 이후 근태 심화 기능
- 교통비, 차감, 고급 급여 규칙
- 다중 현장, 다중 조직, 팀 구조
- 자동 대타 추천 고도화

## Shipping Slice

첫 배포에서 반드시 들어갈 최소 운영 루프는 아래와 같다.

- 관리자 행사 생성
- 멤버 행사 신청
- 관리자 배정
- 취소 요청과 대타 승인
- 위치 기반 체크인
- 예상 급여 조회

## Build Order Summary

1. 기본 DB schema와 `users / positions / member_positions` seed
2. 행사 템플릿과 행사 생성
3. 신청과 배정
4. 취소와 대타 승인
5. 체크인
6. 예상 급여 계산
7. Google Auth와 승인 흐름
8. 설치/푸시 알림 게이트

상세 phase와 test plan은 [Execution Plan](./execution-plan.md)을 따른다.

## Open Decisions That May Bite Later

- bootstrap admin gate를 env allowlist로 시작할지, perimeter protection으로 먼저 닫을지
- replacement polling을 첫 버전부터 켤지 수동 새로고침으로 시작할지

## Review Status

| Review        | Trigger               | Runs | Status | Findings                   |
| ------------- | --------------------- | ---- | ------ | -------------------------- |
| CEO Review    | `/plan-ceo-review`    | 0    | -      | -                          |
| Codex Review  | `/codex review`       | 0    | -      | -                          |
| Eng Review    | `/plan-eng-review`    | 1    | CLEAR  | 19 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | 0    | -      | -                          |
| DX Review     | `/plan-devex-review`  | 0    | -      | -                          |

- Cross-model conclusion: users-centric v1, explicit DB invariants, schedule-based payroll preview, operational loop first
- Unresolved: `0`
- Verdict: ENG CLEARED
