#!/bin/bash
# CI Finisher Stop Guard Hook — SubagentStop[ci-finisher]
#
# ci-finisher의 push 절차는 'cp .env.example .env && git push origin main; rm -f .env'다.
# 데모 값 .env가 삭제되지 않은 채 에이전트가 종료하려 하면 한 번 막고 삭제를 지시한다.
# .env가 .env.example과 다르면 에이전트가 만든 사본이라 단정할 수 없으므로 관여하지 않는다.
#
# stdin: Claude Code SubagentStop hook payload (JSON)
# stdout: 종료를 막을 때만 decision=block JSON
# exit code: 항상 0

INPUT=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  echo "CI FINISHER GUARD: jq가 없어 검사를 건너뜁니다. 'brew install jq' 후 다시 시도하세요." >&2
  exit 0
fi

AGENT_TYPE=$(printf '%s' "$INPUT" | jq -r '.agent_type // empty')
if [ "$AGENT_TYPE" != "ci-finisher" ]; then
  exit 0
fi

STOP_HOOK_ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$PWD")

if [ -f "$PROJECT_ROOT/.env" ] && cmp -s "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.example"; then
  jq -nc --arg reason "CI FINISHER GUARD: push용으로 복사한 .env가 남아 있습니다. 'rm -f .env'로 삭제한 뒤 종료하세요(ci-finisher 절차 1단계)." '{
    decision: "block",
    reason: $reason
  }'
fi

exit 0
