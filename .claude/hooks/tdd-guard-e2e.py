#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import exists, guard

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


def verdict(path, _read):
    name = spec_name(path)
    if not name:
        return None

    expected = f"tests/e2e/{name}.spec.ts"
    if exists(expected):
        return None

    return (
        f"TDD 차단: {path} 는 화면인데 e2e 테스트가 없다.\n"
        f"{expected} 를 먼저 쓰고, 그 테스트가 실패하는 것을 확인한 뒤 구현해라.\n"
    )


guard(verdict)
