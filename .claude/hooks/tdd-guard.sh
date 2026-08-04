#!/bin/bash
# TDD Guard Hook — PreToolUse[Write|Edit|MultiEdit]
#
# 면제 판정의 정본은 config/fsd.json이다. 이 스크립트는 계층·세그먼트 목록을 자체
# 보관하지 않고 그 파일을 읽는다 (DEV-SSOT-01). ESLint의 project/* 규칙도 같은
# 파일을 읽으므로 두 도구의 판정이 갈리지 않는다.
#
# stdin: Claude Code PreToolUse hook payload (JSON)
# stdout: 차단할 때만 permissionDecision=deny JSON
# exit code: 항상 0

INPUT=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  echo "TDD GUARD: jq가 없어 검사를 건너뜁니다. 'brew install jq' 후 다시 시도하세요." >&2
  exit 0
fi

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$PWD")
CONTRACT="$PROJECT_ROOT/config/fsd.json"

case "$FILE_PATH" in
  /*) ABS_PATH="$FILE_PATH" ;;
  *)  ABS_PATH="$PROJECT_ROOT/$FILE_PATH" ;;
esac

case "$ABS_PATH" in
  "$PROJECT_ROOT"/*) REL_PATH="${ABS_PATH#"$PROJECT_ROOT"/}" ;;
  *) exit 0 ;;
esac

case "$REL_PATH" in
  src/*) ;;
  *) exit 0 ;;
esac

case "$REL_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

# 테스트 파일 자체를 쓰는 건 TDD의 첫 단계다. 계약이 다루는 대상이 아니다.
case "$REL_PATH" in
  *.test.*|*.spec.*|*/__tests__/*|*/__mocks__/*|*/tests/*|*/test/*)
    exit 0
    ;;
esac

# 타입 선언과 설정 파일은 세그먼트 개념 밖이다.
case "$REL_PATH" in
  *.d.ts|*.config.*)
    exit 0
    ;;
esac

if [ ! -f "$CONTRACT" ]; then
  echo "TDD GUARD: $CONTRACT 를 찾을 수 없어 검사를 건너뜁니다." >&2
  exit 0
fi

# 계약이 면제한 경로 (예: 코드 생성물)
while IFS= read -r PATTERN; do
  [ -z "$PATTERN" ] && continue
  SHELL_PATTERN="${PATTERN//\*\*/*}"
  # shellcheck disable=SC2254
  case "$REL_PATH" in
    $SHELL_PATTERN) exit 0 ;;
  esac
done < <(jq -r '.exemptPaths[]? // empty' "$CONTRACT")

IFS='/' read -r -a PARTS <<< "$REL_PATH"
LAYER="${PARTS[1]:-}"
BASE_NAME=$(basename "$REL_PATH")

# src/ 바로 아래 파일(proxy.ts, instrumentation.ts)은 계층 밖의 서버 코드다.
if [ "${#PARTS[@]}" -eq 2 ]; then
  SEGMENT="src 최상위"
  UNIT_TEST="required"
elif [ "$LAYER" = "app" ]; then
  # app 계층은 표현 파일만 면제한다. route.ts 같은 엔드포인트는 테스트가 필요하다.
  APP_UNIT_TEST=$(jq -r '.appLayer.unitTest // "required"' "$CONTRACT")
  if [ "$APP_UNIT_TEST" = "exempt" ]; then
    exit 0
  fi
  if jq -e --arg f "$BASE_NAME" '(.appLayer.exemptFiles // []) | index($f)' "$CONTRACT" >/dev/null; then
    exit 0
  fi
  SEGMENT="app"
  UNIT_TEST="$APP_UNIT_TEST"
else
  if [ "$LAYER" = "shared" ]; then
    SEGMENT="${PARTS[2]:-}"
  else
    SEGMENT="${PARTS[3]:-}"
  fi

  # 세그먼트가 없는 위치의 파일은 계약이 판정하지 않는다.
  if [ -z "$SEGMENT" ] || [ "${#PARTS[@]}" -lt 3 ]; then
    exit 0
  fi

  UNIT_TEST=$(jq -r --arg s "$SEGMENT" '.segments[$s].unitTest // "unknown"' "$CONTRACT")

  if [ "$UNIT_TEST" = "exempt" ]; then
    exit 0
  fi
fi

DIR=$(dirname "$ABS_PATH")
BASE=$(basename "$ABS_PATH")
STEM="${BASE%.*}"
PARENT=$(dirname "$DIR")
REL_DIR=$(dirname "$REL_PATH")

TEST_FOUND=false
for EXT in ts tsx js jsx mjs cjs; do
  for CANDIDATE in \
    "$DIR/$STEM.test.$EXT" \
    "$DIR/$STEM.spec.$EXT" \
    "$DIR/__tests__/$STEM.test.$EXT" \
    "$DIR/__tests__/$STEM.spec.$EXT" \
    "$PARENT/__tests__/$STEM.test.$EXT" \
    "$PARENT/__tests__/$STEM.spec.$EXT" \
    "$PROJECT_ROOT/src/__tests__/$STEM.test.$EXT"; do
    if [ -f "$CANDIDATE" ]; then
      TEST_FOUND=true
      break 2
    fi
  done
done

if [ "$TEST_FOUND" = false ] && [ -d "$PROJECT_ROOT/tests" ]; then
  if find "$PROJECT_ROOT/tests" -type f \( -name "$STEM.test.*" -o -name "$STEM.spec.*" \) -print -quit 2>/dev/null | grep -q .; then
    TEST_FOUND=true
  fi
fi

if [ "$TEST_FOUND" = false ]; then
  REASON=$(printf '%s' "TDD GUARD: '${REL_PATH}'은 config/fsd.json에서 ${SEGMENT} 세그먼트(unitTest=${UNIT_TEST})라 테스트가 필요합니다. 구현 전에 실패하는 테스트를 먼저 작성하세요 (DEV-TEST-03). 예상 경로: ${REL_DIR}/${STEM}.test.ts 또는 ${REL_DIR}/__tests__/${STEM}.test.ts")
  jq -nc --arg reason "$REASON" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
fi

exit 0
