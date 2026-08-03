# 라비에벨 근무 관리

라비에벨 웨딩홀의 근무 신청, 포지션 배정, 출퇴근 기록, 예상 급여를 관리하는 모바일 PWA입니다.

제품 범위와 구현 순서는 다음 문서에서 관리하며, 현재 구현 상태는 작업 인덱스를 기준으로 확인합니다.

- [문서 지도](docs/README.md)
- [5단계 개발 파이프라인 운영 계약](docs/workflow/WORKFLOW.md)
- [handoff 계약](docs/workflow/HANDOFF.md)
- [제품 요구사항](docs/product/PRD.md)
- [도메인 언어와 경계](docs/product/DOMAIN.md)
- [제품 디자인 시스템](docs/product/DESIGN.md)
- [시스템 아키텍처](docs/standards/ARCHITECTURE.md)
- [개발 컨벤션](docs/standards/DEVELOPMENT.md)
- [Architecture Decision Records](docs/standards/adr/README.md)
- [Phase 실행 계획](docs/execution/phases/README.md)
- [기계 판독용 작업 인덱스](docs/execution/phases/index.jsonl)

## 문서 구조

문서는 5레이어로 나뉘며 위 레이어가 아래 레이어를 지배합니다. 근거는 [ADR-0013](docs/standards/adr/0013-project-layer-structure.md)입니다.

| 레이어 | 위치 | 책임 |
| --- | --- | --- |
| L1 협업 | `CLAUDE.md`, `AGENTS.md`, `.claude/`, `docs/workflow/` | 작업 방식, 단계, 승인, handoff |
| L2 제품·도메인 | `docs/product/` | 무엇을 왜 만드는가 |
| L3 기술 기준 | `docs/standards/` | 공통 기술 기준과 되돌리기 어려운 결정 |
| L4 계획·실행 | `docs/execution/` | 무엇을 언제 하는가, 실행 상태와 증거 |
| L5 코드 | `src/`, `tests/` (미래) | 실제 구현과 테스트 |

## 협업 방식

모든 작업은 **기획 → 설계 → 개발 → 검증 → 리팩토링** 5단계를 순서대로 지납니다. 사용자는 기획 단계에서 무엇을 왜 만들지, 설계 단계에서 RADIO로 어떻게 만들지를 각각 승인합니다. 두 승인을 받은 단일 task만 개발·검증·리팩토링 단계로 넘어가며, AI는 다음 task를 자동 선택하거나 승인된 설계를 임의로 확장하지 않습니다.

단계 경계마다 [handoff](docs/workflow/HANDOFF.md)를 기록해 세션이 끊겨도 이어서 진행할 수 있게 합니다.

현재 미구현 제품 계획은 기획 단계에서 검토할 `proposed` 기준안입니다. 기획 승인 후 설계를 기다리는 task는 `design_pending`, 두 승인이 모두 끝난 실행 가능 task는 `planned`입니다.

## MVP 성공 기준

다음 달 스케줄 모집부터 기존 단체 채팅과 수기 배정표를 완전히 대체한다.

## 문서 책임과 충돌 처리

- 제품 동작, 범위, 불변 규칙, 제품 인수 조건은 PRD가 기준입니다.
- 공통 언어, 도메인 경계, aggregate 일관성 경계는 Domain 문서가 기준입니다.
- 되돌리기 어려운 기술·데이터·운영 결정은 승인된 ADR이 기준입니다.
- Architecture는 승인된 PRD, Domain, ADR을 구현 구조로 반영합니다.
- Development는 공통 `DEV-*` 컨벤션과 RADIO 작성 규칙의 기준입니다.
- task별 승인된 RADIO는 해당 구현의 기술 설계 기준입니다.
- Design은 승인된 제품 규칙을 화면 구조, 상호작용, 시각 토큰과 역할별 흐름으로 반영합니다.
- Phase 문서는 구현 범위와 상세 인수 조건, `index.jsonl`은 실행 상태·의존성·검증 항목을 관리합니다.

이 문서들은 [운영 계약](docs/workflow/WORKFLOW.md)에 따라 각 단계에서 승인된 범위만 신규 구현의 기준이 됩니다.

서로 다른 책임의 문서가 충돌하면 임의로 우선 적용하지 않습니다. 구현을 멈추고 PRD부터 Domain, ADR, Architecture, Development·RADIO, Phase, 작업 인덱스 순서로 정합하게 수정합니다.

## 실행 도구

기존 하네스는 구조 재편 과정에서 제거되었습니다. 5단계 파이프라인을 강제하는 새 실행 하네스와 명령은 P0-T31에서 다시 만듭니다. 그때까지 단계 순서와 승인 게이트는 문서 계약으로 지킵니다.
