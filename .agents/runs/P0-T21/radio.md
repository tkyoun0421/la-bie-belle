# P0-T21 RADIO

## Requirements

- `DOCS:SDD`, `DOCS:DDD`, ADR-0001, ADR-0002와 P0-T21 인수 조건에 맞춰 FSD·server-first·RADIO 규칙을 문서화한다.
- Codex lifecycle hook은 task와 TDD/commit 규칙을 실행 전에 안내하고, Codex가 실행하는 commit을 기존 task guard로 차단해야 한다.

## Architecture

- repository-local `.codex/hooks.json`은 `SessionStart`와 `PreToolUse` command hook을 등록한다.
- hook 구현은 `.codex/hooks/`에 두고, 기존 `.agents/harness/scripts/pre-commit.mjs`를 재사용해 Git과 Codex의 commit 정책을 하나로 유지한다.

## Data model

- 데이터베이스 migration, RLS, 감사 데이터 변경 없음.

## Interface

- `SessionStart`는 현재 in-progress task와 test mode를 Codex developer context로 제공한다.
- `PreToolUse`는 `git commit`을 검사해 guard 실패 시 Codex permission decision을 deny한다. TDD task의 파일 편집에는 RED → GREEN 규칙을 추가 context로 제공한다.

## Optimizations

- 모든 tool call에 무거운 검증을 실행하지 않고, commit command에서만 pre-commit guard를 실행한다.
- hook 자체와 development/skill validator는 Node 표준 라이브러리만 사용한다.
