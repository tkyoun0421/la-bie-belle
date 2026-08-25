#!/usr/bin/env python3
import json
import os
import re
import sys

EXECUTABLE_EXPORT = re.compile(
    r"^\s*export\s+(default\s+)?(async\s+)?(function|class)\b"
    r"|^\s*export\s+(const|let)\s+\w+\s*(:[^=]+)?=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:[^=]*)?=>"
    r"|^\s*export\s+(const|let)\s+\w+\s*(:[^=]+)?=\s*(async\s+)?function\b",
    re.MULTILINE,
)

SKIP_PREFIXES = ("src/app/", "src/shared/ui/")

PAIR_SUFFIXES = (".test.ts", ".integration.test.ts")


def incoming_text(tool_input):
    return "\n".join(
        str(tool_input.get(key, ""))
        for key in ("content", "new_string")
    )


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_input = payload.get("tool_input") or {}
    raw_path = tool_input.get("file_path")
    if not raw_path:
        sys.exit(0)

    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    try:
        path = os.path.relpath(os.path.abspath(raw_path), os.path.abspath(root))
    except ValueError:
        sys.exit(0)

    if not path.startswith("src/") or not path.endswith(".ts"):
        sys.exit(0)
    if path.endswith(".d.ts") or path.endswith(".test.ts") or "/__tests__/" in path:
        sys.exit(0)
    if path.startswith(SKIP_PREFIXES):
        sys.exit(0)

    absolute = os.path.join(root, path)
    if os.path.exists(absolute):
        with open(absolute, encoding="utf-8", errors="ignore") as handle:
            body = handle.read()
    else:
        body = incoming_text(tool_input)

    if not EXECUTABLE_EXPORT.search(body):
        sys.exit(0)

    directory, filename = os.path.split(path)
    candidates = [
        os.path.join(directory, "__tests__", filename[:-3] + suffix)
        for suffix in PAIR_SUFFIXES
    ]
    if any(os.path.exists(os.path.join(root, candidate)) for candidate in candidates):
        sys.exit(0)

    listed = "".join(f"  {candidate}\n" for candidate in candidates)
    sys.stderr.write(
        f"TDD 차단: {path} 는 실행 코드를 내보내는데 테스트가 없다.\n"
        "아래 둘 중 하나를 먼저 쓰고, 그 테스트가 실패하는 것을 확인한 뒤 구현해라.\n"
        f"{listed}"
        "DB에 붙는 코드는 integration 쪽이다.\n"
        "타입이나 상수만 담을 파일이면 실행 코드를 빼라.\n"
    )
    sys.exit(2)


main()
