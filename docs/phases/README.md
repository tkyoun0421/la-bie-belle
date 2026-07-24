# Phase 실행 계획

Phase는 MVP 기준안을 작은 수직 기능 단위로 나눈 제안 순서입니다. 각 task는 딥인터뷰에서 범위와 인수 조건을 승인받은 뒤 독립적으로 검증 가능한 실행 계약이 되며, `docs/phases/index.jsonl`이 현재 상태의 기준입니다.

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

이 순서는 인터뷰 출발점이며 자동 실행 순서가 아닙니다. 사용자는 우선순위와 범위를 딥인터뷰에서 바꿀 수 있고, 저장소 전체에서 `kind: task`인 `in_progress`는 최대 하나만 허용합니다.

## 상태 정의

- `proposed`: 기존 기준안 또는 새 아이디어. 인터뷰와 승인 전에는 실행할 수 없음.
- `planned`: 사용자 승인, 상세 인수 조건과 실행 계약이 기록된 구현 대기 작업.
- `in_progress`: 현재 구현 중. `kind: task` 레코드 중 최대 하나만 허용.
- `blocked`: 외부 결정 또는 선행 작업이 없어 진행할 수 없음.
- `done`: 인수 조건과 verification을 모두 통과.
- `skipped`: 범위 변경으로 수행하지 않으며 이유를 Phase 문서에 기록.

## task 승인과 완료 규칙

1. `proposed` task의 목표, 비목표, 경계 사례와 인수 조건을 사용자와 딥인터뷰한다.
2. 사용자가 승인하면 기준 문서를 정합화하고 `approved_by`, `approved_at`, `test_mode`, `check_ids`를 기록해 `planned`로 바꾼다.
3. `depends_on`이 모두 `done`인지 확인한다.
4. 사용자가 명시한 task ID만 `in_progress`로 바꾸고 Phase 문서의 범위 안에서 구현한다.
5. task에 적힌 verification과 관련 회귀 테스트를 실행한다.
6. 인수 조건을 충족한 증거에 관련 spec ID를 남기고 `done`으로 갱신한다.
7. 결과를 사용자에게 인계하고 다음 task를 자동 선택하지 않는다.

## 인덱스 파일

- [index.jsonl](index.jsonl): 한 줄에 하나의 phase 또는 task 객체.
- [index.schema.json](index.schema.json): 각 JSONL 객체의 JSON Schema.

JSONL은 AI가 전체 문서를 읽기 전에 인터뷰 후보와 승인된 현재 작업을 구분하고 관련 파일을 빠르게 찾는 용도입니다. `spec_refs`는 `PRD:AC-01`, `PRD:INV-ATT-01`, `DOMAIN:ATTENDANCE`, `ADR:0004`, `DOCS:SDD` 형식을 사용합니다. 상세 인수 조건은 연결된 Phase 문서, 요구사항 원문은 PRD·Domain·ADR과 문서 지도에서 확인합니다.

## 범위 변경

- 승인 전 범위·설계 변경: 딥인터뷰 결과를 기준 문서와 `proposed` task에 반영.
- 제품 동작 변경: PRD 수정.
- 보안·데이터·운영 결정 변경: 새 ADR 작성.
- 작업 순서 또는 세분화 변경: Phase 문서와 JSONL 수정.
- 시각 디자인 변경: [DESIGN](../DESIGN.md)을 먼저 수정하고 구현은 별도 task로 추가.
