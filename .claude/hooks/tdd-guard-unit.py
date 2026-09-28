#!/usr/bin/env python3
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import contents, exists, guard

EXECUTABLE_EXPORT = re.compile(
    r"^\s*export\s+(default\s+)?(async\s+)?(function|class)\b"
    r"|^\s*export\s+(const|let)\s+\w+\s*(:[^=]+)?=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:[^=]*)?=>"
    r"|^\s*export\s+(const|let)\s+\w+\s*(:[^=]+)?=\s*(async\s+)?function\b",
    re.MULTILINE,
)

# 위 정규식과 같은 모양을 잡되 이름만 뽑는다. `export default`는 이름이 없어 빠진다.
EXPORT_NAME = re.compile(
    r"^\s*export\s+(?:async\s+)?(?:function|class)\s+(\w+)"
    r"|^\s*export\s+(?:const|let)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=]*)?=>"
    r"|^\s*export\s+(?:const|let)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s+)?function\b",
    re.MULTILINE,
)

WATCH_PREFIXES = ("src/", "tests/lint/")

SKIP_PREFIXES = ("src/app/", "src/shared/ui/")

PAIR_SUFFIXES = (".test.ts", ".integration.test.ts")


def names(text):
    return {
        name for groups in EXPORT_NAME.findall(text) for name in groups if name
    }


def verdict(path, read):
    if not path.startswith(WATCH_PREFIXES) or not path.endswith(".ts"):
        return None
    if path.endswith(".d.ts") or path.endswith(".test.ts") or "/__tests__/" in path:
        return None
    if path.startswith(SKIP_PREFIXES):
        return None

    stored = read() if exists(path) else ""
    incoming = read("incoming")

    if not EXECUTABLE_EXPORT.search(stored + "\n" + incoming):
        return None

    directory, filename = os.path.split(path)
    if path.startswith("tests/"):
        candidates = [
            os.path.join(directory, filename[:-3] + suffix)
            for suffix in PAIR_SUFFIXES
        ]
    else:
        candidates = [
            os.path.join(directory, "__tests__", filename[:-3] + suffix)
            for suffix in PAIR_SUFFIXES
        ]
    pairs = [candidate for candidate in candidates if exists(candidate)]

    if not pairs:
        listed = "".join(f"  {candidate}\n" for candidate in candidates)
        return (
            f"TDD 차단: {path} 는 실행 코드를 내보내는데 테스트가 없다.\n"
            "아래 둘 중 하나를 먼저 쓰고, 그 테스트가 실패하는 것을 확인한 뒤 구현해라.\n"
            f"{listed}"
            "DB에 붙는 코드는 integration 쪽이다.\n"
            "타입이나 상수만 담을 파일이면 실행 코드를 빼라.\n"
        )

    # 짝 파일이 있어도 그 안이 이번에 서는 함수를 안 부르면 통과시키지 않는다. 있는 파일에
    # 함수를 얹는 걸음이 파일 단위 검사를 그냥 지나가던 자리다(관찰 027).
    written = "\n".join(contents(pair) for pair in pairs)
    fresh = sorted(
        name
        for name in names(incoming) - names(stored)
        if not re.search(rf"\b{re.escape(name)}\b", written)
    )
    if not fresh:
        return None

    listed = "".join(f"  {name}\n" for name in fresh)
    covered = "".join(f"  {pair}\n" for pair in pairs)
    return (
        f"TDD 차단: {path} 가 내보내는 함수를 짝 테스트가 안 부른다.\n"
        f"{listed}"
        "아래 파일에 이 이름을 부르는 실패 테스트를 먼저 쓰고 실패를 확인한 뒤 구현해라.\n"
        f"{covered}"
        "안에서만 쓰는 함수면 export를 떼라 — 내보낸 것은 다른 곳이 부를 수 있다.\n"
    )


guard(verdict)
