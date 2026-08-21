#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
import tempfile

DENY_HOOK = 2
DENY_COMMIT = 1

results = []


def repo_root():
    return subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def run(cmd, cwd=None, env=None, stdin=""):
    merged = dict(os.environ)
    if env:
        merged.update(env)
    return subprocess.run(
        cmd, cwd=cwd, env=merged, input=stdin, capture_output=True, text=True
    )


def git(cwd, *args):
    result = run(["git", *args], cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} 실패: {result.stderr.strip()}")
    return result.stdout.strip()


def check(name, got, want):
    results.append((got == want, name))
    suffix = "" if got == want else f"  (exit {got}, 기대 {want})"
    print(f"{'PASS' if got == want else 'FAIL'}  {name}{suffix}")


def build_sandbox(source, root):
    main = os.path.join(root, "main")
    for relative in ("config/ownership.json", "scripts/ownership-check.py",
                     "scripts/secrets-check.py", "githooks/pre-commit"):
        target = os.path.join(main, relative)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy(os.path.join(source, relative.replace("githooks/", ".githooks/")), target)
    os.chmod(os.path.join(main, "githooks", "pre-commit"), 0o755)

    git(main, "init", "-q", "-b", "main")
    git(main, "add", "-A")
    git(main, "commit", "-q", "-m", "init")

    worktrees = {}
    for name in ("pm", "dev", "nonsense"):
        path = os.path.join(root, name)
        git(main, "worktree", "add", "-q", "--detach", path, "HEAD")
        worktrees[name] = path

    for path in (main, *worktrees.values()):
        git(path, "config", "core.hooksPath", os.path.join(main, "githooks"))
        git(path, "config", "user.email", "test@example.com")
        git(path, "config", "user.name", "test")
    return main, worktrees


def module_of(project_dir):
    common = run(["git", "-C", project_dir, "rev-parse", "--git-common-dir"]).stdout.strip()
    if not os.path.isabs(common):
        common = os.path.join(project_dir, common)
    main = os.path.dirname(os.path.realpath(common))
    return os.path.join(main, "scripts", "ownership-check.py")


def judge_paths(project_dir, lines, branch=None):
    args = ["python3", module_of(project_dir), "paths"]
    if branch is not None:
        args += ["--branch", branch]
    return run(args, env={"PROJECT_DIR": project_dir}, stdin="\n".join(lines) + "\n").returncode


def judge_hook(project_dir, file_path):
    payload = json.dumps({"tool_input": {"file_path": file_path}}) if file_path else "{}"
    args = ["python3", module_of(project_dir), "hook"]
    return run(args, env={"PROJECT_DIR": project_dir}, stdin=payload).returncode


def stage_and_commit(worktree, files):
    for relative, body in files.items():
        target = os.path.join(worktree, relative)
        os.makedirs(os.path.dirname(target) or worktree, exist_ok=True)
        with open(target, "w") as f:
            f.write(body)
    git(worktree, "add", "-A")
    return run(["git", "commit", "-q", "-m", "t"], cwd=worktree).returncode


def discard(worktree, *paths):
    run(["git", "reset", "-q", "HEAD"], cwd=worktree)
    run(["git", "checkout", "-q", "--", "."], cwd=worktree)
    for path in paths:
        full = os.path.join(worktree, path)
        shutil.rmtree(full, ignore_errors=True)
        if os.path.isfile(full):
            os.remove(full)


def role_comes_from_worktree(main, worktrees):
    git(main, "checkout", "-q", "-b", "orch/t")
    check("main 작업 트리는 총괄이라 모든 경로를 지난다",
          judge_paths(main, ["docs/rules/a.md", "src/a.ts", "docs/ui/a.md"]), 0)

    git(worktrees["pm"], "checkout", "-q", "-b", "pm/t")
    check("pm worktree는 자기 소유 경로를 지난다",
          judge_paths(worktrees["pm"], ["docs/specs/a.md"]), 0)
    check("pm worktree는 dev 소유 경로에서 막힌다",
          judge_paths(worktrees["pm"], ["src/a.ts"]), DENY_COMMIT)

    git(worktrees["pm"], "checkout", "-q", "-b", "dev/t")
    check("worktree 이름과 브랜치 접두가 어긋나면 막는다",
          judge_paths(worktrees["pm"], ["docs/specs/a.md"]), DENY_COMMIT)

    git(worktrees["pm"], "checkout", "-q", "--detach", "HEAD")
    check("유휴 detached worktree는 디렉터리 이름 하나로 판정한다",
          judge_paths(worktrees["pm"], ["docs/specs/a.md"]), 0)

    git(worktrees["nonsense"], "checkout", "-q", "-b", "pm/t2")
    check("등록되지 않은 이름의 worktree는 막는다",
          judge_paths(worktrees["nonsense"], ["docs/specs/a.md"]), DENY_COMMIT)


def role_comes_from_branch_prefix(main):
    check("--branch dev/… 는 dev로 판정한다",
          judge_paths(main, ["src/a.ts"], branch="dev/t"), 0)
    check("--branch pm/… 에 dev 경로를 주면 막는다",
          judge_paths(main, ["src/a.ts"], branch="pm/t"), DENY_COMMIT)
    check("--branch orch/… 는 총괄이라 모두 지난다",
          judge_paths(main, ["src/a.ts"], branch="orch/t"), 0)
    check("등록되지 않은 접두는 막는다",
          judge_paths(main, ["docs/rules/a.md"], branch="feat/t"), DENY_COMMIT)
    check("--branch 값이 비면 막는다",
          judge_paths(main, ["docs/rules/a.md"], branch=""), DENY_COMMIT)
    check("접두가 아예 없는 이름은 막는다",
          judge_paths(main, ["docs/rules/a.md"], branch="main"), DENY_COMMIT)


def hook_guards_edit_time(worktrees):
    pm, dev = worktrees["pm"], worktrees["dev"]
    git(pm, "checkout", "-q", "pm/t")
    check("훅: 자기 소유 경로는 지난다",
          judge_hook(pm, os.path.join(pm, "docs/specs/a.md")), 0)
    check("훅: 소유 밖 경로는 막는다",
          judge_hook(pm, os.path.join(pm, "src/a.ts")), DENY_HOOK)
    check("훅: 다른 worktree의 절대 경로는 막는다",
          judge_hook(pm, os.path.join(dev, "src/a.ts")), DENY_HOOK)
    check("훅: 임시 디렉터리는 예외다",
          judge_hook(pm, "/tmp/scratch.md"), 0)
    check("훅: ~/.claude는 예외다",
          judge_hook(pm, os.path.join(os.path.expanduser("~"), ".claude", "x.md")), 0)
    check("훅: file_path가 없는 payload는 지난다",
          judge_hook(pm, None), 0)


def registry_failure_closes(main, worktrees):
    copies = [os.path.join(tree, "config", "ownership.json")
              for tree in (main, worktrees["pm"])]
    saved = {}
    for path in copies:
        with open(path) as f:
            saved[path] = f.read()
        with open(path, "w") as f:
            f.write("{ not json")
    check("registry를 읽을 수 없으면 통과가 아니라 차단이다",
          judge_paths(main, ["docs/rules/a.md"], branch="orch/t"), DENY_COMMIT)
    check("registry가 깨지면 훅도 막는다",
          judge_hook(worktrees["pm"], os.path.join(worktrees["pm"], "docs/specs/a.md")), DENY_HOOK)
    for path, body in saved.items():
        with open(path, "w") as f:
            f.write(body)


def precommit_blocks_secrets_and_foreign_paths(main, worktrees):
    pm = worktrees["pm"]
    git(pm, "checkout", "-q", "pm/t")
    check("pre-commit: 소유 경로는 커밋된다",
          stage_and_commit(pm, {"docs/specs/a.md": "x\n"}), 0)
    check("pre-commit: 소유 밖 경로는 막는다",
          stage_and_commit(pm, {"src/a.ts": "x\n"}), DENY_COMMIT)
    discard(pm, "src")

    git(main, "checkout", "-q", "orch/t")
    check("pre-commit: .env는 총괄도 막는다",
          stage_and_commit(main, {".env": "K=v\n"}), DENY_COMMIT)
    discard(main, ".env")

    check("pre-commit: 트리 깊은 곳의 .env도 막는다",
          stage_and_commit(main, {"docs/notes/.env.local": "K=v\n"}), DENY_COMMIT)
    discard(main, "docs")

    check("pre-commit: .env.example만 예외다",
          stage_and_commit(main, {".env.example": "K=\n"}), 0)

    check("pre-commit: 탭이 든 디렉터리 안의 .env도 막는다",
          stage_and_commit(main, {"tab\there/.env": "K=v\n"}), DENY_COMMIT)
    discard(main, "tab\there")

    check("pre-commit: 따옴표가 든 디렉터리 안의 .env도 막는다",
          stage_and_commit(main, {'quote"here/.env': "K=v\n"}), DENY_COMMIT)
    discard(main, 'quote"here')

    check("pre-commit: 한글 디렉터리 안의 .env도 막는다",
          stage_and_commit(main, {"문서 폴더/.env": "K=v\n"}), DENY_COMMIT)
    discard(main, "문서 폴더")

    check("pre-commit: 한글 문서는 secrets에 걸리지 않는다",
          stage_and_commit(main, {"docs/ui/화면.md": "x\n"}), 0)

    with open(os.path.join(main, ".env"), "w") as f:
        f.write("K=v\n")
    git(main, "add", "-A")
    run(["git", "commit", "-q", "--no-verify", "-m", "seed"], cwd=main)
    os.remove(os.path.join(main, ".env"))
    git(main, "add", "-A")
    check("pre-commit: 이미 커밋된 .env를 지우는 커밋도 막는다 — --no-verify가 필요하다",
          run(["git", "commit", "-q", "-m", "drop"], cwd=main).returncode, DENY_COMMIT)


def main():
    source = repo_root()
    root = tempfile.mkdtemp(prefix=".ownership-test-", dir=os.path.expanduser("~"))
    try:
        sandbox, worktrees = build_sandbox(source, root)
        role_comes_from_worktree(sandbox, worktrees)
        role_comes_from_branch_prefix(sandbox)
        hook_guards_edit_time(worktrees)
        registry_failure_closes(sandbox, worktrees)
        precommit_blocks_secrets_and_foreign_paths(sandbox, worktrees)
    finally:
        shutil.rmtree(root, ignore_errors=True)

    failed = [name for ok, name in results if not ok]
    print(f"\n{len(results) - len(failed)}/{len(results)} 통과")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
