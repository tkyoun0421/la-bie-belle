#!/bin/sh
set -eu
project="${CLAUDE_PROJECT_DIR:-$(pwd)}"
node --experimental-strip-types --disable-warning=ExperimentalWarning "$project/scripts/claude-loop.mjs" record-failure >/dev/null
