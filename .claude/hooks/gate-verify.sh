#!/bin/bash
set -u

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

export PROJECT_DIR="$project_dir"
exec python3 "$project_dir/scripts/gate-check.py" --subagent
