#!/usr/bin/env python3
import json
import os
import sys

ROOT = os.path.abspath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())

CONTENT_KEYS = ("content", "new_string")


def exists(relative_path):
    return os.path.exists(os.path.join(ROOT, relative_path))


def contents(relative_path):
    """저장된 파일을 읽는다. 없거나 못 읽으면 빈 문자열이다."""
    try:
        with open(
            os.path.join(ROOT, relative_path), encoding="utf-8", errors="ignore"
        ) as handle:
            return handle.read()
    except OSError:
        return ""


def _payload():
    try:
        return json.load(sys.stdin)
    except Exception:
        return None


def _relative_path(raw_path):
    try:
        return os.path.relpath(os.path.abspath(raw_path), ROOT)
    except ValueError:
        return None


def _reader(tool_input, relative_path):
    incoming = "\n".join(str(tool_input.get(key, "")) for key in CONTENT_KEYS)

    def read(source="disk"):
        """`"disk"`는 지금 저장된 내용, `"incoming"`은 이번에 쓰려는 조각이다."""
        if source == "incoming" or relative_path.startswith(".."):
            return incoming
        try:
            with open(
                os.path.join(ROOT, relative_path), encoding="utf-8", errors="ignore"
            ) as handle:
                return handle.read()
        except OSError:
            return incoming

    return read


def guard(verdict):
    """verdict(relative_path, read) -> 막는 이유 문자열 또는 None"""
    payload = _payload()
    if payload is None:
        sys.exit(0)

    tool_input = payload.get("tool_input") or {}
    raw_path = tool_input.get("file_path")
    if not raw_path:
        sys.exit(0)

    relative_path = _relative_path(raw_path)
    if relative_path is None:
        sys.exit(0)

    reason = verdict(relative_path, _reader(tool_input, relative_path))
    if not reason:
        sys.exit(0)

    sys.stderr.write(reason)
    sys.exit(2)
