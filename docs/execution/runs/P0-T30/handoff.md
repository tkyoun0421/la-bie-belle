# P0-T30 handoff

## 2026-08-03 · 개발 종료

- 작업 식별자: P0-T30 (프로젝트 5레이어 구조 재편)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-03

### 확정된 사실

- 사용자가 2026-08-03 그릴 인터뷰에서 5레이어 구조, 5단계 파이프라인, 공통 handoff, P0-T29 반환, ADR-0013 + P0-T30 + P0-T31 절차를 승인했다(제품 승인·개발 승인 모두 user, 2026-08-03).
- 문서를 4개 레이어 디렉터리로 옮겼다. `docs/workflow/`(L1), `docs/product/`(L2), `docs/standards/`(L3), `docs/execution/`(L4). `src/`, `tests/`(L5)는 만들지 않았다.
- 추적 파일은 `git mv`, 미추적 파일(`0012-static-operations-dashboard.md`, `P0-T29-radio.md`)은 일반 `mv`로 옮겨 이력을 보존했다.
- `docs/standards/adr/0013-project-layer-structure.md`를 Accepted로 작성했다. 5레이어 정의·변경 절차, 5단계 파이프라인과 상태 매핑, handoff 원칙, 루트 고정 파일의 논리적 L1 소속을 포함한다.
- `docs/workflow/WORKFLOW.md`를 5단계 파이프라인으로 재작성했다. 공통 인터뷰 계약 7항, 상태·승인 계약, `dual-approval-v3` 의미론, 반환·중단 규칙은 그대로 보존했다. 트랙 A1·A2·B 명칭은 폐기했고 P0-T28 전환은 완료로 정리했다.
- `docs/workflow/HANDOFF.md`를 신설했다. 최소 7개 필드(작업 식별자, 현재 단계, 확정된 사실, 미결 사항, 다음 행동, 증거·산출물 경로, 기준 시각), 기록 시점 표와 템플릿을 정의했다. 이 파일이 그 포맷의 첫 실사용 예시다.
- `index.jsonl`의 모든 `doc`은 `docs/execution/phases/`, `radio_ref`는 `docs/execution/radio/`를 가리킨다. `index.schema.json`의 두 경로 패턴도 함께 바꿨다.
- P0-T29는 `design_pending`으로 반환했다. 제품 승인(user, 2026-07-24)과 `spec_refs`는 보존하고 `development_approval`·`radio_ref`·`check_ids`를 제거했다. `P0-T29-radio.md` 본문 상태는 `Superseded(구조 재편으로 재설계 필요)`로 표기했다.
- ADR-0012는 `보류(구조 재편 후 재검토)`로 바꾸고 `adr/README.md` 표와 상태 정의에 반영했다. `ARCHITECTURE.md`의 운영 대시보드 절도 보류로 표시했다.
- P0-T30을 `in_progress`, P0-T31을 `proposed`로 등록했다. P0-T30의 `development_approval.radio_sha256`은 `ecb826a448f66cfaf90928e651b21fa61af56cee44a9d01392d0dca60fcaf608`이며 실제 파일 해시와 일치한다.
- `package.json`의 깨진 `harness:*` 스크립트 8개를 제거했다. 새 실행 명령은 P0-T31에서 정의한다.
- 루트 `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/README.md`에 5레이어 요약과 5단계 파이프라인 요약을 반영했다.
- 다음 옛 경로 참조는 **의도적으로 남겼다**.
  - `docs/execution/radio/P0-T28-radio.md`: 완료 task의 승인 SHA-256에 결속되어 본문을 수정할 수 없다. 역사 기록으로 보존한다.
  - `docs/execution/phases/00-foundation.md`의 P0-T14·P0-T27 절: 이미 `done`인 task의 당시 인수 조건이며 `.agents/harness/`, `.agents/skills/`의 대체 경로가 아직 없다.
  - `docs/standards/adr/0008-...md`: Accepted ADR 본문은 이번 범위에서 수정하지 않는다.
  - `docs/execution/radio/P0-T29-radio.md`: Superseded 표기 후 재설계 출발점으로만 남긴 본문이다.

### 미결 사항

- 하네스 코드·검사·산출물의 물리 위치와 실행 명령 — 결정 주체: 사용자, 반환할 단계: 기획(P0-T31 범위 승인) 후 설계.
- repository-local 스킬의 새 위치(옛 `.agents/skills/**`) — 결정 주체: 사용자, 반환할 단계: 설계(P0-T31).
- `.githooks/pre-commit`이 삭제된 `.agents/harness/scripts/pre-commit.mjs`를 호출한다. 현재 `core.hooksPath=.githooks`이므로 **일반 커밋이 실패한다**. 훅 정책 변경은 이번 승인 범위 밖이라 손대지 않았다 — 결정 주체: 사용자(임시 우회는 `git commit --no-verify`), 반환할 단계: 설계(P0-T31).
- P0-T29의 `depends_on`은 `["P0-T28"]` 그대로다. 대시보드 재설계를 P0-T31 이후로 강제하려면 의존성 추가가 필요하다 — 결정 주체: 사용자, 반환할 단계: 기획.
- `index.schema.json`의 `spec_refs` 패턴이 PRD의 `ACCT-*` ID를 허용하지 않아 P1-T06·P7-T01의 `PRD:ACCT-DORMANT-01`, `PRD:ACCT-CLEANUP-01`, `PRD:ACCT-DEPART-01`이 패턴 위반이다. 이번 재편 이전부터 있던 불일치다 — 결정 주체: 사용자, 반환할 단계: 설계.
- `index.schema.json`에는 반환 사유를 기록할 필드가 없다(`additionalProperties: false`). P0-T29의 반환 사유는 phase 문서·RADIO 본문·이 handoff에만 남았다 — 결정 주체: 사용자, 반환할 단계: 설계.

### 다음 행동

1. 사용자가 이 변경 전체를 검토하고 `P0-T30` 커밋을 만든다(커밋 메시지에 `P0-T30` 포함, pre-commit 훅 문제는 위 미결 사항 참고).
2. 커밋 후 P0-T30을 `done`으로 바꾸고 이 handoff에 검증·리팩토링 단계 기록을 덧붙인다.
3. P0-T31의 범위·인수 조건을 기획 단계에서 인터뷰해 `design_pending`으로 올린다.

### 증거·산출물 경로

- 신규: `docs/standards/adr/0013-project-layer-structure.md`, `docs/workflow/HANDOFF.md`, `docs/execution/radio/P0-T30-radio.md`, `docs/execution/runs/P0-T30/handoff.md`
- 재작성: `docs/workflow/WORKFLOW.md`, `docs/README.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`
- 상태 변경: `docs/execution/phases/index.jsonl`, `docs/execution/phases/index.schema.json`, `docs/execution/phases/00-foundation.md`, `docs/standards/adr/README.md`, `docs/standards/adr/0012-static-operations-dashboard.md`, `docs/execution/radio/P0-T29-radio.md`
- 검증 결과(2026-08-03 기준)
  - `index-json-parse`: 85줄 전부 유효한 JSON, 스키마 필수 필드·경로 패턴·승인 조건·단일 `in_progress`(P0-T30) 통과. RADIO SHA-256은 P0-T28·P0-T30 모두 일치.
  - `doc-link-integrity`: 마크다운 43개 파일의 상대 링크 171개가 모두 실제 파일을 가리킴.
  - `legacy-path-scan`: 옛 경로 참조는 위 "확정된 사실"에 사유를 기록한 5곳만 남음.
