#!/usr/bin/env python3
import json
import os
import sys

ROOT = os.path.abspath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())

CONTENT_KEYS = ("content", "new_string")


def exists(relative_path):
    return os.path.exists(os.path.join(ROOT, relative_path))


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


def _content(tool_input, relative_path):
    incoming = "\n".join(str(tool_input.get(key, "")) for key in CONTENT_KEYS)
    if relative_path.startswith(".."):
        return incoming
    try:
        with open(
            os.path.join(ROOT, relative_path), encoding="utf-8", errors="ignore"
        ) as handle:
            return handle.read()
    except OSError:
        return incoming


def guard(verdict):
    """verdict(relative_path, content) -> 막는 이유 문자열 또는 None"""
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

    reason = verdict(relative_path, _content(tool_input, relative_path))
    if not reason:
        sys.exit(0)

    sys.stderr.write(reason)
    sys.exit(2)
