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
