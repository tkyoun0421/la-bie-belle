#!/bin/bash
# CI Finisher Guard Hook — PreToolUse[Bash|Edit|Write|MultiEdit]
#
# 규칙의 정본은 .claude/agents/ci-finisher.md와 WORKFLOW.md 마무리 오프로드 규칙이다.
# settings.json에 등록되어 모든 도구 호출에서 실행되지만, payload의 agent_type이
# ci-finisher일 때만 판정한다. 메인 세션과 다른 에이전트에는 관여하지 않는다.
#
# stdin: Claude Code PreToolUse hook payload (JSON)
# stdout: 차단할 때만 permissionDecision=deny JSON
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

TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$PWD")

deny() {
  jq -nc --arg reason "CI FINISHER GUARD: $1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

PROTECTED='(docs/execution|\.claude)/'

case "$TOOL_NAME" in
  Edit|Write|MultiEdit)
    FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
    [ -z "$FILE_PATH" ] && exit 0

    case "$FILE_PATH" in
      /*) ABS_PATH="$FILE_PATH" ;;
      *)  ABS_PATH="$PROJECT_ROOT/$FILE_PATH" ;;
    esac
    case "$ABS_PATH" in
      "$PROJECT_ROOT"/*) REL_PATH="${ABS_PATH#"$PROJECT_ROOT"/}" ;;
      *) exit 0 ;;
    esac

    case "$REL_PATH" in
      docs/execution/*)
        deny "'${REL_PATH}'은 조정자 소유 실행 문서입니다(reviews·radio·phases·runs). ci-finisher는 docs/execution/** 을 수정하지 않습니다 — 진단만 보고하고 종료하세요."
        ;;
      .claude/*)
        deny "'${REL_PATH}'은 에이전트·훅 구성입니다. ci-finisher는 자신의 실행 규칙(.claude/**)을 수정할 수 없습니다."
        ;;
    esac
    exit 0
    ;;
  Bash)
    ;;
  *)
    exit 0
    ;;
esac

COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

if printf '%s' "$COMMAND" | grep -Eq "git[[:space:]]+push[^;&|]*[[:space:]](--force([[:space:]]|$)|--force-with-lease|--force-if-includes|--delete([[:space:]]|$)|-f([[:space:]]|$)|-d([[:space:]]|$)|\+[^[:space:]])"; then
  deny "force push와 원격 브랜치 삭제는 금지입니다(ci-finisher 금지 규칙). 일반 'git push origin main'만 사용하세요."
fi

if printf '%s' "$COMMAND" | grep -Eq "git[[:space:]]+rebase([[:space:]]|$)|git[[:space:]]+commit[^;&|]*--amend|git[[:space:]]+reset[^;&|]*--hard|git[[:space:]]+(filter-branch|filter-repo)|git[[:space:]]+reflog[[:space:]]+(expire|delete)"; then
  deny "이력 재작성(rebase, --amend, reset --hard, filter-branch, reflog expire)은 금지입니다(ci-finisher 금지 규칙). 수정은 새 커밋으로만 만드세요."
fi

STRIPPED_COMMAND=${COMMAND//.env.example/}
if printf '%s' "$STRIPPED_COMMAND" | grep -Eq "git[[:space:]]+add[^;&|]*\.env"; then
  deny ".env는 스테이징할 수 없습니다(커밋 금지). push가 끝나면 'rm -f .env'로 삭제하세요."
fi

if printf '%s' "$COMMAND" | grep -Eq "git[[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+[[:space:]]+)*commit([[:space:]]|$)"; then
  INDEX_FILE="$PROJECT_ROOT/docs/execution/phases/index.jsonl"
  if [ -f "$INDEX_FILE" ]; then
    IN_PROGRESS_ID=$(jq -r 'select(.status == "in_progress") | .id' "$INDEX_FILE" 2>/dev/null | head -n 1)
    if [ -n "$IN_PROGRESS_ID" ]; then
      deny "task '${IN_PROGRESS_ID}'가 in_progress라 커밋할 수 없습니다 — gate:scope가 봉인 경로 밖 커밋을 차단합니다. 진단만 보고하고 종료하세요(WORKFLOW 마무리 오프로드 규칙)."
    fi
  fi
  STAGED_ENV=$(git -C "$PROJECT_ROOT" diff --cached --name-only 2>/dev/null | grep -E '^\.env(\.|$)' | grep -v '^\.env\.example$' | head -n 1)
  if [ -n "$STAGED_ENV" ]; then
    deny "'${STAGED_ENV}'가 스테이징돼 있어 커밋할 수 없습니다. 'git restore --staged ${STAGED_ENV}' 후 다시 시도하세요(.env 커밋 금지)."
  fi
fi

if printf '%s' "$COMMAND" | grep -Eq ">>?[[:space:]]*[^[:space:];&|]*${PROTECTED}|sed[[:space:]][^;&|]*-i[^;&|]*${PROTECTED}|tee[[:space:]][^;&|]*${PROTECTED}|(^|[;&|[:space:]])(rm|mv|cp|truncate|chmod)[[:space:]][^;&|]*${PROTECTED}|git[[:space:]]+(add|rm|mv|checkout|restore)[^;&|]*${PROTECTED}"; then
  deny "docs/execution/** 과 .claude/** 은 조정자 소유입니다. ci-finisher는 이 경로를 셸로도 변경할 수 없습니다 — 진단만 보고하고 종료하세요."
fi

exit 0
