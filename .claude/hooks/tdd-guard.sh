#!/bin/bash
# TDD Guard Hook — PreToolUse[Write|Edit|MultiEdit]
#
# src/ 아래 production 소스를 만들거나 고치기 전에, 그 모듈에 대응하는 테스트 파일이
# 이미 존재하는지 확인한다. 테스트가 없으면 편집을 차단한다.
#
# 근거: docs/standards/DEVELOPMENT.md
#   - DEV-TEST-03 MUST: 버그 수정은 실패 재현 테스트를 먼저 추가한다.
#   - "동작·도메인·API·DB·RLS·보안 task는 TDD를 기본으로 한다."
#   - DEV-ARCH-01/02: app은 얇은 route adapter, ui는 표시 계층이므로 유닛 테스트 대상 외.
#
# stdin: Claude Code PreToolUse hook payload (JSON)
# stdout: 차단할 때만 permissionDecision=deny JSON
# exit code: 항상 0 (판정은 stdout JSON으로 전달)

INPUT=$(cat)

# jq가 없으면 조용히 통과시키지 않고 사용자에게 알린 뒤 통과시킨다.
if ! command -v jq >/dev/null 2>&1; then
  echo "TDD GUARD: jq가 없어 검사를 건너뜁니다. 'brew install jq' 후 다시 시도하세요." >&2
  exit 0
fi

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

# 파일 경로가 없는 도구 호출은 대상 아님
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$PWD")

# 상대 경로로 들어오면 프로젝트 기준 절대 경로로 맞춘다
case "$FILE_PATH" in
  /*) ABS_PATH="$FILE_PATH" ;;
  *)  ABS_PATH="$PROJECT_ROOT/$FILE_PATH" ;;
esac

# 프로젝트 밖 파일은 대상 아님
case "$ABS_PATH" in
  "$PROJECT_ROOT"/*) REL_PATH="${ABS_PATH#"$PROJECT_ROOT"/}" ;;
  *) exit 0 ;;
esac

# production 소스는 src/ 아래에만 둔다. 문서·설정·하네스 스크립트는 대상 아님.
case "$REL_PATH" in
  src/*) ;;
  *) exit 0 ;;
esac

# 소스 확장자가 아니면 대상 아님 (.json, .css, .sql, .md 등)
case "$REL_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

# 테스트·목 파일 자체를 쓰는 건 허용 — TDD의 첫 단계다
case "$REL_PATH" in
  *.test.*|*.spec.*|*/__tests__/*|*/__mocks__/*|*/tests/*|*/test/*)
    exit 0
    ;;
esac

# 타입 선언·설정·생성 산출물은 테스트 불필요 — 허용
case "$REL_PATH" in
  *.d.ts|*.config.*|*/types/*|*/types.ts|*/generated/*)
    exit 0
    ;;
esac

# FSD 레이어별 예외 — 허용
#   src/app/**    Next.js route·layout·provider. DEV-ARCH-01상 얇은 adapter만 둔다.
#   **/ui/**      FSD ui 세그먼트 = presentation. 로직은 model/lib/api로 내린다.
#   **/components/**  presentation 컴포넌트.
#   **/index.ts   slice public API barrel (재export 전용).
case "$REL_PATH" in
  src/app/*|*/ui/*|*/components/*|*/index.ts|*/index.tsx)
    exit 0
    ;;
esac

# 여기까지 왔으면 entities/, features/{model,api,lib}, widgets/model, shared/lib 등
# 비즈니스 로직 계층이다. 대응 테스트 파일을 찾는다.
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

# 프로젝트 루트 tests/ 트리에 같은 이름의 테스트가 있으면 인정한다
if [ "$TEST_FOUND" = false ] && [ -d "$PROJECT_ROOT/tests" ]; then
  if find "$PROJECT_ROOT/tests" -type f \( -name "$STEM.test.*" -o -name "$STEM.spec.*" \) -print -quit 2>/dev/null | grep -q .; then
    TEST_FOUND=true
  fi
fi

if [ "$TEST_FOUND" = false ]; then
  REASON=$(printf '%s' "TDD GUARD: '${REL_PATH}'에 대한 테스트 파일이 없습니다. 구현 코드를 쓰기 전에 실패하는 테스트를 먼저 작성하세요 (DEV-TEST-03). 예상 경로: ${REL_DIR}/${STEM}.test.ts 또는 ${REL_DIR}/__tests__/${STEM}.test.ts")
  jq -nc --arg reason "$REASON" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
fi

exit 0
