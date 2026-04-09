# Build Plan: 웨딩홀 근무 운영 PWA

Based on: [../designs/pwa.md](../designs/pwa.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Screens: [./screen-spec.md](./screen-spec.md)  
Stack: [./stack-spec.md](./stack-spec.md)  
Codebase: [./codebase-architecture.md](./codebase-architecture.md)  
FSD Profile: [./fsd-profile.md](./fsd-profile.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Status: DRAFT  
Date: 2026-04-09

## Goal
첫 버전에서 팀장과 팀원이 실제 운영에 쓸 수 있는 근무 운영 PWA를 만든다.

핵심 가치는 아래 세 가지다.
- 팀장: 행사 생성, 신청 확인, 배정, 취소 대응, 대타 승인
- 팀원: 신청, 취소, 체크인, 예상 급여 확인
- 운영: 카톡과 수기 기록을 줄이고 상태를 한 화면에서 본다

## Doc Map
- 이 문서: 범위, 고정 결정, shipping slice, 전체 build order, 리뷰 상태
- [Architecture Spec](./architecture-spec.md): 데이터 모델, 권한, 상태 전이, DB/query 규칙
- [Screen Spec](./screen-spec.md): IA, 핵심 사용자 흐름, 화면 책임, 실패 시 fallback
- [Stack Spec](./stack-spec.md): 프레임워크, 런타임, 라이브러리 선택과 결정 시점
- [Codebase Architecture](./codebase-architecture.md): `src/` 구조, route to flow 매핑, 의존 규칙
- [FSD Profile](./fsd-profile.md): 개인화된 FSD 규칙, naming, import, 내부 폴더 기준
- [Execution Plan](./execution-plan.md): 테스트 전략, 구현 phase, build 순서

## Locked Decisions
- 배포 형태는 비공개 PWA
- 알림 채널은 웹 푸시만 사용
- 읽기는 RLS 기준, 상태 변경 쓰기는 Next.js `server actions` 또는 `route handlers`로만 처리
- 첫 버전은 단일 고정 현장, 단일 운영 조직, `users` 중심 모델로 간다
- 역할은 `admin | manager | member`
- 첫 로그인 사용자는 승인 대기 상태로 들어오고, 승인 전에는 운영 기능을 열지 않는다
- 온보딩 게이트는 설치 확인과 푸시 구독 완료 전까지 신청/취소/체크인 기능을 잠근다
- 체크인은 고정 반경 기반 위치 확인만 사용하고 기본 반경은 150m다
- 행사 시간 모델은 `first_service_at`과 `last_service_end_at`를 기준으로 한다
- 포지션 필요 인원은 시간대별이 아니라 행사 단위로 관리한다
- 대타 알림은 같은 포지션을 수행할 수 있는 인원에게만 fan-out 한다
- 푸시 구독은 `push_subscriptions`에 기기 단위로 저장한다
- 대타 승인 시 기존 assignment를 되살리지 않고 새 assignment를 만든다
- 예상 급여는 read-time 계산이며, 예외만 `payroll_overrides`로 저장한다
- 중복 배정은 기본 경고 대상이고 최종 판단은 팀장이 한다
- 상태 enum과 transition table은 중앙 도메인 모듈에서 관리한다
- 테스트 스택은 `Vitest + Playwright`
- 코드베이스 구조는 personalized FSD를 따르고 세부 규칙은 [FSD Profile](./fsd-profile.md)에 고정한다

## What Already Exists
- 제품 방향과 화면 의도는 [pwa.md](../designs/pwa.md)에 정리돼 있다.
- 구현 코드는 아직 없고, 현재는 설계 문서만 잠긴 상태다.
- 엔지니어링 리뷰는 완료됐고 critical gap은 없다.

## Not In Scope
- 앱스토어 배포
- 카카오톡/SMS 백업 알림
- 자동 지문 또는 생체 체크인
- 체크아웃 기능
- 교통비, 지각 차감, 세부 정산 규칙
- 다중 현장, 다중 조직, 멀티 팀 구조
- 자동 대타 추천의 고급 랭킹

## Shipping Slice
첫 배포에 반드시 들어갈 범위는 아래다.

- 팀장 행사 생성
- 팀원 신청
- 팀장 배정
- 취소와 대타 승인
- 위치 기반 체크인
- 예상 급여 조회

이 여섯 가지가 닫히면 수기 운영을 대체할 최소 운영 루프가 성립한다.

## Build Order Summary
운영 루프를 먼저 증명하고, 인증과 PWA 게이트는 뒤에 붙인다.

1. 기본 DB 스키마와 `users / positions / member_positions` seed
2. 행사 템플릿과 행사 생성
3. 신청과 배정
4. 취소와 대타 승인
5. 체크인
6. 예상 급여 계산
7. Google Auth와 승인 흐름
8. 설치/푸시 온보딩 게이트

상세 phase와 테스트 범위는 [Execution Plan](./execution-plan.md)을 따른다.

## Open Decisions That May Bite Later
- 현재 리뷰 기준 미해결 필수 결정 없음

## GSTACK REVIEW REPORT

| Review | Trigger | Runs | Status | Findings |
|--------|---------|------|--------|----------|
| CEO Review | `/plan-ceo-review` | 0 | - | - |
| Codex Review | `/codex review` | 0 | - | - |
| Eng Review | `/plan-eng-review` | 1 | CLEAR | 19 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | 0 | - | - |
| DX Review | `/plan-devex-review` | 0 | - | - |

- Cross-model conclusion: users-centric v1, explicit DB invariants, schedule-based payroll preview, and operational loop first.
- Unresolved: `0`
- Verdict: ENG CLEARED
