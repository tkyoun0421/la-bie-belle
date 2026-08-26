#!/usr/bin/env python3
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import exists, guard

EXECUTABLE_EXPORT = re.compile(
    r"^\s*export\s+(default\s+)?(async\s+)?(function|class)\b"
    r"|^\s*export\s+(const|let)\s+\w+\s*(:[^=]+)?=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:[^=]*)?=>"
    r"|^\s*export\s+(const|let)\s+\w+\s*(:[^=]+)?=\s*(async\s+)?function\b",
    re.MULTILINE,
)

SKIP_PREFIXES = ("src/app/", "src/shared/ui/")

PAIR_SUFFIXES = (".test.ts", ".integration.test.ts")


def verdict(path, read):
    if not path.startswith("src/") or not path.endswith(".ts"):
        return None
    if path.endswith(".d.ts") or path.endswith(".test.ts") or "/__tests__/" in path:
        return None
    if path.startswith(SKIP_PREFIXES):
        return None

    if not EXECUTABLE_EXPORT.search(read()):
        return None

    directory, filename = os.path.split(path)
    candidates = [
        os.path.join(directory, "__tests__", filename[:-3] + suffix)
        for suffix in PAIR_SUFFIXES
    ]
    if any(exists(candidate) for candidate in candidates):
        return None

    listed = "".join(f"  {candidate}\n" for candidate in candidates)
    return (
        f"TDD 차단: {path} 는 실행 코드를 내보내는데 테스트가 없다.\n"
        "아래 둘 중 하나를 먼저 쓰고, 그 테스트가 실패하는 것을 확인한 뒤 구현해라.\n"
        f"{listed}"
        "DB에 붙는 코드는 integration 쪽이다.\n"
        "타입이나 상수만 담을 파일이면 실행 코드를 빼라.\n"
    )


guard(verdict)
