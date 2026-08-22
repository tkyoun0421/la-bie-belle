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


def splits_into_lines(path):
    return path.splitlines() != [path]


def emit(paths):
    breaking = [p for p in paths if splits_into_lines(p)]
    if breaking:
        print("secrets-check: 줄바꿈으로 읽히는 문자가 든 경로는 이 저장소에서 다루지 않는다. 차단한다 — "
              "소유 검사가 줄 단위로 읽어서 경로 하나가 조각으로 갈린다. 아래 경로의 이름을 바꿔라.",
              file=sys.stderr)
        for path in breaking:
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
