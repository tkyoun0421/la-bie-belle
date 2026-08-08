#!/bin/sh
set -eu
project="${CLAUDE_PROJECT_DIR:-$(pwd)}"
marker="$project/.claude/runtime/unattended-resume.json"
[ -f "$marker" ] || exit 0
input=$(cat)
printf '%s' "$input" | python3 -c '
import datetime, json, os, sys
marker_path, project = sys.argv[1], sys.argv[2]
try:
    stdin = json.load(sys.stdin)
    marker = json.load(open(marker_path))
except Exception:
    sys.exit(0)
if not stdin.get("session_id") or stdin.get("session_id") != marker.get("session_id"):
    sys.exit(0)
try:
    resumed = datetime.datetime.fromisoformat(str(marker.get("resumed_at")).replace("Z", "+00:00"))
    age = (datetime.datetime.now(datetime.timezone.utc) - resumed).total_seconds()
except Exception:
    sys.exit(0)
if age < 0 or age > 900:
    sys.exit(0)
os.remove(marker_path)
context = (
    "loop-mode auto-resumed this session after a rate limit while the user is away. "
    "Follow the unattended contract in .claude/loop-unattended.md: adopt recommended options instead of asking, "
    "fix critical/high verification findings first and log them for the user's later review, "
    "block only the affected task on approval-gate decisions or unfixable criticals and continue with the next planned task, "
    "stop with needs_user only for auth/billing problems, "
    "and write the result report under docs/execution/runs/loop-reports/ before finishing."
)
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": context}}))
' "$marker" "$project"
