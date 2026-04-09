# Execution Plan: 웨딩홀 근무 운영 PWA

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
Stack: [./stack-spec.md](./stack-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Design: [../designs/pwa.md](../designs/pwa.md)  
Status: DRAFT  
Date: 2026-04-09

## Purpose
이 문서는 구현 순서와 검증 계획의 source of truth다.  
범위와 고정 결정은 [Build Plan](./build-plan.md), 기술 구조는 [Architecture Spec](./architecture-spec.md)을 따른다.

## Delivery Principle
운영 루프를 먼저 증명하고, 인증과 PWA 게이트는 뒤에 붙인다.

v1에서 먼저 닫아야 할 운영 루프:
- 행사 생성
- 신청과 배정
- 취소와 대타 승인
- 체크인
- 예상 급여 조회

## Work Unit Model
이 프로젝트는 `phase -> slice -> task` 순서로 구현한다.

- `phase`
  - 큰 개발 단계다
  - 예: `Phase 0. Bootstrap`, `Phase 3. Replacement`
- `slice`
  - 하나의 사용자 가치가 닫히는 작은 vertical use case다
  - UI, query, mutation, schema, test를 필요한 만큼 함께 닫는다
- `task`
  - 한 slice 안의 세부 구현 단계다
  - 예: path alias 설정, hook 작성, action 연결, 테스트 추가

### Slice Rule
- slice는 화면에서 확인 가능한 결과를 남겨야 한다
- slice 하나가 끝나면 최소 happy path는 동작해야 한다
- slice는 가능하면 한 use case를 한 번에 닫는다
- 공통 scaffold만 만들고 끝내는 작업은 피한다
- schema만 바꾸는 작업도 바로 이어지는 use case가 있을 때만 연다

## Branch Strategy
- 일상 구현 브랜치는 `develop`
- 구현은 기본적으로 `develop`에서 직접 진행한다
- phase가 끝나면 `develop`에서 `master`로 PR을 올린다
- `master`는 release 또는 배포 기준 브랜치로 유지한다

예시:
- 작업: `develop`
- PR head: `develop`
- PR base: `master`

## PR Rule
- PR 단위는 slice가 아니라 phase다
- 하나의 PR은 하나의 phase만 다룬다
- 하나의 phase 안에 포함된 slice들은 같은 PR에서 함께 닫는다
- phase PR 본문에는 포함된 slice 목록과 닫는 issue 목록이 함께 있어야 한다
- phase PR의 head는 `develop`, base는 `master`다
- 다음 phase 작업은 이전 phase PR이 `master`에 머지된 뒤 같은 `develop`에서 이어간다

## TDD Operating Rule
이 프로젝트의 기본 구현 방식은 TDD다.

- task를 시작할 때는 먼저 실패하는 테스트를 만든다
- 구현은 그 테스트를 통과시키는 최소 변경으로 시작한다
- 테스트가 통과한 뒤에만 refactor를 한다
- 새 기능은 가능한 한 가장 싼 레벨의 테스트부터 잠근다. 기본 우선순위는 `unit -> integration -> e2e`다
- 버그 수정은 반드시 재현 테스트를 먼저 추가한다
- slice 완료 조건에는 happy path 자동화 테스트와 핵심 회귀 방지가 포함된다
- phase 문서의 `test plan`은 구현 전에 먼저 갱신하고, 구현 중간에 바뀌면 같은 변경에서 같이 갱신한다
- 테스트를 나중으로 미루는 예외는 bootstrap plumbing, 문서 작업, 시각 탐색처럼 사용자 동작이 아직 닫히지 않은 경우로 제한한다
- 예외를 썼다면 해당 slice를 닫기 전에 누락된 테스트를 바로 보충한다

대표 예시:
- `Phase 0`
  - `bootstrap-path-alias-and-src-tree`
  - `bootstrap-vitest-playwright-harness`
  - `bootstrap-base-schema-and-seed`
- `Phase 0.5`
  - `event-template-create`
  - `member-apply-to-event`
  - `manager-assign-member`
  - `replacement-approve-candidate`

### Recommended Slice Size
- 한 slice는 1개 use case 또는 1개 사용자 흐름만 다룬다
- 한 slice 안에서 route, flow, query, mutation, test가 같이 움직여도 된다
- 여러 role과 여러 화면을 한 번에 묶는 slice는 피한다
- slice 경계는 "이 작업이 끝나면 데모 가능한가?"로 판단한다

## Phase Review Gate
각 phase는 구현 전에 먼저 상세 문서를 만든다.

- 위치: `docs/plans/phases/*`
- 목적: 구현 전에 범위, slice, touched routes, queries, mutations, tests를 검토 가능하게 만드는 것
- 원칙: phase 문서가 먼저, 구현은 그 다음
- user review가 끝나기 전에는 다음 phase 코딩을 시작하지 않는다

phase 문서 최소 항목:
- goal
- in scope / out of scope
- stack assumptions
- route and flow impact
- slice breakdown
- query / mutation / schema touch points
- test plan
- risks and open questions
- definition of done

## Pause And Resume Rule
작업은 slice 경계에서 멈추는 것을 기본으로 한다.

- slice 시작 전
  - 현재 phase와 목표 slice를 정한다
- slice 완료 직후
  - 다음 slice 한 줄을 남긴다
  - 필요하면 `/checkpoint save`
- 세션 종료 전
  - `/checkpoint {현재 작업 제목}`으로 저장한다
- 복귀 시
  - `/checkpoint resume`로 마지막 작업 요약과 다음 작업을 복구한다
- checkpoint가 여러 개면
  - `/checkpoint list`
  - `/checkpoint list --all`

checkpoint에는 브랜치, git 상태, 결정 사항, 남은 작업이 같이 저장된다.

## Implementation Guardrails
- 테스트 스택은 `Vitest + Playwright`
- `Vitest`는 unit과 integration, `Playwright`는 핵심 E2E를 담당
- 기본 개발 루프는 `red -> green -> refactor`로 운영한다
- 상태 변경 쓰기는 Next.js `server actions` 또는 `route handlers`로만 구현
- 읽기 경로는 RLS 기준 query로 구현
- 상태 enum, transition table, overlap 경고 규칙은 중앙 도메인 모듈에서 관리

## Test Plan

### Unit
- 근무 시간 계산
- 9시간 초과 1.5배 계산
- 포지션 가능 인원 필터
- 템플릿 시간 복사
- 상태 전이 허용 여부
- 중복 배정 경고 판정
- 체크인 반경 판정

### Integration
- 가입 요청 -> 승인 -> 역할 활성화
- 행사 생성 -> 신청 -> 배정 -> 확정
- 취소 -> 대타 알림 -> 지원 -> 팀장 승인
- 중복 요청, 중복 checkin, 중복 replacement request 제약 검증
- 모집 종료 후 추가 지원 차단
- 체크인 실패 -> 예외 요청 -> 팀장 승인
- 예상 급여 계산 + override + audit log

### E2E
- 로그인 -> 승인 대기 -> 승인 후 기능 해제
- 팀장 행사 생성 -> 팀원 신청 -> 팀장 배정
- 취소 발생 -> 대타 승인까지 완료
- 체크인 성공 -> 예상 급여 확인
- 체크인 실패 -> 예외 요청 -> 승인
- 설치/푸시 미완료 상태에서 온보딩 게이트 차단

## Implementation Phases

### Phase 0. Bootstrap
- Next.js 앱 부트스트랩
- 기본 DB 스키마
- `users / positions / member_positions` seed

### Phase 0.5. Core Operational Loop
- 행사 템플릿 CRUD
- 행사 생성
- 신청과 취소
- 배정과 확정
- 취소와 대타 승인
- 위치 체크인
- 예상 급여 조회

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
- 푸시 fan-out
- 지원 접수
- 모집 종료
- 승인

### Phase 4. Check-in
- 위치 반경 검사
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
- 설치/푸시 온보딩 게이트

## Suggested Build Order
1. DB 스키마와 seed
2. 템플릿과 행사 생성
3. 신청과 배정
4. 취소와 대타 승인
5. 체크인
6. 예상 급여
7. Auth 승인 흐름
8. 설치/푸시 게이트

## Parallelization Strategy
| Step | Modules touched | Depends on |
|------|-----------------|------------|
| A. Schema + status rules | DB schema, domain rules, audit logging | - |
| B. Event template + event editor | manager event UI, event services | A |
| C. Application + assignment | member application UI, assignment services | A, B |
| D. Replacement flow | replacement services, push fan-out, approval UI | C |
| E. Check-in + payroll | location check-in UI, payroll calculation | C |
| F. Auth + onboarding | auth callbacks, approval routing, onboarding UI | A |

기본 lane:
- Lane A: `A -> B -> C -> D`
- Lane B: `A -> E`
- Lane C: `A -> F`

## Execution Exit Criteria
- Shipping slice 전부가 자동 테스트로 재현 가능하다
- 승인 흐름, 대타 승인 경쟁 조건, 체크인 예외, 급여 override가 모두 검증된다
- Auth/PWA 단계가 붙은 뒤에도 운영 루프가 깨지지 않는다
