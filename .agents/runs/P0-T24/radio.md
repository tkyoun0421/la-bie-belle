## Requirements

- `DOCS:SDD`, `ADR:0008`에 따라 Codex 훅에서 위험한 명령을 실행 전에 차단한다.
- 범위는 repository-local Codex `PreToolUse` guard와 그 회귀 테스트다.

## Architecture

- `.codex/hooks/pre-tool-use.mjs`가 Bash tool input을 검사해 차단 결정을 반환한다.
- 기존 commit/TDD gate는 유지하고 위험 명령 검사는 그보다 먼저 수행한다.

## Data model

- 데이터베이스, migration, RLS, 개인정보 데이터 변경은 없다.

## Interface

- 위험 명령은 한국어 차단 사유와 안전한 대안을 포함한 `permissionDecision: deny`를 반환한다.
- 일반 명령은 기존 훅 결과를 유지한다.

## Optimizations

- 명령 문자열만 동기적으로 검사하며 추가 프로세스 실행이나 외부 의존성을 만들지 않는다.
