# P0-T28 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-07-24
- 개발 설계 승인: user, 2026-07-24
- 관련 spec: `DOCS:SDD`, `DOCS:DDD`, `ADR:0008`, `ADR:0009`, `ADR:0011`
- 적용 깊이: 심화

## Requirements

### 범위와 비목표

- 기존 통합 인터뷰 스킬을 `la-bie-belle-product-interview`와 `la-bie-belle-development-interview`로 대체한다.
- 작업 인덱스, validator, runner, hook, dashboard와 self-test를 schema v3의 상태·이중 승인·RADIO 계약으로 원자적으로 전환한다.
- 전환 순서는 실패 테스트, v3 계약과 두 스킬 추가, 소비자 전환, 전체 회귀, 기존 통합 스킬 제거다. 완료 결과는 P0-T28 단일 commit으로 남긴다.
- P0-T28을 선택하는 기존 v2 runner의 부트스트랩을 위해 이 task에만 `approved_by`와 `approved_at`을 임시 병기한다. 새 공통 계약과 runner가 GREEN이 되면 완료 commit 전에 두 필드를 제거한다.
- 제품 기능, PostgreSQL, RLS, cache, offline, 외부 서비스와 새 production 의존성은 범위가 아니다.
- 완료된 task의 당시 승인 사실을 소급 생성하거나 과거 RADIO를 만들지 않는다.

### 불변 규칙

- `proposed`와 `design_pending`은 실행할 수 없다.
- `dual-approval-v3` task는 유효한 제품 승인과 개발 승인, 승인된 RADIO, 실행 계약과 완료된 의존성 없이는 실행할 수 없다.
- 개발 승인은 RADIO revision과 파일 전체의 정확한 UTF-8 바이트 SHA-256에 결속한다.
- 승인·상태·RADIO 파일은 validator, runner, hook 또는 dashboard가 자동 수정하지 않는다.
- 사용자 요청 없이 다음 task를 선택하거나 실행하지 않는다.
- `legacy-v2` task는 과거 `done` 또는 `skipped` 이력에만 허용하고 다시 실행 상태로 전환할 수 없다.

### 기술 인수 조건

- schema v3와 공통 계약 모듈이 상태별 필수 필드, 승인 무결성, 실행 가능성과 의존성을 같은 규칙으로 판정한다.
- 계약 위반은 안정적인 사유 코드와 모든 발견 원인을 반환하며 실행 경계에서는 오류 종료한다.
- 두 스킬은 공통 인터뷰 계약을 `docs/WORKFLOW.md`에서 참조하고 각자의 승인·문서 인계만 소유한다.
- 두 스킬은 매 차례 방금 확정한 내용, 주 질문 하나, 2~3개 선택지와 추천 답변을 제공한다. 충돌·가정은 있을 때 명시한다.
- 교차 트랙 판단은 결정 영역, 이유, 영향 문서·task, 확정 사항과 미결 질문이 있는 구조화된 결정 신호로 인계한다.
- `in_progress` 중 새 결정이 발견되면 실행 증거와 작업물을 보존하고 `blocked`로 안전 중단하며 commit·통합하지 않는다.
- 인터뷰 확인 후 제품 변경은 `proposed`, 기술 변경은 `design_pending`으로 선택적으로 반환하고 필요한 승인만 무효화한다.
- 공식 스킬 validator, 한국어 언어 가드와 등록된 모든 회귀 검사가 통과한 뒤에만 기존 통합 스킬을 제거한다.

### 위험 기반 테스트

- `test_mode`: `tdd`
- 첫 RED는 schema v3 상태 행렬, 이중 승인과 RADIO 해시 계약의 실패를 검증한다.
- `approval-workflow`: 상태 행렬, 선택적 승인 무효화, revision과 해시 일치·불일치를 검증한다.
- `skill-validators`: 두 스킬의 역할, 질문 하나, 추천 답변, 인계와 기존 스킬 제거를 검증한다.
- `index-schema`: 전체 v3 전환과 역사적 종료 기록을 검증한다.
- `runner-contract-refusal`: 실행 불가 상태, 승인 누락과 RADIO 무결성 실패를 검증한다.
- `dashboard-smoke`: 준비 상태와 모든 실행 차단 사유 표시를 검증한다.
- `localization-self-test`: 사용자 노출 메시지와 스킬 메타데이터의 한국어를 검증한다.
- `harness-regression`: hook, runner와 기존 하네스 계약을 회귀 검증한다.

### DEV-* 적용 상태

- `DEV-TEST-01`~`DEV-TEST-05`: 추가 결정 — 위 위험별 포트폴리오와 동일한 RED/GREEN 명령을 사용한다.
- `DEV-TIME-01`~`DEV-TIME-05`: 해당 없음 — repo 승인 메타데이터는 기존 `YYYY-MM-DD` 계약을 유지하며 업무 시각을 다루지 않는다.

## Architecture

### 책임과 경계

- `docs/WORKFLOW.md`가 공통 인터뷰 계약, 각 `SKILL.md`가 트랙별 절차의 정본이다. 스킬끼리 내부 호출하지 않고 다른 트랙이 필요하면 사용할 스킬과 결정 신호를 안내한다.
- `.agents/harness/scripts/lib/workflow-contract.mjs`가 상태, 승인, RADIO 무결성과 실행 가능성 판정의 단일 소유자다.
- index validator, runner, hook, dashboard와 self-test는 공통 모듈의 구조화된 판정 결과를 소비하고 같은 규칙을 재구현하지 않는다.
- 공통 모듈은 순수 판정과 안전한 RADIO 파일 검증을 제공한다. 소비자는 표시, 프로세스 종료 또는 승인된 상태 전이만 담당한다.

### 서버·보안 경계

- `radio_ref`는 해당 task ID의 `docs/development/<task-id>-radio.md`만 허용한다.
- 검증기는 해석된 경로가 `docs/development` 내부인지 확인하고 누락 파일, 디렉터리, 심볼릭 링크와 일반 파일이 아닌 대상을 거부한다.
- 해시는 Node 표준 `crypto`로 파일 전체 바이트를 읽어 계산한다. 정규화하거나 일부 Markdown만 추출하지 않는다.
- 예상 가능한 계약 실패는 안정적인 코드와 안전한 한국어 설명으로 반환하고 stack trace나 불필요한 로컬 경로는 사용자 메시지에 노출하지 않는다.

### Clean Code·SOLID·재사용

- 계약 판정은 공통 모듈 한 곳에서 소유하되 소비자별 UI·CLI 책임까지 추상화하지 않는다.
- 기존 harness 경계를 유지하며 이름뿐인 repository, service 또는 새 계층을 만들지 않는다.

### DEV-* 적용 상태

- `DEV-ARCH-01`~`DEV-ARCH-04`: 해당 없음 — 애플리케이션 FSD 구조를 변경하지 않는다.
- `DEV-ARCH-05`: 기본 적용.
- `DEV-SSOT-01`~`DEV-SSOT-05`: 추가 결정 — 공통 계약 모듈과 문서별 소유권을 위와 같이 고정한다.
- `DEV-SEC-01`~`DEV-SEC-05`: 추가 결정 — 승인·실행 경계는 UI 표시가 아니라 공통 검증과 runner에서 fail-closed로 강제한다.
- `DEV-CODE-01`~`DEV-CODE-06`: 기본 적용.
- `DEV-REUSE-01`~`DEV-REUSE-05`: 추가 결정 — 상태·승인 판정만 즉시 공통화하고 소비자 표현은 지역 책임으로 유지한다.

## Data model

### 정본과 파생 데이터

- `docs/phases/index.jsonl`은 task 상태와 승인 참조의 정본이다.
- `docs/development/<task-id>-radio.md`는 현재 task 개발 설계의 단일 정본이며 `revision`과 `Draft | Approved` 상태를 가진다.
- `development_approval.radio_sha256`은 Approved RADIO의 정확한 바이트에서 만든 파생값이다. 해시는 RADIO 내부에 기록하지 않는다.
- 이전 revision은 별도 복사하지 않고 Git 이력으로 보존한다.

### schema v3

- 모든 index 항목은 `schema_version: 3`으로 전환한다.
- 모든 task는 `approval_contract: "legacy-v2" | "dual-approval-v3"`를 가진다.
- 전환 전 runner가 P0-T28을 한 번 선택하기 위한 임시 legacy 승인 필드는 승인 우회가 아니라 부트스트랩 호환 정보이며 최종 v3 index에는 남기지 않는다.
- `legacy-v2`는 전환 시점에 이미 `done` 또는 `skipped`인 task에만 허용한다.
- `dual-approval-v3`의 `proposed`는 승인되지 않은 기획 상태다.
- `design_pending`은 `product_approval`을 요구하고 개발 승인 전에는 실행할 수 없다. draft `radio_ref`는 가질 수 있다.
- `planned`, `in_progress`, `blocked`, `verification_pending`, `done`은 `product_approval`, `development_approval`, `radio_ref`, `test_mode`, `check_ids`를 요구한다.
- `development_approval`은 `by`, `at`, `radio_revision`, `radio_sha256`을 가진다.
- `dual-approval-v3`의 `skipped`는 `skip_approval: { by, at, reason }`을 요구하며 제품·개발 승인과 RADIO는 요구하지 않는다. 기존 승인 기록이 있다면 이력으로 보존할 수 있다.
- `skipped` task는 `done` 의존성을 충족하지 않으므로 이를 의존하는 task는 실행할 수 없다.

### 상태 변경과 승인 무효화

- 제품 동작·범위가 바뀌면 `proposed`로 반환하고 제품·개발 승인을 무효화한다.
- 기술 설계만 바뀌면 제품 승인을 유지하고 `design_pending`으로 반환해 개발 승인과 승인 해시를 무효화한다.
- 실행 중 발견된 결정은 먼저 `blocked`로 두고 `.agents/runs/<task-id>/decision-signal.json`과 기존 실행 증거를 보존한다. 인터뷰가 결정 영역을 확인하기 전에는 승인을 자동 변경하지 않는다.
- 재설계할 때 고정 RADIO 경로에서 revision을 증가시키고 `Draft`로 표시한다. 재승인된 정확한 파일에 새 해시를 기록한다.

### 복구와 동시성

- 승인 파일 변경과 index 해시 갱신은 같은 task commit에 포함한다.
- 해시 불일치나 부분 변경은 실행 거부로 복구하며 도구가 새 해시를 자동 승인하지 않는다.
- blocked worktree와 diff는 보존한다. 재승인 후 새 계약을 다시 검증하고 호환되는 작업만 재사용한다.
- 충돌하거나 새 범위를 벗어난 미완성 변경은 자동 삭제하지 않고 사용자 결정을 요청한다.

### DEV-* 적용 상태

- `DEV-DATA-01`~`DEV-DATA-03`: 추가 결정 — 문서·index·공통 계약 모듈의 정본과 방어 경계를 위와 같이 둔다.
- `DEV-DATA-04`~`DEV-DATA-05`: 해당 없음 — PostgreSQL 불변 규칙이나 다중 DB command가 없다.
- `DEV-MIG-01`~`DEV-MIG-05`: 해당 없음 — DB migration이 아니다. index v3 변환은 단일 task에서 검증 후 원자적으로 반영한다.

## Interface

### 입력·Result

- 공통 계약 모듈은 단일 boolean 대신 `ok`, 안정적인 사유 코드와 세부 원인 목록을 반환한다.
- 사유 코드는 최소한 schema·상태, 제품 승인, 개발 승인, 실행 계약, RADIO 참조·경로·파일·해시, 의존성과 다중 `in_progress` 범주를 구분한다.
- validator, runner와 hook은 하나 이상의 차단 사유가 있으면 오류 종료하고 가능한 원인을 모두 출력한다.
- dashboard는 같은 판정 결과를 한국어로 표시하며 실행 가능성을 독자적으로 추론하지 않는다.

### 인터뷰·결정 신호

- 인터뷰 답변은 `확정 반영`을 먼저 보여주고 충돌·가정이 있을 때만 별도로 표시한다.
- 한 차례에 주 질문 하나와 2~3개 선택지, 구체적인 추천 답변·이유·핵심 트레이드오프를 제공한다.
- 결정 신호는 `task_id`, `decision_area`, `reason`, `affected_refs`, `confirmed`, `unresolved`, `detected_at`을 기록한다.

### cache·offline·외부 계약

- cache와 offline은 해당 없음이다.
- 외부 서비스와 네트워크 호출을 추가하지 않는다.

### DEV-* 적용 상태

- `DEV-ERR-01`~`DEV-ERR-03`: 추가 결정 — 예상 가능한 계약 실패를 구조화하고 예상하지 못한 결함만 예외로 처리한다.
- `DEV-ERR-04`~`DEV-ERR-06`: 해당 없음 — 업무 mutation, 자동 재시도와 다중 데이터 command가 없다.
- `DEV-CACHE-01`~`DEV-CACHE-06`: 해당 없음.
- `DEV-OFFLINE-01`~`DEV-OFFLINE-04`: 해당 없음.

## Optimizations

### 기본값 유지

- 측정된 병목이나 승인된 규모 제약이 없으므로 성능 최적화를 추가하지 않는다.
- 상태·승인 판정의 중복만 정확성과 유지보수를 위해 제거한다.

### 관측성

- validator, runner와 hook은 구조화된 사유 코드와 한국어 설명을 제공한다.
- dashboard는 실행 가능 여부와 모든 차단 원인을 표시한다.
- 외부 관측 도구, telemetry와 새 로그 저장소는 추가하지 않는다.

### 의존성과 되돌림

- Node 표준 모듈과 기존 harness만 사용하고 새 production·development 의존성을 추가하지 않는다.
- 전환 중에는 기존 통합 스킬을 유지한다. 새 스킬과 전체 검증이 통과한 뒤 제거하며, 실패하면 제거 전 상태에서 수정한다.
- 완료 후 되돌릴 때는 P0-T28 단일 commit을 기준으로 roll-forward 수정하고 승인 이력이나 사용자 작업물을 자동 삭제하지 않는다.

### DEV-* 적용 상태

- `DEV-OBS-01`~`DEV-OBS-03`: 추가 결정 — 로컬 계약 실패의 구조화된 사유와 안전한 출력을 위와 같이 적용한다.
- `DEV-OBS-04`~`DEV-OBS-05`: 해당 없음.
- `DEV-OPT-01`~`DEV-OPT-05`: 기본 적용 — 최적화하지 않는 선택을 유지한다.
- `DEV-DEP-01`~`DEV-DEP-05`: 기본 적용 — 새 의존성은 없다.

## 미결 사항

없음.
