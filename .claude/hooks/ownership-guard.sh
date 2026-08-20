#!/bin/bash
set -u

input=$(cat)
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
role_file="$project_dir/.agent-role"
[ -f "$role_file" ] || exit 0
role=$(tr -d '[:space:]' < "$role_file")
[ -n "$role" ] || exit 0

export ROLE="$role" PROJECT_DIR="$project_dir" HOOK_INPUT="$input"
python3 - <<'PYEOF'
import json, os, sys

role = os.environ["ROLE"]
project_dir = os.path.realpath(os.environ["PROJECT_DIR"])

try:
    payload = json.loads(os.environ.get("HOOK_INPUT", ""))
except json.JSONDecodeError:
    sys.exit(0)

file_path = (payload.get("tool_input") or {}).get("file_path", "")
if not file_path:
    sys.exit(0)

abs_path = os.path.realpath(
    file_path if os.path.isabs(file_path) else os.path.join(project_dir, file_path)
)
if not abs_path.startswith(project_dir + os.sep):
    sys.exit(0)
rel = os.path.relpath(abs_path, project_dir)

try:
    with open(os.path.join(project_dir, "config", "ownership.json")) as f:
        ownership = json.load(f)
except (OSError, json.JSONDecodeError):
    sys.exit(0)

prefixes = ownership.get(role)
if prefixes is None:
    sys.exit(0)
if any(rel == p or rel.startswith(p) for p in prefixes):
    sys.exit(0)

print(
    f"ownership-guard: role '{role}' does not own '{rel}'. "
    "Do not edit it. Request the change from the owning agent via Issue or PR comment "
    "(see docs/rules.md and config/ownership.json).",
    file=sys.stderr,
)
sys.exit(2)
PYEOF
exit $?
