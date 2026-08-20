#!/bin/bash
set -u

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
role_file="$project_dir/.agent-role"
[ -f "$role_file" ] || exit 0
role=$(tr -d '[:space:]' < "$role_file")
[ -n "$role" ] || exit 0

export ROLE="$role" PROJECT_DIR="$project_dir"
exec python3 "$project_dir/.claude/hooks/ownership-check.py" hook
