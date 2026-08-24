#!/usr/bin/env python3
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

FIELDS = ("owner", "status", "related_adr", "related_issue")
DECISION_STATUSES = ("proposed", "accepted", "superseded")
DOCUMENT_STATUSES = ("draft", "active", "superseded")

RELATED_ISSUE = re.compile(r"^#\d+(, #\d+)*$")
RELATED_ADR = re.compile(r"^(ADR|TDR)-\d+(, (ADR|TDR)-\d+)*$")
FRONT_MATTER_LINE = re.compile(r'^([a-z_]+):\s*(?:"(.*)"|(.*))$')


def load(name):
    with open(os.path.join(ROOT, "config", name)) as f:
        return json.load(f)


def handle_for_role(role):
    return "@orchestrator" if role == "orchestrator" else f"@agent-{role}"


def decision_places(documents):
    dirs = []
    templates = []
    for kind in ("adr", "tdr"):
        entry = documents.get(kind)
        if not entry:
            continue
        if entry.get("path"):
            dirs.append(os.path.dirname(entry["path"]).rstrip("/") + "/")
        if entry.get("template"):
            templates.append(entry["template"])
    return dirs, templates


def markdown_files(docs_dir):
    found = []
    for current, _, names in os.walk(docs_dir):
        for name in sorted(names):
            if name.endswith(".md"):
                found.append(os.path.join(current, name))
    return sorted(found)


def parse_front_matter(text):
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return None, "front matter가 없다. 첫 줄이 `---`여야 한다"

    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            body = lines[1:index]
            break
    else:
        return None, "front matter가 닫히지 않았다. 닫는 `---`가 없다"

    fields = {}
    for line in body:
        if not line.strip():
            continue
        match = FRONT_MATTER_LINE.match(line)
        if not match:
            return None, f"front matter의 줄을 읽을 수 없다: {line.strip()}"
        key, quoted, bare = match.groups()
        fields[key] = quoted if quoted is not None else bare.strip()
    return fields, None


def check(path, decision, handles):
    with open(path, encoding="utf-8") as f:
        text = f.read()

    fields, error = parse_front_matter(text)
    if error:
        return [error]

    problems = []

    missing = [field for field in FIELDS if field not in fields]
    if missing:
        problems.append(f"필드가 없다: {', '.join(missing)}")

    unknown = [key for key in fields if key not in FIELDS]
    if unknown:
        problems.append(f"모르는 필드가 있다: {', '.join(sorted(unknown))}")

    owner = fields.get("owner")
    if owner is not None and owner not in handles:
        problems.append(f"owner '{owner}'는 역할 이름이 아니다. 쓸 수 있는 것: {', '.join(handles)}")

    status = fields.get("status")
    allowed = DECISION_STATUSES if decision else DOCUMENT_STATUSES
    if status is not None and status not in allowed:
        kind = "결정 기록" if decision else "문서"
        problems.append(f"status '{status}'는 {kind}의 어휘가 아니다. 쓸 수 있는 것: {', '.join(allowed)}")

    related_issue = fields.get("related_issue")
    if related_issue and not RELATED_ISSUE.match(related_issue):
        problems.append(
            f"related_issue '{related_issue}'의 형태가 아니다. `#42` 또는 `#42, #69`이고 없으면 빈 문자열이다"
        )

    related_adr = fields.get("related_adr")
    if related_adr and not RELATED_ADR.match(related_adr):
        problems.append(
            f"related_adr '{related_adr}'의 형태가 아니다. `ADR-001` 또는 `TDR-001`이고 없으면 빈 문자열이다"
        )

    return problems


def main():
    try:
        documents = load("documents.json")
        ownership = load("ownership.json")
    except (OSError, json.JSONDecodeError) as e:
        print(f"docs-check: registry를 읽을 수 없다 ({e}). 통과가 아니라 차단이다.", file=sys.stderr)
        return 1

    handles = [handle_for_role(role) for role in ownership]
    dirs, templates = decision_places(documents)
    docs_dir = os.path.join(ROOT, "docs")

    if not os.path.isdir(docs_dir):
        return 0

    failures = []
    for path in markdown_files(docs_dir):
        rel = os.path.relpath(path, ROOT)
        decision = rel in templates or any(rel.startswith(d) for d in dirs)
        try:
            problems = check(path, decision, handles)
        except OSError as e:
            failures.append((rel, [f"파일을 읽을 수 없다 ({e})"]))
            continue
        if problems:
            failures.append((rel, problems))

    if not failures:
        return 0

    print(
        "docs-check: front matter가 규격과 어긋난다. 규격은 "
        "docs/rules/matchers/writing-docs.md의 front matter 절에 있다.",
        file=sys.stderr,
    )
    for rel, problems in failures:
        print(f"  {rel}", file=sys.stderr)
        for problem in problems:
            print(f"    {problem}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
