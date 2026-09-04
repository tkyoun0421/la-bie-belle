#!/usr/bin/env python3
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from guard import ROOT, guard

FEATURE_PREFIX = "feat/"
SPEC_DIR = "docs/2-design/spec"
APPROVED = "approved"

FRONTMATTER = re.compile(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(\r?\n|\Z)", re.DOTALL)
STATUS = re.compile(r"^status:[ \t]*['\"]?([^'\"\r\n]*?)['\"]?[ \t]*$", re.MULTILINE)


def feature_slug():
    try:
        branch = subprocess.run(
            ["git", "-C", ROOT, "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return None

    if branch.returncode != 0:
        return None

    name = branch.stdout.strip()
    if not name.startswith(FEATURE_PREFIX):
        return None

    return name[len(FEATURE_PREFIX) :]


def spec_status(relative_path):
    """approved 같은 status 문자열. 프론트매터가 없으면 "", 파일이 없으면 None"""
    try:
        with open(
            os.path.join(ROOT, relative_path), encoding="utf-8", errors="ignore"
        ) as handle:
            body = handle.read()
    except OSError:
        return None

    frontmatter = FRONTMATTER.match(body)
    if not frontmatter:
        return ""

    status = STATUS.search(frontmatter.group(1))
    return status.group(1).strip() if status else ""


def found_phrase(status):
    if status is None:
        return "그 파일이 아직 없다"
    if status == "":
        return "프론트매터에 status가 없다"
    return f"status가 {status}다"


def verdict(path, _read):
    if not path.startswith("src/"):
        return None

    slug = feature_slug()
    if slug is None:
        return None

    spec = f"{SPEC_DIR}/{slug}.md"
    status = spec_status(spec)
    if status == APPROVED:
        return None

    return (
        f"spec 차단: {path} 는 {FEATURE_PREFIX}{slug} 브랜치의 src/ 수정인데 "
        "승인된 spec이 없다.\n"
        f"{spec} 를 확인했다 — {found_phrase(status)}.\n"
        f"spec을 먼저 쓰고 총괄이 status: {APPROVED} 로 승인한 뒤에 구현해라.\n"
        f"슬러그는 {FEATURE_PREFIX} 뒤 나머지 전체이고 spec 파일명과 같아야 한다.\n"
    )


guard(verdict)
