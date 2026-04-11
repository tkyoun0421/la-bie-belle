# Execution Plan

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
Stack: [./stack-spec.md](./stack-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
Folder Hierarchy: [./folder-hierarchy.md](./folder-hierarchy.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Refactoring: [./refactoring-guide.md](./refactoring-guide.md)  
Design: [../designs/pwa.md](../designs/pwa.md)  
Status: ACTIVE  
Date: 2026-04-11

## Purpose

이 문서는 구현 순서와 검증 계획의 source of truth다.  
범위와 고정 결정은 [Build Plan](./build-plan.md), 기술 구조는 [Architecture Spec](./architecture-spec.md)을 따른다.

## Delivery Principle

운영 루프를 먼저 닫고, 인증과 PWA 게이트는 그 뒤에 붙인다.

v1에서 먼저 닫아야 하는 운영 루프:

- 행사 생성
- 신청과 배정
- 취소와 대타 승인
- 체크인
- 예상 급여 조회

## Work Unit Model

프로젝트는 `phase -> slice -> task` 순서로 구현한다.

- `phase`
  - 큰 개발 단계
  - 예: `Phase 0. Bootstrap`, `Phase 3. Replacement`
- `slice`
  - 하나의 사용자 가치가 보이는 작은 vertical use case
  - UI, query, mutation, schema, test를 필요한 만큼 함께 닫는다
- `task`
  - slice 내부의 세부 구현 단계

### Slice Rule

- slice는 화면에서 확인 가능한 결과를 남겨야 한다.
- slice 하나가 끝나면 최소 happy path가 동작해야 한다.
- 공통 scaffold만 만들고 끝내는 작업은 지양한다.
- schema만 바꾸는 작업도 이어지는 use case가 있을 때만 닫는다.

## Branch Strategy

- 일상 구현 브랜치는 `develop`
- 구현은 기본적으로 `develop`에서 진행한다
- phase가 끝나면 `develop -> master`로 PR을 올린다
- `master`는 release 기준 브랜치다

## PR Rule

- PR 단위는 slice가 아니라 phase다
- 하나의 PR은 하나의 phase만 다룬다
- 하나의 phase 안의 여러 slice는 같은 PR에서 같이 닫는다
- phase PR 본문에는 포함된 slice와 연결 issue를 같이 적는다

## TDD Operating Rule

이 프로젝트의 기본 구현 방식은 TDD다.

- task를 시작할 때 먼저 실패하는 테스트를 만든다
- 구현은 그 테스트를 통과시키는 최소 변경으로 시작한다
- green 이후에만 refactor한다
- refactor 기준과 금지선은 [Refactoring Guide](./refactoring-guide.md)를 따른다
- 기본 우선순위는 `unit -> integration -> e2e`
- 버그 수정은 재현 테스트를 먼저 추가한다
- slice를 닫을 때는 happy path와 핵심 예외가 자동 테스트로 재현돼야 한다
- phase 문서의 `test plan`은 구현 전에 먼저 갱신한다

예외는 bootstrap plumbing, 문서 작업, 탐색성 작업처럼 사용자 동작이 아직 없는 경우로 제한한다.

## Recommended Slice Size

- 한 slice는 보통 1개 use case 또는 1개 사용자 흐름만 다룬다
- 한 slice 안에서 route, screen, query, mutation, test가 같이 움직여도 된다
- slice 경계 판단 기준은 “이 작업이 끝나면 데모 가능한가”다

## Phase Review Gate

각 phase는 구현 전에 먼저 상세 문서를 만든다.

- 위치: `docs/plans/phases/*`
- 목적: 범위, slice, touched routes, touched screens, queries, mutations, tests를 먼저 검토 가능하게 만드는 것
- 절차: phase 문서가 먼저, 구현은 그 다음
- user review 전에는 다음 phase 구현을 시작하지 않는다

phase 문서 최소 항목:

- goal
- in scope / out of scope
- stack assumptions
- route and screen impact
- slice breakdown
- query / mutation / schema touch points
- test plan
- risks and open questions
- definition of done

## Pause And Resume Rule

작업은 slice 경계에서 멈추는 것을 기본으로 한다.

- slice 시작 전
  - 현재 phase와 목표 slice를 명확히 한다
- slice 완료 직후
  - 다음 slice와 리스크를 적는다
  - 필요하면 `/checkpoint save`
- 세션 종료 전
  - `/checkpoint {현재 작업명}` 고려
- 복귀 시
  - `/checkpoint resume`

## Implementation Guardrails

- 테스트 스택은 `Vitest + Playwright`
- `Vitest`는 unit과 integration, `Playwright`는 핵심 E2E
- 기본 개발 루프는 `red -> green -> refactor`
- 상태 변경 쓰기는 Next.js `server actions` 또는 `route handlers`
- 읽기 데이터 접근은 `entities/*/repositories`
- 화면 조합은 `screens/*`
- server state는 server hydration + TanStack Query

## Test Plan

### Unit

- 근무 시간 계산
- 초과 근무 계산
- 포지션 자격 필터
- 템플릿 슬롯 복사
- 상태 전이 허용 여부
- 중복 배정 경고
- 체크인 반경 판정

### Integration

- 가입 요청 -> 승인 -> 역할 생성
- 관리자 달력 날짜 선택 -> 행사 생성 -> 신청 -> 배정 -> 확정
- 취소 -> 대타 알림 -> 지원 -> 승인
- 중복 신청, 중복 checkin, 중복 replacement request 제약 검증
- 모집 종료 후 추가 지원 차단
- 체크인 실패 -> 예외 요청 -> 관리자 승인
- 예상 급여 계산 + override + audit log

### E2E

- 로그인 -> 승인 대기 -> 승인 후 기능 해제
- 관리자 달력 스케줄 생성 -> 멤버 달력 신청 -> 관리자 배정
- 취소 발생 -> 대타 승인
- 체크인 성공 -> 예상 급여 확인
- 체크인 실패 -> 예외 요청 -> 승인
- 설치/푸시 미완료 상태에서 알림 관련 게이트 차단

## Implementation Phases

### Phase 0. Bootstrap

- Next.js bootstrap
- 기본 DB schema
- `users / positions / member_positions` seed

### Phase 0.5. Core Operational Loop

- 행사 템플릿 CRUD
- 행사 생성
- 신청과 취소
- 배정과 확정
- 취소와 대타 승인
- 예상 급여 조회 전 단계까지 운영 루프 연결

### Phase 1. Event + Template

- 템플릿과 행사 시간 편집
- 포지션별 필요 인원 입력
- 교육 슬롯 입력

### Phase 2. Application + Assignment

- 신청 목록
- 배정 UI
- 확정 상태 반영

### Phase 3. Replacement

- 대타 후보 조회
- push fan-out
- 지원 접수
- 모집 종료
- 승인

### Phase 4. Check-in

- 위치 반경 검증
- 예외 요청
- 미체크인 경고
- 예외 승인

### Phase 5. Payroll Preview

- 근무 시간 계산
- 예상 급여 계산
- 배치 조회
- override

### Phase 6. Auth + PWA Onboarding

- Google Auth
- 승인 대기 흐름
- 역할 기반 라우팅
- 설치/푸시 게이트

## Suggested Build Order

1. DB schema와 seed
2. 템플릿과 행사 생성
3. 신청과 배정
4. 취소와 대타 승인
5. 체크인
6. 예상 급여
7. Auth 승인 흐름
8. 설치/푸시 게이트

## Parallelization Strategy

| Step                             | Modules touched                                 | Depends on |
| -------------------------------- | ----------------------------------------------- | ---------- |
| A. Schema + status rules         | DB schema, domain rules, audit logging          | -          |
| B. Event template + event editor | template UI, event services, event repositories | A          |
| C. Application + assignment      | member apply UI, assignment services            | A, B       |
| D. Replacement loop              | replacement services, push fan-out, approval UI | C          |
| E. Check-in + payroll            | location check-in UI, payroll calculation       | C          |
| F. Auth + onboarding             | auth callbacks, approval routing, onboarding UI | A          |

## Exit Criteria

- Shipping slice 전체가 자동 테스트로 재현 가능하다
- 승인 흐름, 대타 승인 경계, 체크인 예외, 급여 override가 모두 검증된다
- Auth/PWA 단계가 붙은 뒤에도 운영 루프가 깨지지 않는다
