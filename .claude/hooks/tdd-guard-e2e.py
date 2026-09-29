#!/usr/bin/env python3
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import exists, guard

E2E_ROOT = "tests/e2e"

# Maestro 플로우는 YAML이다(ADR-013).
FLOW_SUFFIX = ".yaml"

# 라우트가 세우는 슬라이스다 — `@/screens/<이름>/...`.
SCREEN_IMPORT = re.compile(r"""["']@/screens/([^/"']+)/""")


def route_slice(text):
    """라우트가 부르는 슬라이스 이름. 화면을 아직 안 붙인 라우트는 `None`이다."""
    found = SCREEN_IMPORT.search(text)
    return found.group(1) if found else None


def spec_name(path):
    # 화면은 `.tsx`다(ADR-001). `src/screens/` 아래 순수 계산 `.ts`까지
    # 화면으로 읽으면 플로우가 있을 수 없는 파일을 막는다.
    if not path.endswith(".tsx"):
        return None

    if path.startswith("src/screens/"):
        parts = path.split("/")
        # 슬라이스 이름은 디렉터리다 — `src/screens/<이름>/...`. 디렉터리를 안 끼고
        # 바로 선 화면은 제 파일명이 이름이다. 그런 자리를 그냥 통과시키면 게이트를
        # 끄는 구멍이 된다.
        if len(parts) > 3:
            return parts[2]

        return parts[2][: -len(".tsx")]

    return None


def verdict(path, read):
    # 라우트는 얇다(CLAUDE.md) — 화면은 슬라이스가 들고 라우트는 그것을 부르기만 한다.
    # 그래서 라우트의 짝도 제 파일명이 아니라 **부르는 슬라이스**의 플로우다. 파일명으로
    # 찾으면 `src/app/admin/stats.tsx`와 `src/app/stats.tsx`가 같은 `stats.yaml`을 가리켜
    # 한쪽이 남의 증거로 열린다(관찰 021).
    #
    # 보는 것은 저장된 파일이 아니라 **이번에 쓰려는 조각**이다 — 라우트를 세우는 걸음이
    # 화면을 붙이는 걸음이라 그 조각에 import가 있고, 판정에 안 쓰는 파일을 읽지 않는다.
    if path.startswith("src/app/") and path.endswith(".tsx"):
        name = route_slice(read("incoming"))
        if not name:
            return None
    else:
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
