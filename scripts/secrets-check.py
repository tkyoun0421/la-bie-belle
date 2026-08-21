#!/usr/bin/env python3
import re
import sys

RENAME = re.compile(r"^[RC][0-9]*$")
SECRET = re.compile(r"(?:^|/)(?:\.env(?:\..+)?|\.envrc)$")
ALLOWED = re.compile(r"(?:^|/)\.env\.example$")


def read_records():
    chunks = sys.stdin.buffer.read().split(b"\0")
    if chunks and chunks[-1] == b"":
        chunks.pop()
    return [chunk.decode("utf-8", "surrogateescape") for chunk in chunks]


def paths_from(records):
    collected = []
    index = 0
    while index < len(records):
        wanted = 2 if RENAME.match(records[index]) else 1
        collected.extend(records[index + 1:index + 1 + wanted])
        index += 1 + wanted
    return collected


def emit(paths):
    newlined = [p for p in paths if "\n" in p or "\r" in p]
    if newlined:
        print("secrets-check: 경로에 개행이 든 파일은 이 저장소에서 다루지 않는다. 차단한다 — "
              "아래 경로를 개행 없는 이름으로 바꿔라.", file=sys.stderr)
        for path in newlined:
            print(f"  {path!r}", file=sys.stderr)
        return 1
    stream = sys.stdout.buffer
    for path in paths:
        stream.write(path.encode("utf-8", "surrogateescape") + b"\0")
    return 0


def scan(paths):
    caught = [p for p in paths if SECRET.search(p) and not ALLOWED.search(p)]
    if not caught:
        return 0
    print("secrets-check: .env·.envrc 파일은 트리 어디에도 커밋하지 않는다. 저장소가 공개라 지운 커밋도 남는다.", file=sys.stderr)
    for path in caught:
        print(f"  {path}", file=sys.stderr)
    return 1


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode not in ("paths", "scan"):
        print("secrets-check: mode가 paths도 scan도 아니다. 차단한다.", file=sys.stderr)
        return 1
    records = read_records()
    return emit(paths_from(records)) if mode == "paths" else scan(records)


if __name__ == "__main__":
    sys.exit(main())
