#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import exists, guard

E2E_ROOT = "tests/e2e"

# Maestro 플로우는 YAML이다(ADR-013).
FLOW_SUFFIX = ".yaml"

# Expo Router는 `src/app/` 아래 `.tsx`를 전부 라우트로 읽는다. 디렉터리를
# 대표하는 둘은 그 디렉터리 이름으로, 나머지는 제 파일명으로 플로우를 찾는다.
DIRECTORY_ROUTES = ("index.tsx", "_layout.tsx")


def spec_name(path):
    # 화면은 `.tsx`다(ADR-001). `src/screens/` 아래 순수 계산 `.ts`까지
    # 화면으로 읽으면 플로우가 있을 수 없는 파일을 막는다.
    if not path.endswith(".tsx"):
        return None

    if path.startswith("src/screens/"):
        parts = path.split("/")
        # 슬라이스 이름은 디렉터리다 — `src/screens/<이름>/...`.
        return parts[2] if len(parts) > 3 else None

    if path.startswith("src/app/"):
        directory, filename = os.path.split(path)

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
    name = spec_name(path)
    if not name:
        return None

    expected = f"{E2E_ROOT}/{name}{FLOW_SUFFIX}"
    if exists(expected):
        return None

    return (
        f"TDD 차단: {path} 는 화면인데 e2e 플로우가 없다.\n"
        f"{expected} 를 먼저 쓰고, 그 플로우가 실패하는 것을 확인한 뒤 구현해라.\n"
    )


guard(verdict)
