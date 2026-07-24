# AI 작업 지침

이 저장소는 [기획 인터뷰, RADIO 개발 인터뷰와 자율 개발 트랙](docs/WORKFLOW.md)을 분리합니다. AI는 기획·개발 설계를 임의로 확정하지 않고, 사용자는 승인된 설계의 구현 세부 반복을 매번 지시하지 않습니다.

기존 `트랙 A: 딥인터뷰 설계`는 P0-T28 전환 기간에 아래 트랙 A1과 A2를 합쳐 가리킵니다.

## 트랙 A1: 기획 인터뷰

제품 관리, 프로젝트 계획, 제품·도메인·UX 설계, 범위 또는 제품 인수 조건을 결정하거나 재검토하는 요청은 이 트랙에서 시작합니다.

1. `README.md`, `docs/WORKFLOW.md`와 관련 기준 문서를 읽습니다.
2. 기존 문서와 `proposed` task를 정답이 아니라 인터뷰 출발점으로 취급합니다.
3. 한 번에 하나의 결정 주제를 깊게 다룹니다. 현재 이해, 사용자 답변, 충돌, 선택지와 트레이드오프, 미결 사항을 구분합니다.
4. 중요한 선택을 AI가 묵시적으로 확정하지 않습니다. 사용자의 명시적 승인 전에는 제품 코드 구현, task `in_progress` 전환, 개발 runner 실행을 하지 않습니다.
5. 승인 후에만 PRD → Domain → ADR → Architecture·Design → Phase 순서로 정합화합니다.
6. 승인된 task에 상세 제품 인수 조건, `spec_refs`와 `product_approval`을 기록하고 `design_pending`으로 개발 인터뷰에 인계합니다.

## 트랙 A2: RADIO 개발 인터뷰

기획 승인을 받은 `design_pending` task의 구현 구조와 기술 인수 조건은 이 트랙에서 결정합니다.

1. 승인된 기획 문서, `docs/DEVELOPMENT.md`, 관련 Architecture·ADR과 task 상세를 읽습니다.
2. Requirements, Architecture, Data model, Interface, Optimizations 순서로 공통 `DEV-*` 규칙의 적용 상태와 작업별 차이를 확인합니다.
3. 한 번에 기술 결정 하나만 질문하고 선택지, 추천 답변과 트레이드오프를 제공합니다.
4. 모든 task에 RADIO를 적용하되 문서·기계적 작업은 간결하게, 일반 기능은 관련 항목만, 보안·데이터·캐시·오프라인·동시성 등 위험 작업은 심화합니다.
5. 승인된 RADIO는 고정 경로 `docs/development/<task-id>-radio.md`에 revision과 함께 기록합니다. 여러 task에 영향을 주는 결정은 ADR로 승격합니다.
6. 정확한 RADIO 전체 파일 SHA-256과 revision이 있는 `development_approval`, `radio_ref`, `test_mode`, `check_ids`가 모두 기록된 뒤에만 task를 `planned`로 인계합니다.

## 트랙 B: 자율 개발 루프

명시적으로 승인된 단일 task를 구현하라는 요청은 이 트랙을 사용합니다.

1. `README.md`, `docs/PRD.md`의 MVP 범위·불변 규칙을 읽습니다.
2. `docs/DOMAIN.md`, `docs/ARCHITECTURE.md`, 관련 ADR과 `docs/DEVELOPMENT.md`를 읽습니다.
3. 사용자가 지정한 task의 의존성, 두 승인 기록, `radio_ref`, `spec_refs`, Phase 상세와 인수 조건을 확인합니다.
4. 정확히 하나의 승인된 task만 `in_progress`로 두고 `.agents/runs/<task-id>/radio.md`에는 승인된 RADIO의 적용 결과와 구현 중 차이만 기록합니다.
5. task의 `test_mode`에 따라 TDD 또는 등록 검증을 수행하고 기술적 실패는 하네스 한도 안에서 자동 반복합니다.
6. 범위·제품 동작 결정이 새로 필요하면 트랙 A1, 기술 설계 결정이 새로 필요하면 트랙 A2로 반환합니다. 실행 중에는 먼저 `blocked`로 안전 중단하고 결정 신호, 격리 작업물과 증거를 보존합니다.
7. 인수 조건과 검증을 모두 통과하고 관련 spec ID를 증거에 남긴 뒤에만 `done`으로 변경합니다.
8. 완료 결과를 사용자에게 인계한 뒤 다음 task를 자동 선택하지 않습니다.

## 작업 인덱스 규칙

- `docs/phases/index.jsonl`은 한 줄에 하나의 유효한 JSON 객체만 둡니다.
- `proposed`는 기획 인터뷰 대상이며 실행할 수 없습니다.
- `design_pending`은 기획 승인 후 RADIO 개발 설계를 기다리는 상태이며 실행할 수 없습니다.
- `planned`는 기획과 RADIO가 모두 승인되고 실행 계약이 기록된 구현 대기 상태입니다.
- 모든 task는 `approval_contract`를 명시합니다. 과거 종료 이력의 `legacy-v2`는 다시 실행할 수 없고 현재·신규 작업은 `dual-approval-v3`를 사용합니다.
- `dual-approval-v3` task를 `skipped`로 종료하려면 사용자, 날짜와 이유가 있는 `skip_approval`이 필요합니다.
- task ID, 의존성, 상태를 임의로 재사용하거나 삭제하지 않습니다.
- 모든 task는 하나 이상의 유효한 `spec_refs`를 가져야 합니다.
- 한 번에 `in_progress` task는 최대 하나입니다.
- 구현 중 새 작업이 발견되면 현재 task에 몰래 포함하지 않고 관련 인터뷰 트랙의 제안으로 기록합니다.
- `done` 작업의 인수 조건을 깨는 변경은 사용자와 회귀 범위를 합의해 새 task로 인계합니다.

## 제품 불변 규칙

- 출퇴근 원본 시각은 서버에서 생성하며 수정·삭제할 수 없습니다.
- 미달 인원은 경고하지만 스케줄 확정을 막지 않습니다.
- 교육생은 필요 인원에 포함하지 않습니다.
- 한 근무자의 복수 포지션은 각 포지션 필요 인원을 모두 충족합니다.
- 예상 급여는 예정 출퇴근 시간을 기준으로 하며 실제 급여 정산 기능이 아닙니다.
- 리허설은 근무자 자기기록이며 공식 출퇴근 인증으로 취급하지 않습니다.

## 구현 원칙

- MVP 밖 기능은 만들지 않습니다.
- 개인정보와 권한 검사는 UI뿐 아니라 데이터베이스 정책과 서버 경계에서도 강제합니다.
- 권한, 급여, 출퇴근, 계정 복구 변경에는 회귀 테스트를 추가합니다.
- 디자인 구현은 딥인터뷰에서 승인된 Design 범위만 따릅니다.
