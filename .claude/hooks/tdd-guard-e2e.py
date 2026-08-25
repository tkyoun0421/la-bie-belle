#!/usr/bin/env python3
import json
import os
import sys

ROUTE_FILES = ("page.tsx", "layout.tsx", "route.ts")


def spec_name(path):
    if path.startswith("src/screens/"):
        parts = path.split("/")
        return parts[2] if len(parts) > 2 else None

    if path.startswith("src/app/"):
        directory, filename = os.path.split(path)
        if filename not in ROUTE_FILES:
            return None
        segments = [
            part
            for part in directory[len("src/app/"):].split("/")
            if part and not part.startswith("(") and not part.startswith("@")
        ]
        return segments[-1] if segments else "home"

    return None


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

    name = spec_name(path)
    if not name:
        sys.exit(0)

    expected = f"tests/e2e/{name}.spec.ts"
    if os.path.exists(os.path.join(root, expected)):
        sys.exit(0)

    sys.stderr.write(
        f"TDD 차단: {path} 는 화면인데 e2e 테스트가 없다.\n"
        f"{expected} 를 먼저 쓰고, 그 테스트가 실패하는 것을 확인한 뒤 구현해라.\n"
    )
    sys.exit(2)


main()
