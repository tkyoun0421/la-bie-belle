# P0-T23 RADIO

## Requirements

- `test_mode=tdd` 작업에서만 Codex hook이 RED 증거 전 production 로직 변경을 차단하고, GREEN 검증 전 task 완료·commit을 차단한다.
- 테스트 파일 작성과 RED 실행은 허용한다. `verification`과 `docs_only` 작업에는 적용하지 않는다.

## Architecture

- `.codex/hooks/pre-tool-use.mjs`가 편집 대상과 TDD evidence 상태를 판단한다.
- 기존 `tdd-guard.mjs`가 기록한 RED/GREEN evidence를 단일 진실 공급원으로 사용한다.

## Data model

- 제품 데이터 모델 변경 없음. `.agents/runs/<task-id>/tdd.json`의 기존 증거만 읽는다.

## Interface

- Codex `PreToolUse` hook은 production 편집을 허용하거나 거부한다.
- 거부 메시지는 다음 선행 조치를 안내한다: 테스트 변경 → `tdd-guard red` → production 변경.

## Optimizations

- 파일 경로 기반의 좁은 판정으로만 gate를 적용한다. 불확실한 변경은 허용하고 commit gate가 최종 검증한다.
