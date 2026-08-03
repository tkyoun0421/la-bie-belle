# Phase 실행 계획

Phase는 MVP 기준안을 작은 수직 기능 단위로 나눈 제안 순서입니다. 각 task는 기획 단계와 설계 단계에서 두 번 승인받은 뒤 독립적으로 검증 가능한 실행 계약이 되며, `docs/execution/phases/index.jsonl`이 현재 상태의 기준입니다.

## 실행 순서

| Phase | 목표 | 선행 Phase |
| --- | --- | --- |
| [P0](00-foundation.md) | 프로젝트 기반과 품질 게이트 | 없음 |
| [P1](01-identity-and-staff.md) | 인증, 승인, 역할, 근무자 관리 | P0 |
| [P2](02-recruitment.md) | 모집 일괄 생성과 다중 신청 | P1 |
| [P3](03-assignment-and-confirmation.md) | 예식, 포지션 배정, 확정 | P2 |
| [P4](04-changes-and-notifications.md) | 변경 요청과 PWA 푸시 | P3 |
| [P5](05-attendance.md) | GPS·QR 출퇴근과 팀장 출결 | P4 |
| [P6](06-estimated-pay-and-rehearsal.md) | 예상 급여와 리허설 | P3, P4 권장 |
| [P7](07-pilot-and-launch.md) | 탈퇴 복구, 운영 검증, 출시 | P4, P5, P6 |

이 순서는 인터뷰 출발점이며 자동 실행 순서가 아닙니다. 사용자는 우선순위와 범위를 인터뷰에서 바꿀 수 있고, 저장소 전체에서 `kind: task`인 `in_progress`는 최대 하나만 허용합니다.

## 상태 정의

- `proposed`: 기존 기준안 또는 새 아이디어. 기획 승인 전에는 실행할 수 없음.
- `design_pending`: 기획은 승인됐지만 task별 RADIO 개발 설계가 승인되지 않아 실행할 수 없음.
- `planned`: 기획과 RADIO가 모두 승인되고 상세 인수 조건과 실행 계약이 기록된 구현 대기 작업.
- `in_progress`: 현재 구현 중. `kind: task` 레코드 중 최대 하나만 허용.
- `blocked`: 실행 중 새 결정이나 외부 조건이 발견되어 작업물과 증거를 보존한 채 안전 중단됨.
- `done`: 인수 조건과 verification을 모두 통과.
- `skipped`: 범위 변경으로 수행하지 않으며 `skip_approval`에 사용자, 날짜와 이유를 기록.

## task 승인과 완료 규칙

1. `proposed` task의 목표, 비목표, 경계 사례와 제품 인수 조건을 기획 단계에서 인터뷰한다.
2. 사용자가 승인하면 기준 문서를 정합화하고 `product_approval`을 기록해 `design_pending`으로 바꾼다.
3. 설계 단계에서 `docs/execution/radio/<task-id>-radio.md`를 작성하고 Requirements, Architecture, Data model, Interface, Optimizations를 승인한다.
4. `development_approval`에 승인된 RADIO revision과 정확한 전체 파일 SHA-256을 기록하고 `radio_ref`, `test_mode`, `check_ids`를 더해 `planned`로 바꾼다.
5. `depends_on`이 모두 `done`인지 확인한다.
6. 사용자가 명시한 task ID만 `in_progress`로 바꾸고 승인된 범위와 RADIO 안에서 구현한다.
7. task에 적힌 verification과 관련 회귀 테스트를 실행한다.
8. 인수 조건을 충족한 증거에 관련 spec ID를 남기고 `done`으로 갱신한다.
9. 결과를 사용자에게 인계하고 다음 task를 자동 선택하지 않는다.

모든 task는 `approval_contract`를 명시한다. 전환 전에 종료된 이력만 `legacy-v2`이며 실행 상태로 돌아갈 수 없다. 현재 미완료와 신규 task는 `dual-approval-v3`를 사용한다. 실행 중 새 결정은 먼저 `blocked`와 구조화된 결정 신호로 보존하고, 인터뷰 확인 후 제품 변경은 `proposed`, 기술 변경은 `design_pending`으로 선택적으로 반환한다.

## 인덱스 파일

- [index.jsonl](index.jsonl): 한 줄에 하나의 schema v3 phase 또는 task 객체.
- [index.schema.json](index.schema.json): 각 JSONL 객체의 JSON Schema.

JSONL은 AI가 전체 문서를 읽기 전에 인터뷰 후보와 승인된 현재 작업을 구분하고 관련 파일을 빠르게 찾는 용도입니다. `spec_refs`는 `PRD:AC-01`, `PRD:INV-ATT-01`, `DOMAIN:ATTENDANCE`, `ADR:0004`, `DOCS:SDD` 형식을 사용합니다. 상세 인수 조건은 연결된 Phase 문서, 요구사항 원문은 PRD·Domain·ADR과 문서 지도에서 확인합니다.

## 범위 변경

- 기획 승인 전 범위 변경: 기획 단계 결과를 기준 문서와 `proposed` task에 반영.
- 개발 설계 변경: 설계 단계 결과를 RADIO와 `design_pending` task에 반영.
- 제품 동작 변경: PRD 수정.
- 보안·데이터·운영 결정 변경: 새 ADR 작성.
- 작업 순서 또는 세분화 변경: Phase 문서와 JSONL 수정.
- 시각 디자인 변경: [DESIGN](../../product/DESIGN.md)을 먼저 수정하고 구현은 별도 task로 추가.
