#!/usr/bin/env python3
import fnmatch
import json
import os
import subprocess
import sys

DENY_HOOK = 2
DENY_COMMIT = 1
TEMP_PREFIXES = ("/tmp/", "/private/tmp/", "/var/folders/", "/private/var/folders/")
BRANCH_PREFIX_ROLES = {"pm": "pm", "dev": "dev", "ui": "ui", "orch": "orchestrator"}


def fail(mode, message):
    print(message, file=sys.stderr)
    sys.exit(DENY_HOOK if mode == "hook" else DENY_COMMIT)


def load_ownership(mode, project_dir):
    path = os.path.join(project_dir, "config", "ownership.json")
    try:
        with open(path) as f:
            ownership = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        fail(mode, f"ownership-check: {path}를 읽을 수 없다 ({e}). 통과가 아니라 차단이다 — registry를 먼저 고쳐라.")
    if not isinstance(ownership, dict):
        fail(mode, f"ownership-check: {path}는 JSON 객체여야 한다. 차단한다.")
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
            f"ownership-check: 역할 '{role}'이 config/ownership.json에 없다. 차단한다 — "
            "worktree 디렉터리 이름이 곧 역할 키다. 등록된 worktree에서 일하거나 registry에 역할을 등록해라.",
        )
    return patterns


def known_prefix_role(ref):
    if not ref or "/" not in ref:
        return None
    return BRANCH_PREFIX_ROLES.get(ref.split("/", 1)[0])


def prefix_role(mode, ref):
    role = known_prefix_role(ref)
    if role is None:
        known = ", ".join(f"{p}/" for p in sorted(BRANCH_PREFIX_ROLES))
        fail(
            mode,
            f"ownership-check: 브랜치 '{ref}'의 접두가 등록된 역할이 아니다. "
            f"접두는 {known} 중 하나여야 한다 (docs/rules/common.md).",
        )
    return role


def git(project_dir, *args):
    try:
        result = subprocess.run(
            ["git", "-C", project_dir, *args],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return ""
    return result.stdout.strip()


def is_main_worktree(project_dir):
    git_dir = git(project_dir, "rev-parse", "--absolute-git-dir")
    common = git(project_dir, "rev-parse", "--git-common-dir")
    if not git_dir or not common:
        return None
    if not os.path.isabs(common):
        common = os.path.join(project_dir, common)
    return os.path.realpath(git_dir) == os.path.realpath(common)


def worktree_role_keys(mode, project_dir):
    return {key for key in load_ownership(mode, project_dir) if key != "orchestrator"}


def worktree_role(mode, project_dir):
    main_worktree = is_main_worktree(project_dir)
    if main_worktree is None:
        fail(mode, f"ownership-check: '{project_dir}'는 git 작업 트리가 아니다. 차단한다.")
    if main_worktree:
        return "orchestrator"

    name = os.path.basename(os.path.realpath(project_dir))
    keys = worktree_role_keys(mode, project_dir)
    if name not in keys:
        known = ", ".join(sorted(keys))
        fail(
            mode,
            f"ownership-check: worktree '{name}'은 등록된 역할이 아니다. 차단한다 — "
            f"worktree 디렉터리 이름은 {known} 중 하나여야 한다. "
            "총괄은 worktree가 아니라 main 작업 트리에서 일한다 (docs/rules/common.md).",
        )
    return name


def current_branch(project_dir):
    name = git(project_dir, "rev-parse", "--abbrev-ref", "HEAD")
    return "" if name == "HEAD" else name


def resolve_role(mode, project_dir, branch_ref):
    if branch_ref:
        return prefix_role(mode, branch_ref)

    role = worktree_role(mode, project_dir)
    branch = current_branch(project_dir)
    declared = known_prefix_role(branch)
    if declared is not None and declared != role:
        fail(
            mode,
            f"ownership-check: worktree는 '{role}'인데 브랜치 '{branch}'는 '{declared}'의 것이다. "
            "자기 역할의 접두로 브랜치를 다시 따라 (docs/rules/common.md).",
        )
    return role


def check_hook(role, project_dir):
    try:
        payload = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        fail("hook", "ownership-check: 도구 payload를 읽을 수 없다. 차단한다.")
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
            f"ownership-check: 역할 '{role}'은 자기 worktree만 고칠 수 있다(임시 디렉터리와 ~/.claude 제외). "
            f"'{abs_path}'는 그 밖이다. 다른 worktree를 직접 고치지 말고 main에서 통합해라 "
            "(docs/rules/matchers/parallel-work.md).",
        )

    rel = os.path.relpath(abs_path, real_project)
    if owns(rel, role_patterns("hook", role, real_project)):
        sys.exit(0)
    fail(
        "hook",
        f"ownership-check: 역할 '{role}'은 '{rel}'을 소유하지 않는다. 고치지 마라. "
        "소유한 역할에게 [Request] Issue를 열어라 "
        "(docs/rules/common.md, config/ownership.json).",
    )


def check_paths(role, project_dir):
    staged = [line for line in sys.stdin.read().splitlines() if line]
    patterns = role_patterns("paths", role, project_dir)
    bad = [f for f in staged if not owns(f, patterns)]
    if bad:
        print(f"ownership-check: 역할 '{role}'이 소유하지 않은 파일을 건드린다(추가·수정·삭제·rename):", file=sys.stderr)
        for f in bad:
            print(f"  {f}", file=sys.stderr)
        print("소유 밖의 변경은 [Request] Issue로 열어라 (docs/rules/common.md).", file=sys.stderr)
        sys.exit(DENY_COMMIT)


def parse_branch_ref(mode, args):
    if "--branch" not in args:
        return ""
    index = args.index("--branch")
    ref = args[index + 1].strip() if index + 1 < len(args) else ""
    if not ref:
        fail(mode, "ownership-check: --branch에 값이 없다. 차단한다.")
    return ref


def main():
    args = sys.argv[1:]
    mode = args[0] if args else ""
    project_dir = os.environ.get("PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR") or ""
    if mode not in ("hook", "paths") or not project_dir:
        fail(mode or "hook", "ownership-check: mode나 PROJECT_DIR이 없다. 차단한다.")
    real_project = os.path.realpath(project_dir)
    role = resolve_role(mode, real_project, parse_branch_ref(mode, args))
    if mode == "hook":
        check_hook(role, real_project)
    else:
        check_paths(role, real_project)


if __name__ == "__main__":
    main()
