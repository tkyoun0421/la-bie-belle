#!/bin/sh
set -eu
project="${CLAUDE_PROJECT_DIR:-$(pwd)}"
input=$(cat)
printf '%s' "$input" | node --experimental-strip-types --disable-warning=ExperimentalWarning "$project/scripts/claude-loop.mjs" record-usage >/dev/null 2>&1 &
user_statusline=$(node -p "(require(process.env.HOME + '/.claude/settings.json').statusLine || {}).command || ''" 2>/dev/null) || user_statusline=""
if [ -n "$user_statusline" ]; then
  printf '%s' "$input" | sh -c "$user_statusline"
fi
if pgrep -f "claude-loop.mjs start" >/dev/null 2>&1; then
  python3 -c '
import datetime, json, sys
try:
    state = json.load(open(sys.argv[1]))
except Exception:
    state = {}
status = state.get("status")
if status == "waiting_rate_limit" and state.get("next_attempt_at"):
    resume = datetime.datetime.fromisoformat(state["next_attempt_at"].replace("Z", "+00:00")).astimezone()
    print("\033[33m●\033[0m \033[2mloop-mode 대기 · %s 재개\033[0m" % resume.strftime("%H:%M"))
elif status == "needs_user":
    print("\033[31m●\033[0m \033[2mloop-mode 확인 필요\033[0m")
else:
    print("\033[32m●\033[0m \033[2mloop-mode on\033[0m")
' "$project/.claude/runtime/loop-state.json" 2>/dev/null || printf '\033[32m\xe2\x97\x8f\033[0m \033[2mloop-mode on\033[0m\n'
else
  printf '\033[2m\xe2\x97\x8b loop-mode off\033[0m\n'
fi
