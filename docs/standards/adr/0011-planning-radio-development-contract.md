# ADR-0011: 기획 승인, RADIO 개발 설계와 개발 컨벤션 계약

- 상태: Accepted
- 날짜: 2026-07-24
- 부분 대체: [ADR-0008](0008-fsd-server-first-development-guards.md), [ADR-0009](0009-two-track-interview-and-engineering-loop.md)

## Context

기존 투트랙 구조는 제품·프로젝트 설계와 개발 설계를 하나의 딥인터뷰에 포함하고 RADIO를 task 실행 후 기록했다. 이 방식은 무엇을 만들지와 어떻게 만들지의 승인 경계를 흐리고, 보안·캐시·오프라인·SSOT·Clean Code·SOLID·재사용 같은 공통 기술 원칙을 매 task에서 반복하거나 구현자 판단으로 남길 수 있다.

## Decision

- 설계를 기획 인터뷰와 RADIO 개발 인터뷰로 분리하고 그 뒤에 자율 개발을 둔다.
- 기획 인터뷰는 제품·프로젝트·도메인·UX와 제품 인수 조건을 승인한다.
- 개발 인터뷰는 Requirements, Architecture, Data model, Interface, Optimizations를 사용해 task별 기술 설계를 승인한다.
- 기존 통합 스킬을 `la-bie-belle-product-interview`와 `la-bie-belle-development-interview`로 대체한다. P0-T28 완료 전에는 기존 스킬을 전환용으로 유지한다.
- 공통 개발 원칙은 `docs/standards/DEVELOPMENT.md`의 안정적인 `DEV-*` ID가 소유한다. 규칙은 `MUST`, `SHOULD`, `MAY`로 구분한다.
- RADIO는 공통 규칙을 반복하지 않고 `기본 적용`, `해당 없음`, `추가 결정`, `예외` 상태와 작업별 차이만 기록한다.
- 승인된 RADIO 정본은 `docs/execution/radio/<task-id>-radio.md`, 실행 결과는 `docs/execution/runs/<task-id>/radio.md`가 소유한다.
- 모든 task에 RADIO를 적용하되 작업 위험에 따라 간결·일반·심화 깊이를 사용한다.
- task 상태는 `proposed → design_pending → planned → in_progress → done`으로 전환한다.
- `design_pending`은 `product_approval`, `planned`는 `development_approval`, `radio_ref`와 실행 계약을 추가로 요구한다.
- 작업 인덱스는 schema v3로 원자적으로 전환한다. 모든 task는 `approval_contract`를 가지며 과거 종료 이력만 `legacy-v2`, 현재 미완료와 신규 작업은 `dual-approval-v3`를 사용한다.
- 개발 승인은 고정 경로 RADIO의 revision과 정확한 전체 UTF-8 바이트 SHA-256에 결속한다. 경로 이탈, 심볼릭 링크, 누락 또는 해시 불일치는 실행을 차단한다.
- 상태, 승인, RADIO 무결성과 실행 가능성은 하나의 공통 순수 계약 모듈이 판정하고 validator, runner, hook, dashboard와 self-test가 같은 구조화된 사유 코드를 소비한다.
- 제품 범위 변경은 제품·개발 승인을 무효화해 `proposed`, 기술 설계 변경은 제품 승인을 보존하고 개발 승인을 무효화해 `design_pending`으로 반환한다.
- 실행 중 새 결정은 먼저 `blocked`로 안전 중단하고 구조화된 결정 신호, 격리 작업물과 실행 증거를 보존한다. 인터뷰 확인 전에는 승인을 자동 변경하거나 작업물을 폐기하지 않는다.
- `dual-approval-v3` task를 `skipped`로 종료하려면 사용자, 날짜와 이유가 있는 `skip_approval`을 기록한다.
- 완료 task는 소급 변경하지 않는다. 기획만 승인된 `P1-T06`과 `P7-T01`은 제품 승인 기록을 보존해 `design_pending`으로 전환한다.

## 공통 기술 기준

- 관심사별 단일 정본과 파생 관계를 사용한다.
- 모든 작업에 최소 보안 검토를 적용하고 민감 작업은 위협·완화책·회귀 테스트를 심화한다.
- public 조회는 설계된 TTL·무효화 cache를 사용하고 private 데이터는 공유·영속 cache를 금지한다. 필요한 private 상호작용은 현재 세션 메모리에서만 허용한다.
- 오프라인 영속 cache는 앱 셸과 public 리소스로 제한하고 private 데이터·폼·mutation queue를 저장하지 않는다.
- Clean Code·SOLID는 책임, 응집도, 의존 방향과 테스트 가능성의 결과로 적용하고 불필요한 계층을 만들지 않는다.
- 도메인·보안·금액·시간 규칙은 처음부터 단일 소유하고 UI·일반 코드는 실제 동일한 변경 이유가 확인될 때 공통화한다.
- 업무 실패는 typed Result, 시스템 실패는 관측 가능한 서버 예외로 분리한다.
- 테스트는 인수 조건별 위험과 가장 낮은 비용으로 신뢰 가능한 검증 계층을 기준으로 배치한다.
- 정본은 하나로 유지하되 UI·서버·DB가 각 신뢰 경계에서 방어적으로 강제한다.
- 관측성, 최적화, 외부 의존성, migration과 시간 규칙은 `DEV-OBS-*`, `DEV-OPT-*`, `DEV-DEP-*`, `DEV-MIG-*`, `DEV-TIME-*`를 따른다.

## Consequences

- 개발 시작 전 사용자 승인 단계가 하나 늘지만 구현자가 중요한 기술 결정을 묵시적으로 내리는 위험이 줄어든다.
- 단순 task는 간결 RADIO로 처리해 반복 비용을 제한한다.
- task index, dashboard, runner, hooks, validators와 repository-local skills가 새 상태와 두 승인 계약을 지원해야 한다.
- 승인 계약 위반은 자동 복구하지 않고 모든 발견 원인을 안전한 한국어 설명과 함께 fail-closed로 보고한다.
- 과거 종료 task에는 명시적인 legacy 표식이 남지만 실행 경로는 `dual-approval-v3` 하나만 처리한다.
- P0-T28 자체의 최초 실행만 기존 v2 runner가 요구하는 승인 필드를 임시 병기하고, 새 runner 전환이 검증되면 완료 commit 전에 제거한다.
- P0-T28이 이 전환을 구현하고 검증한다.
- 제품 기능, 새 cache·관측 도구 도입과 완료 task 재작성은 이 결정의 범위가 아니다.
