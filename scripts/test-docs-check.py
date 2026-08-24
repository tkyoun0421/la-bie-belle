#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
import tempfile

results = []

VALID = """---
owner: "@agent-pm"
status: "active"
related_adr: ""
related_issue: "#42"
---

# 문서
"""


def repo_root():
    return subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def check(name, got, want):
    results.append((got == want, name))
    suffix = "" if got == want else f"  (exit {got}, 기대 {want})"
    print(f"{'PASS' if got == want else 'FAIL'}  {name}{suffix}")


def build_sandbox(source, root):
    for relative in ("config/ownership.json", "config/documents.json",
                     "scripts/docs-check.py"):
        target = os.path.join(root, relative)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy(os.path.join(source, relative), target)
    os.makedirs(os.path.join(root, "docs"), exist_ok=True)


def write(root, relative, text):
    target = os.path.join(root, relative)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        f.write(text)
    return target


def run_check(root):
    return subprocess.run(
        [sys.executable, os.path.join(root, "scripts", "docs-check.py")],
        capture_output=True, text=True,
    ).returncode


def case(root, name, relative, text, want):
    target = write(root, relative, text)
    try:
        check(name, run_check(root), want)
    finally:
        os.remove(target)


def decision_path(root, kind):
    with open(os.path.join(root, "config", "documents.json")) as f:
        documents = json.load(f)
    directory = os.path.dirname(documents[kind]["path"])
    return os.path.join(directory, f"{kind.upper()}-001-test.md")


def main():
    source = repo_root()
    with tempfile.TemporaryDirectory() as root:
        build_sandbox(source, root)

        check("빈 docs 트리는 통과한다", run_check(root), 0)

        case(root, "필드 넷을 갖춘 문서는 통과한다",
             "docs/ok.md", VALID, 0)

        case(root, "front matter가 없으면 막는다",
             "docs/bare.md", "# 제목만 있다\n", 1)

        case(root, "front matter가 닫히지 않으면 막는다",
             "docs/unclosed.md", '---\nowner: "@agent-pm"\n\n# 본문\n', 1)

        case(root, "필드가 빠지면 막는다",
             "docs/missing.md",
             '---\nowner: "@agent-pm"\nstatus: "active"\nrelated_adr: ""\n---\n', 1)

        case(root, "모르는 필드가 있으면 막는다",
             "docs/extra.md", VALID.replace('related_issue: "#42"',
                                            'related_issue: "#42"\nupdated: "2026-08-24"'), 1)

        case(root, "owner가 역할 이름이 아니면 막는다",
             "docs/owner.md", VALID.replace('"@agent-pm"', '"@agent-qa"'), 1)

        case(root, "총괄 handle은 통과한다",
             "docs/orch.md", VALID.replace('"@agent-pm"', '"@orchestrator"'), 0)

        case(root, "문서에 결정 기록 어휘를 쓰면 막는다",
             "docs/status.md", VALID.replace('"active"', '"accepted"'), 1)

        case(root, "모르는 status는 막는다",
             "docs/unknown-status.md", VALID.replace('"active"', '"done"'), 1)

        case(root, "결정 기록은 accepted를 받는다",
             decision_path(root, "adr"), VALID.replace('"active"', '"accepted"'), 0)

        case(root, "결정 기록에 문서 어휘를 쓰면 막는다",
             decision_path(root, "adr"), VALID, 1)

        case(root, "TDR도 결정 기록 어휘를 받는다",
             decision_path(root, "tdr"), VALID.replace('"active"', '"proposed"'), 0)

        case(root, "related_issue가 빈 문자열이면 통과한다",
             "docs/no-issue.md", VALID.replace('"#42"', '""'), 0)

        case(root, "related_issue 여럿은 쉼표로 나열한다",
             "docs/many-issues.md", VALID.replace('"#42"', '"#42, #69"'), 0)

        case(root, "related_issue에 번호가 아닌 값이 들면 막는다",
             "docs/bad-issue.md", VALID.replace('"#42"', '"42"'), 1)

        case(root, "related_issue의 구분자가 다르면 막는다",
             "docs/bad-separator.md", VALID.replace('"#42"', '"#42 #69"'), 1)

        case(root, "related_adr은 ADR-00N 형태를 받는다",
             "docs/adr-ref.md", VALID.replace('related_adr: ""', 'related_adr: "ADR-001"'), 0)

        case(root, "related_adr에 아무 문자열이나 들면 막는다",
             "docs/bad-adr.md", VALID.replace('related_adr: ""', 'related_adr: "결제 결정"'), 1)

        case(root, "하위 디렉터리도 훑는다",
             "docs/deep/nested/thing.md", "# front matter가 없다\n", 1)

    failed = [name for ok, name in results if not ok]
    print()
    if failed:
        print(f"{len(results) - len(failed)}/{len(results)} 통과, {len(failed)}건 실패")
        return 1
    print(f"{len(results)}/{len(results)} 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
