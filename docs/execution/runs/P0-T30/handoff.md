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

## 2026-08-03 · 문서 정합성 스위프 (개발 종료, 2차)

- 작업 식별자: P0-T30 (프로젝트 5레이어 구조 재편 — 후속 문서 최신화)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-03

### 확정된 사실

사용자가 2026-08-03에 세 가지를 추가 승인했고 모두 문서에 반영했다.

**1. 연속 루프 엔지니어링 규칙 (기존 "task 하나 완료 후 정지" 규칙 폐지)**

- 개발 루프는 `planned` 큐가 빌 때까지 의존성 순서로 연속 실행한다. 사용자 통제는 매 task 실행 지시가 아니라 두 승인 게이트로 이동한다.
- `in_progress`는 여전히 최대 1개다. 순차 처리이며 병렬이 아니다.
- 멈춤·건너뛰기 조건 3가지: 큐 소진 시 정상 종료·일괄 보고, 새 결정 필요 시 해당 task만 `blocked` 후 계속, 재시도 한도 초과 시 동일 처리.
- 유지: `dual-approval-v3` 이중 승인 게이트, 승인 없는 실행 금지, 단계 경계 handoff, 인터뷰 반환 원칙.
- 반영 위치: `docs/workflow/WORKFLOW.md`(신규 `## 연속 루프 규칙` 절 + 목적·개요·3단계·5단계·상태 정의·중단 규칙), `docs/standards/adr/0013-...md`(Context + Decision 4번 + Consequences + 개정 이력), `CLAUDE.md`(신규 `Continuous Engineering Loop` 절), `README.md`, `docs/standards/DEVELOPMENT.md`, `docs/execution/phases/README.md`.

**2. 루트 `AGENTS.md` 삭제**

- 파일을 삭제했다. 고유 규범만 먼저 이관했다.
  - `docs/workflow/WORKFLOW.md`로: `## 작업 인덱스 규칙`(1줄 1 JSON, `spec_refs` 최소 1개, ID·의존성·상태 재사용·삭제 금지, 단일 `in_progress`, 범위 밖 작업은 제안으로 기록, `done` 인수 조건 파괴는 새 task, 완료 이력 소급 변경 금지), `## 구현 원칙`(MVP 밖 금지, 서버·DB 권한 강제, 민감 변경 회귀 테스트, 승인된 Design 범위).
  - `CLAUDE.md`로: `Index rules`, `Implementation Principles` 절.
- 나머지(5레이어 표, 5단계 절차, handoff 규칙, 제품 불변 규칙)는 `CLAUDE.md`·`docs/workflow/`와 중복이라 버렸다.
- 참조 제거: `CLAUDE.md`(L1 표, 루트 파일 설명, "read AGENTS.md first"), `README.md`(L1 표), `docs/README.md`(L1 표), `docs/standards/adr/0013-...md`(L1 소속 표 + 루트 고정 파일 절).

**3. codex 잔재 정리**

- 현행 규범 문서에는 codex 언급이 남아 있지 않다(`CLAUDE.md`, `README.md`, `docs/workflow/`, `docs/standards/ARCHITECTURE.md`, `docs/standards/DEVELOPMENT.md`, `docs/product/`, `docs/README.md`, `docs/execution/*/README.md` 전수 확인).
- `docs/standards/DEVELOPMENT.md`에서 제거: 삭제된 repository-local 스킬(`SKILL.md`·`agents/openai.yaml`) 언어 규칙, `$la-bie-belle-*` 스킬 호출 안내, `pnpm harness:start` 실행 명령. 남은 `.claude/hooks/tdd-guard.sh` 설명은 실제 존재하므로 보존했다.
- 역사 기록으로 보존한 codex 언급: `docs/execution/phases/00-foundation.md`의 `done` task 절(P0-T00·T13·T15·T22·T23·T24·T27), `index.jsonl`의 `done` task 행, `docs/standards/adr/0008-...md`(Accepted), 해시 결속 RADIO 3종.

**4. 그 밖의 정합성 수정**

- `docs/standards/DEVELOPMENT.md`: 제목 `개발 컨벤션과 하네스` → `개발 컨벤션`, 깨진 라벨 `docs/development` 링크 수정, `## 실행` 절을 P0-T31 재구축 안내로 교체.
- `docs/standards/ARCHITECTURE.md`: 운영 대시보드 절에서 삭제된 readiness 보고서 의존을 제거하고 "보류 해제 시 유지할 구조 의도"로 표기.
- `docs/product/DESIGN.md`: 운영 대시보드 문단을 ADR-0012 보류 상태에 맞게 조건부로 수정. 정합화 순서에 `Design` 추가.
- `docs/product/PRD.md`: 단수 "사용자 승인" → 기획 승인 + RADIO 승인 이중 게이트로 정정.
- `docs/execution/phases/00-foundation.md`: P0-T29(`design_pending`) 절에서 삭제된 정적 HTML 생성기·readiness 보고서 전제와 폐기된 자동 선택 금지 문구를 제거하고, 보존된 제품 승인 범위임을 명시.
- `docs/execution/phases/README.md`: 상태 목록에 `verification_pending` 추가, `blocked` 정의를 재시도 한도·루프 계속으로 갱신, 승인·완료 규칙에 리팩토링 단계 추가, `spec_refs` 예시에 `PRD:ACCT-*` 추가.
- `docs/execution/radio/README.md`: RADIO 상태 어휘에 `Superseded`와 철회 절차 추가(P0-T29-radio.md의 실제 상태와 일치시킴).
- `docs/standards/adr/README.md`: 부분 대체 관계 표 추가(0009←0011, 0009←0013, 0011←0013). ADR 상태 값은 바꾸지 않았다.
- `docs/standards/adr/0012-...md`: 상태 표기를 정의된 어휘 `보류(재검토 예정)`로 통일하고, 폐기된 "다음 task 자동 선택"·"사용자 실행 지시 대기" 문구를 정정.
- `docs/standards/adr/0009-...md`: **본문·상태는 수정하지 않았다.** 머리말에만 ADR-0013 부분 대체 backlink 3줄을 추가했다.

### 미결 사항

이전 기록의 미결 사항은 모두 유효하며, 다음이 추가되었다.

- ADR-0009의 상태 처리 — 본문 Decision 19·22번("`--task <ID>`만 실행", "한 task 완료 후 정지")이 연속 루프 규칙과 정면 충돌한다. 머리말 backlink로 표시만 해 두었다. `Superseded` 전환 또는 대체 ADR 작성 권고 — 결정 주체: 사용자, 반환할 단계: 설계.
- P0-T30의 phase 문서 범위 절에 연속 루프·`AGENTS.md` 삭제·codex 정리가 포함되어 있지 않다. 승인된 인수 조건을 임의로 늘리지 않기 위해 손대지 않았다 — 결정 주체: 사용자, 반환할 단계: 기획.
- `package.json`의 `name`이 아직 `la-bie-belle-harness`다. 하네스가 제거된 현재 이름과 맞지 않는다 — 결정 주체: 사용자, 반환할 단계: 설계(P0-T31).
- 루트 `skills-lock.json`은 **삭제하지 않았다.** 내용이 외부 저장소 `mattpocock/skills`의 41개 스킬 잠금이며 codex나 삭제된 `.agents/skills/**`와 무관하다 — 결정 주체: 사용자, 반환할 단계: 없음(정보).
- `.githooks/pre-commit`, P0-T29 `depends_on`, `index.schema.json`의 `spec_refs` 패턴과 반환 사유 필드 부재는 이전 기록 그대로 미해결이다.

### 다음 행동

1. 사용자가 이 변경 전체를 검토하고 `P0-T30` 커밋을 만든다(커밋 메시지에 `P0-T30` 포함, pre-commit 훅은 `--no-verify` 필요).
2. ADR-0009 상태 처리를 결정한다(`Superseded` 전환 또는 유지).
3. 커밋 후 P0-T30을 `done`으로 바꾸고 이 handoff에 검증·리팩토링 단계 기록을 덧붙인다.
4. P0-T31의 범위·인수 조건을 기획 단계에서 인터뷰해 `design_pending`으로 올린다.

### 증거·산출물 경로

- 삭제: `AGENTS.md`
- 수정: `README.md`, `CLAUDE.md`, `docs/README.md`, `docs/workflow/WORKFLOW.md`, `docs/product/PRD.md`, `docs/product/DESIGN.md`, `docs/standards/ARCHITECTURE.md`, `docs/standards/DEVELOPMENT.md`, `docs/standards/adr/README.md`, `docs/standards/adr/0009-two-track-interview-and-engineering-loop.md`, `docs/standards/adr/0012-static-operations-dashboard.md`, `docs/standards/adr/0013-project-layer-structure.md`, `docs/execution/phases/README.md`, `docs/execution/phases/00-foundation.md`, `docs/execution/radio/README.md`
- 수정하지 않음(보호 대상): `docs/execution/phases/index.jsonl`, `docs/execution/phases/index.schema.json`, `docs/execution/radio/P0-T28-radio.md`, `docs/execution/radio/P0-T29-radio.md`, `docs/execution/radio/P0-T30-radio.md`, `.githooks/**`, `.claude/**`, `skills-lock.json`, `package.json`
- 검증 결과(2026-08-03 기준)
  - `index-json-parse`: 85줄 전부 유효한 JSON. 상태·승인 필드는 변경하지 않았고 P0-T30은 `in_progress` 유지.
  - `doc-link-integrity`: 수정한 16개 파일의 모든 상대 링크가 실제 파일을 가리킴. `#연속-루프-규칙` 앵커는 `docs/workflow/WORKFLOW.md`에 실재.
  - `legacy-path-scan`: 옛 경로·`.agents/`·codex·`자동 선택` 잔재는 해시 결속 RADIO 3종, `00-foundation.md`의 `done` task 절, `index.jsonl`의 `done` 행, ADR-0008·0009 본문에만 남음. 모두 역사 보존 예외로 기록됨.
  - `agents-md-refs`: 현행 문서에 `AGENTS.md` 참조 없음. 남은 3곳은 P0-T30-radio.md(해시 결속), 이 handoff의 1차 기록, ADR-0013 개정 이력.

## 2026-08-03 · 검증·리팩토링 종료 (P0-T30 done 전환)

- 작업 식별자: P0-T30 (프로젝트 5레이어 구조 재편 — 종결 배치)
- 현재 단계: 검증·리팩토링 종료 → 다음 없음(done)
- 기준 시각: 2026-08-03

### 확정된 사실

- 사용자가 2026-08-03에 이 종결 배치 전체를 승인했다. index.jsonl의 `product_approval`·`development_approval`은 이미 user, 2026-08-03으로 기록되어 있으며 이번 배치는 그 승인 범위의 마무리 처리다.
- `docs/execution/phases/00-foundation.md`의 P0-T30 절 범위·인수 조건에, 2차 정합성 스위프에서 실행 중 추가 승인된 세 항목(연속 루프 엔지니어링 규칙 문서화, 루트 `AGENTS.md` 삭제와 고유 규범 이관, 제거된 하네스의 codex 잔재 정리)을 반영하고 승인 주체·날짜(user, 2026-08-03)를 명기했다.
- `docs/execution/phases/index.jsonl`에서 P0-T30의 `status`를 `in_progress` → `done`으로 바꿨다. `updated_at`은 이미 2026-08-03이라 그대로 두었고, 다른 필드(`product_approval`, `development_approval`, `radio_ref`, `test_mode`, `check_ids` 등)는 변경하지 않았다. 전환 후 저장소 전체에서 `kind: task`의 `in_progress`는 0개다.
- 같은 파일에서 P0-T29의 `depends_on`을 `["P0-T28"]` → `["P0-T28","P0-T31"]`로 바꿨다. 대시보드 재설계가 새 하네스(P0-T31) 완료 이후에만 후보가 되도록 강제하는 것이 목적이며, 다른 필드는 변경하지 않았다.
- ADR-0009의 머리말 상태를 `Accepted` → `Superseded (ADR-0013으로 대체, 2026-08-03)`로 바꿨다. 본문 Decision은 역사 기록으로 그대로 두었다. `docs/standards/adr/README.md`의 상태 표를 `Superseded (ADR-0013)`으로 일치시켰고, 기존 부분 대체 관계 표(0009←0011, 0009←0013, 0011←0013)는 그대로 두었다.
- `docs/execution/phases/index.schema.json`의 `spec_refs` 패턴을 `PRD:(?:INV-[A-Z]+-[0-9]{2}|AC-[0-9]{2})`에서 `PRD:(?:(?:INV|ACCT)-[A-Z]+-[0-9]{2}|AC-[0-9]{2})`로 확장했다. `P1-T06`, `P7-T01`이 실제로 쓰는 `PRD:ACCT-DORMANT-01`, `PRD:ACCT-CLEANUP-01`, `PRD:ACCT-DEPART-01`만 허용 범위에 추가했고 다른 접두사·자릿수 제약은 그대로 유지했다.
- `package.json`의 `name`을 `la-bie-belle-harness` → `la-bie-belle`로 바꿨다. 하네스가 제거된 현재 저장소 실체와 이름이 일치한다.
- `.githooks/**`, 해시 결속 RADIO 본문(`docs/execution/radio/P0-T28-radio.md`, `P0-T30-radio.md`), `.claude/**`, `skills-lock.json`은 이번 배치에서 수정하지 않았다.

### 미결 사항

- 하네스 코드·검사·산출물의 물리 위치와 실행 명령 — 결정 주체: 사용자, 반환할 단계: 기획(P0-T31 범위 승인) 후 설계.
- repository-local 스킬의 새 위치(옛 `.agents/skills/**`) — 결정 주체: 사용자, 반환할 단계: 설계(P0-T31).
- `.githooks/pre-commit`이 삭제된 `.agents/harness/scripts/pre-commit.mjs`를 호출해 일반 커밋이 실패한다. 이번 배치의 commit도 `--no-verify`로 우회했다. 훅 정책 변경은 여전히 이번 승인 범위 밖이다 — 결정 주체: 사용자, 반환할 단계: 설계(P0-T31).
- `index.schema.json`에는 task 반환 사유를 기록할 필드가 없다(`additionalProperties: false`) — 결정 주체: 사용자, 반환할 단계: 설계.

### 다음 행동

1. P0-T31의 범위·인수 조건을 기획 단계에서 인터뷰해 `design_pending`으로 올린다.
2. P0-T31 설계 단계에서 하네스 코드 위치, repository-local 스킬 위치, `.githooks/pre-commit` 재구축을 함께 결정한다.

### 증거·산출물 경로

- 수정: `docs/execution/phases/00-foundation.md`(P0-T30 절 범위·인수 조건), `docs/execution/phases/index.jsonl`(P0-T30 status, P0-T29 depends_on), `docs/execution/phases/index.schema.json`(spec_refs 패턴), `docs/standards/adr/0009-two-track-interview-and-engineering-loop.md`(머리말 상태), `docs/standards/adr/README.md`(상태 표), `package.json`(name), `docs/execution/runs/P0-T30/handoff.md`(이 기록)
- 수정하지 않음(보호 대상): `.githooks/**`, `.claude/**`, `skills-lock.json`, `docs/execution/radio/P0-T28-radio.md`, `docs/execution/radio/P0-T30-radio.md` 본문
- 검증 결과(2026-08-03 기준)
  - `index-json-parse`: index.jsonl 85줄 전부 유효한 JSON. schema v3 필수 필드·경로 패턴·승인 조건(스키마 `allOf` 조건 전체)을 Python으로 재구현해 전수 검사, 오류 0건. 저장소 전체 `kind: task`의 `in_progress`는 0개.
  - `spec-refs-pattern`: `P1-T06`, `P7-T01`의 `PRD:ACCT-*` 참조 3종이 새 정규식을 `re.match`로 실제 통과.
  - RADIO 해시 재검증: `P0-T28-radio.md` SHA-256 `ce35ed4fa5bb4567dbd15c3f38855f33f5c2af6fffcfa88e0c87ded1f11476e9`, `P0-T30-radio.md` SHA-256 `ecb826a448f66cfaf90928e651b21fa61af56cee44a9d01392d0dca60fcaf608` — 둘 다 `index.jsonl`의 `development_approval.radio_sha256`과 정확히 일치. 본문은 수정하지 않았다.
  - `doc-link-integrity`: 이번에 수정한 3개 Markdown 파일(`00-foundation.md`, `adr/0009-...md`, `adr/README.md`)의 상대 링크가 모두 실제 파일을 가리킴.
