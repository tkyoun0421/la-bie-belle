#!/usr/bin/env python3
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load_owns():
    spec = importlib.util.spec_from_file_location(
        "ownership_check", os.path.join(HERE, "ownership-check.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.owns


def load(name):
    with open(os.path.join(ROOT, "config", name)) as f:
        return json.load(f)


def main():
    try:
        documents = load("documents.json")
        ownership = load("ownership.json")
        owns = load_owns()
    except (OSError, json.JSONDecodeError, AttributeError) as e:
        print(f"registry-check: registry를 읽을 수 없다 ({e}). 통과가 아니라 차단이다.", file=sys.stderr)
        return 1

    orphans = []
    for kind, entry in documents.items():
        path = entry.get("path")
        if path is None:
            continue
        holders = [role for role, patterns in ownership.items() if owns(path, patterns)]
        if len(holders) != 1:
            orphans.append((kind, path, holders))

    if not orphans:
        return 0

    print("registry-check: config/documents.json의 경로가 소유 역할 하나로 떨어지지 않는다. "
          "문서 종류를 만들면서 소유를 정하지 않았거나 두 키가 같은 경로를 물고 있다.", file=sys.stderr)
    for kind, path, holders in orphans:
        owner = ", ".join(holders) if holders else "없음"
        print(f"  {kind}: {path} — 소유 {owner}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
