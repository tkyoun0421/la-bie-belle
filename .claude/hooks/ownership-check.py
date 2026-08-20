#!/usr/bin/env python3
import fnmatch
import json
import os
import sys

DENY_HOOK = 2
DENY_COMMIT = 1
TEMP_PREFIXES = ("/tmp/", "/private/tmp/", "/var/folders/", "/private/var/folders/")


def fail(mode, message):
    print(message, file=sys.stderr)
    sys.exit(DENY_HOOK if mode == "hook" else DENY_COMMIT)


def load_ownership(mode, project_dir):
    path = os.path.join(project_dir, "config", "ownership.json")
    try:
        with open(path) as f:
            ownership = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        fail(mode, f"ownership-check: cannot read {path} ({e}). Failing closed — fix the ownership registry first.")
    if not isinstance(ownership, dict):
        fail(mode, f"ownership-check: {path} must be a JSON object. Failing closed.")
    return ownership


def owns(rel, patterns):
    for p in patterns:
        if p.endswith("/"):
            if rel == p.rstrip("/") or rel.startswith(p):
                return True
        elif rel == p or fnmatch.fnmatch(rel, p):
            return True
    return False


def role_patterns(mode, role, project_dir):
    ownership = load_ownership(mode, project_dir)
    patterns = ownership.get(role)
    if patterns is None:
        fail(
            mode,
            f"ownership-check: role '{role}' is not registered in config/ownership.json. "
            "Failing closed — fix .agent-role or register the role.",
        )
    return patterns


def check_hook(role, project_dir):
    try:
        payload = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        fail("hook", "ownership-check: unreadable tool payload. Failing closed.")
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if not file_path:
        sys.exit(0)

    real_project = os.path.realpath(project_dir)
    abs_path = os.path.realpath(
        file_path if os.path.isabs(file_path) else os.path.join(real_project, file_path)
    )

    if not abs_path.startswith(real_project + os.sep):
        home_claude = os.path.join(os.path.expanduser("~"), ".claude") + os.sep
        if abs_path.startswith(TEMP_PREFIXES) or abs_path.startswith(home_claude):
            sys.exit(0)
        fail(
            "hook",
            f"ownership-check: role '{role}' may only edit its own worktree "
            f"(plus temp and ~/.claude). '{abs_path}' is outside it. "
            "Never edit other worktrees directly — integrate through main (docs/rules.md §4).",
        )

    rel = os.path.relpath(abs_path, real_project)
    if owns(rel, role_patterns("hook", role, real_project)):
        sys.exit(0)
    fail(
        "hook",
        f"ownership-check: role '{role}' does not own '{rel}'. Do not edit it. "
        "Request the change from the owning agent via Issue or PR comment "
        "(docs/rules.md, config/ownership.json).",
    )


def check_paths(role, project_dir):
    staged = [line for line in sys.stdin.read().splitlines() if line]
    patterns = role_patterns("paths", role, project_dir)
    bad = [f for f in staged if not owns(f, patterns)]
    if bad:
        print(f"pre-commit: role '{role}' is touching files it does not own (add/modify/delete/rename):", file=sys.stderr)
        for f in bad:
            print(f"  {f}", file=sys.stderr)
        print("Request changes outside your ownership via Issue or PR comment (docs/rules.md).", file=sys.stderr)
        sys.exit(DENY_COMMIT)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    role = os.environ.get("ROLE", "")
    project_dir = os.environ.get("PROJECT_DIR", "")
    if mode not in ("hook", "paths") or not role or not project_dir:
        fail(mode or "hook", "ownership-check: missing mode, ROLE, or PROJECT_DIR. Failing closed.")
    if mode == "hook":
        check_hook(role, project_dir)
    else:
        check_paths(role, project_dir)


if __name__ == "__main__":
    main()
