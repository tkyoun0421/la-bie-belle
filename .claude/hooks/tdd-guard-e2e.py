#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import exists, guard

E2E_ROOT = "tests/e2e"

# Expo Router는 `src/app/` 아래 `.tsx`를 전부 라우트로 읽는다. 디렉터리를
# 대표하는 둘은 그 디렉터리 이름으로, 나머지는 제 파일명으로 스펙을 찾는다.
DIRECTORY_ROUTES = ("index.tsx", "_layout.tsx")


def spec_name(path):
    if path.startswith("src/screens/"):
        parts = path.split("/")
        return parts[2] if len(parts) > 2 else None

    if path.startswith("src/app/"):
        directory, filename = os.path.split(path)
        if not filename.endswith(".tsx"):
            return None

        if filename not in DIRECTORY_ROUTES:
            return filename[: -len(".tsx")]

        segments = [
            part
            for part in directory[len("src/app/"):].split("/")
            if part and not part.startswith("(") and not part.startswith("@")
        ]
        return segments[-1] if segments else "home"

    return None


def verdict(path, _read):
    # e2e 러너를 아직 안 골랐다(ADR-011이 Maestro와 Detox를 열어뒀다).
    # 쓸 자리가 없는 동안은 아무것도 요구하지 않는다.
    if not exists(E2E_ROOT):
        return None

    name = spec_name(path)
    if not name:
        return None

    expected = f"{E2E_ROOT}/{name}.spec.ts"
    if exists(expected):
        return None

    return (
        f"TDD 차단: {path} 는 화면인데 e2e 테스트가 없다.\n"
        f"{expected} 를 먼저 쓰고, 그 테스트가 실패하는 것을 확인한 뒤 구현해라.\n"
    )


guard(verdict)
