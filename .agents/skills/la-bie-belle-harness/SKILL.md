---
name: la-bie-belle-harness
description: 명시적으로 지정되고 사용자가 승인한 라비에벨 작업 하나에 자율 개발 루프를 실행한다. 딥인터뷰 트랙이 설계 인계를 완료한 추적 작업을 구현, 수정, 검토 또는 검증할 때 사용하며 승인, 의존성, 작업 범위, RADIO, TDD 또는 등록 검증, 제한된 재시도, 증거, 민감 변경 확인과 작업 단위 커밋을 강제한다.
---

# 라비에벨 자율 개발 루프

승인된 구현에는 이 스킬을 사용한다. 제품, 프로젝트 또는 개발 설계가 아직 미결이면 `$la-bie-belle-deep-interview`를 사용한다.

## 인계 계약 검증

1. `AGENTS.md`, `docs/WORKFLOW.md`, `README.md`, `docs/PRD.md`, `docs/DOMAIN.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, 관련 ADR과 `docs/phases/index.jsonl`을 읽는다.
2. 명시적으로 지정된 작업을 요구한다. 다음 작업을 자동 선택하지 않는다.
3. 작업이 `planned` 또는 재개할 수 있는 `in_progress`이고, `approved_by: "user"`와 `approved_at`이 있으며, 의존성이 완료됐고, `spec_refs`, 상세 인수 조건, `test_mode`, 등록된 `check_ids`가 있는지 확인한다.
4. `proposed` 작업은 거부하고 누락된 제품·설계 결정을 딥인터뷰 트랙으로 돌려보낸다.
5. 정확히 한 작업만 `in_progress`로 유지한다.

## 자율 실행

1. 구현 전에 `.agents/runs/<task-id>/radio.md`를 만들고 `## Requirements`, `## Architecture`, `## Data model`, `## Interface`, `## Optimizations` 제목을 기록한다.
2. 작업의 `test_mode`를 따른다.
   - `tdd`: `node .agents/harness/scripts/tdd-guard.mjs red <task-id> -- <command>`로 assertion 실패를 기록하고 같은 명령을 `green`으로 실행한다. 커밋 전에 `tdd-guard.mjs check <task-id>`를 통과한다.
   - `verification` 또는 `docs_only`: `pnpm harness:verify-task <task-id>`로 등록된 모든 검사를 실행한다.
3. 승인된 범위만 구현하고 저장소 불변 규칙을 보존한다.
4. 기술적 실패를 진단하고 시도 중인 작업을 보존하며 `.agents/harness/config.json`의 한도 안에서 재시도한다.
5. 모든 `spec_ref`와 함께 `.agents/runs/<task-id>/verification.json`을 기록한다.

일반적인 구현 선택은 사용자에게 반복해서 묻지 않고 계속 진행한다. 다음 상황에서는 멈추고 `$la-bie-belle-deep-interview`에 구조화된 결정 신호를 반환한다.

- 기준 문서가 서로 충돌한다.
- 인수 조건을 만족하려면 제품, 범위, 권한, 데이터 수명주기, 아키텍처 또는 UX 결정이 필요하다.
- 완료하려면 다른 작업 또는 승인되지 않은 의존성이 필요하다.
- 되돌릴 수 없는 외부 작업에 새 권한이 필요하다.

결정 신호에는 필요한 결정, 이 작업에서 정할 수 없는 이유, 영향받는 spec과 가능한 선택지를 포함한다.

## 완료 및 인계

1. 권한, 개인정보, 예상 급여, 출퇴근, 계정 복구 또는 별도로 지정된 민감 변경은 RADIO, 검증 결과와 diff를 사용자에게 보여주고 확인받은 뒤 `done` 전환과 커밋을 수행한다.
2. 인수 조건과 검사가 모두 통과한 뒤에만 작업을 `done`으로 표시한다.
3. 작업 변경만 커밋하고 제목에 작업 ID를 포함한다. `--no-verify`를 사용하지 않는다.
4. 결과를 보고하고 멈춘다. 다음 작업을 선택하거나 시작하지 않는다.

## 가드레일

- `docs/DEVELOPMENT.md`와 ADR-0008의 FSD 및 server-first 규칙을 지킨다.
- `docs/WORKFLOW.md`와 ADR-0009의 투트랙 경계를 지킨다.
- Codex hook과 Git hook이 작업, TDD, 위험 명령, 검증과 커밋 규칙을 강제한다.
