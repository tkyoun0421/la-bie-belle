# verify-skill 인터뷰 handoff

## 2026-08-04 · 기획 종료

- 작업 식별자: P0-T33 (verify 스킬과 reviewer 에이전트)
- 현재 단계: 기획 종료 → 다음 설계(RADIO)
- 기준 시각: 2026-08-04 (기획 합의·승인은 2026-08-03 세션)

### 확정된 사실

- 사용자 승인(2026-08-03): 교차 검증 절차를 저장소 정의물로 옮긴다 — `verify` 스킬(`.claude/skills/verify/SKILL.md`)과 reviewer 서브 에이전트 정의(`.claude/agents/reviewer.md`).
- 이름 결정: 사용자가 "cross-review"를 거절하고 `verify`를 택했다.
- 구조 변경(사용자 지시): 리뷰어는 독립 서브 에이전트 2자 — Claude Opus 서브 에이전트와 Codex CLI 직접 호출(Codex 모델은 지정하지 않음). 메인 에이전트는 리뷰를 산출하지 않고 두 리뷰의 병합·확정·중요도 판독·점수 판정·기록만 담당한다.
- 범위에 [교차 검증 계약](../../../workflow/REVIEW.md) 개정과 reviews 파서·`example-review.json` 정합, F-09(total 평균 규칙 미검증) 해소가 포함된다.
- P0-T33은 `design_pending`으로 등록됐다(`docs/execution/phases/index.jsonl`, product_approval user 2026-08-03). 기획 본문은 `docs/execution/phases/00-foundation.md`의 P0-T33 절이다.

### 미결 사항

- Codex CLI 사용 불가 시 리뷰어 2자 확보 대체 규칙 — 결정 주체: 사용자, 반환할 단계: 설계(RADIO 승인에서 확정).
- 결과 파일의 `participants` 표기(리뷰어만 vs 조정자 포함) — 결정 주체: 사용자, 반환할 단계: 설계.
- 수동 전체 스캔 결과 파일명 규칙(P0-T32 잔여 미결) — 결정 주체: 사용자, 반환할 단계: 설계. 이 task에서 함께 정할 수 있다.

### 다음 행동

1. `docs/execution/radio/P0-T33-radio.md` 초안(Draft)을 사용자와 검토하고, 승인 시 SHA-256을 `index.jsonl`에 기록해 `planned`로 전환한다.

### 증거·산출물 경로

- `docs/execution/phases/00-foundation.md` (P0-T33 절)
- `docs/execution/phases/index.jsonl` (P0-T33 = `design_pending`)
- `docs/execution/radio/P0-T33-radio.md` (Draft)
