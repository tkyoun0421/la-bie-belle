# 문서 지도

문서는 5레이어 구조를 따릅니다. 위 레이어가 아래 레이어를 지배하며, 충돌하면 위 레이어가 기준입니다. 구조의 근거는 [ADR-0013](standards/adr/0013-project-layer-structure.md)입니다.

| 레이어 | 디렉터리 | 책임 |
| --- | --- | --- |
| L1 협업 | [`workflow/`](workflow/WORKFLOW.md) (+ 루트 `CLAUDE.md`, `.claude/`) | 작업 방식, 단계 경계, 승인 규칙, handoff |
| L2 제품·도메인 | [`product/`](product/PRD.md) | 무엇을 왜 만드는가 |
| L3 기술 기준 | [`standards/`](standards/ARCHITECTURE.md) | 어떻게 만드는가의 공통 기준과 되돌리기 어려운 결정 |
| L4 계획·실행 | [`execution/`](execution/phases/README.md) | 무엇을 언제 하는가, 실행 상태와 증거 |
| L5 코드 | `src/`, `tests/` (미래) | 실제 구현과 테스트 |

## 문서별 책임

| 문서 | 레이어 | 책임 | 포함하지 않는 내용 |
| --- | --- | --- | --- |
| [운영 계약](workflow/WORKFLOW.md) | L1 | 기획·설계·개발·검증·리팩토링 5단계, 승인 게이트, 반환 규칙 | 제품 요구사항 원문 |
| [handoff 계약](workflow/HANDOFF.md) | L1 | 단계 경계 인계 기록의 공통 포맷과 위치 | 승인 기록 정본 |
| [PRD](product/PRD.md) | L2 | 사용자, 범위, 요구사항, 비즈니스 규칙 | 기술 구현 세부사항 |
| [Domain](product/DOMAIN.md) | L2 | 공통 언어, 논리적 도메인 경계, aggregate와 domain event | 배포 구조와 서비스 분리 |
| [Design](product/DESIGN.md) | L2 | 시각 기반, 상호작용 패턴, 컴포넌트, 역할별 화면 흐름 | 제품 동작과 서버 권한 규칙 |
| [Architecture](standards/ARCHITECTURE.md) | L3 | 시스템 경계, 데이터 모델, 보안, 배포 | 제품 우선순위 |
| [개발 컨벤션](standards/DEVELOPMENT.md) | L3 | `DEV-*` 컨벤션, FSD, server-first, RADIO와 task 검증 규칙 | 제품 요구사항 원문 |
| [ADR](standards/adr/README.md) | L3 | 중요한 기술·도메인 결정과 근거 | 작업 체크리스트 |
| [Phase 계획](execution/phases/README.md) | L4 | 구현 순서, task 상세 범위와 인수 조건 | 요구사항 원문 반복 |
| [작업 인덱스](execution/phases/index.jsonl) | L4 | AI와 도구가 읽는 상태, 의존성, spec 참조, 검증 항목 | 상세 인수 조건 |
| [task별 개발 설계](execution/radio/README.md) | L4 | 승인된 RADIO 정본과 작성 형식 | 공통 컨벤션 원문 |
| `execution/runs/` | L4 | 실행 증거와 단계별 handoff 기록 | 승인 기록 정본 |

## Spec-driven development (`DOCS:SDD`)

1. 사용자와 기획 단계 인터뷰로 문제, 제약, 선택지와 완료 모습을 확인합니다.
2. 사용자가 승인한 제품 동작만 PRD의 불변 규칙 또는 제품 인수 조건에 반영합니다.
3. 용어나 업무 경계가 바뀌면 Domain, 되돌리기 어려운 결정이면 ADR을 함께 수정합니다.
4. Architecture와 Design을 승인된 결정에 맞추고 Phase task의 상세 범위와 인수 조건을 작성합니다.
5. 기획 승인 task를 `design_pending`으로 두고 설계 단계에서 task별 RADIO를 승인합니다.
6. `product_approval`, `development_approval`, `radio_ref`, `spec_refs`와 실행 계약을 연결한 뒤 `planned`로 인계합니다.
7. 구현과 회귀 테스트는 관련 spec ID를 테스트 이름, 주석 또는 검증 증거에 남깁니다.

PRD의 `INV-*`, `AC-*` ID는 한번 사용하면 의미를 바꾸거나 재사용하지 않습니다. 요구가 폐기되면 삭제해 번호를 재사용하지 않고 폐기 사실과 대체 ID를 기록합니다.

`spec_refs`는 요구사항 원문을 복사하는 필드가 아닙니다. task가 충족하거나 보존해야 하는 PRD spec, Domain 경계, ADR을 가리키는 추적 링크입니다.

## Domain-driven development (`DOCS:DDD`)

- 제품과 코드에서 [Domain 문서](product/DOMAIN.md)의 공통 언어를 사용합니다.
- 도메인 경계는 모듈과 트랜잭션 책임을 나누지만 배포 단위는 나누지 않습니다.
- aggregate를 넘는 변경은 명시적 command에서 현재 상태를 다시 검사합니다.
- domain event는 실제 후속 처리나 감사가 필요한 사건만 영속화합니다.
- repository, service, event bus 같은 패턴은 이름 자체가 아니라 인수 조건에 필요할 때만 도입합니다.

## 변경 규칙

- 사용자 요구가 바뀌면 PRD를 먼저 수정합니다.
- 공통 언어, aggregate, context 의존성이 바뀌면 Domain 문서를 수정합니다.
- 되돌리기 어려운 기술 또는 도메인 결정은 ADR을 추가하거나 대체합니다.
- 구현 순서나 작업 분해만 바뀌면 Phase 문서와 `index.jsonl`을 수정합니다.
- Architecture는 승인된 PRD, Domain, ADR의 현재 결과를 반영합니다.
- Design은 승인된 제품 규칙을 사용자 경험으로 번역하며 세부 문서는 [`product/design/`](product/design/)에서 관리합니다.
- 작업 방식·단계·승인 규칙이 바뀌면 `workflow/`를 수정하고 근거를 ADR로 남깁니다.

## MVP 이후 보류 항목

- 자동 배정 및 추천
- 사고 이력
- 실제 급여 정산 및 명세서
- 문자·카카오톡 알림
- 다중 지점·다중 홀
- 시간대별 포지션 변경
- 데스크톱 전용 UI

이 항목은 별도 승인 없이 현재 Phase에 추가하지 않습니다.
