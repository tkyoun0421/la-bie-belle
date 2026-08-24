#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
import tempfile

results = []

PASSING = """# Gates: 시험

- [ ] G1: 스펙 1.1
  CHECK: echo verification passed
  EXPECT: verification passed
  EVIDENCE: pending
"""


def repo_root():
    return subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def check(name, got, want):
    ok = got == want
    results.append((ok, name))
    suffix = "" if ok else f"  ({got!r}, 기대 {want!r})"
    print(f"{'PASS' if ok else 'FAIL'}  {name}{suffix}")


def build_sandbox(source, root):
    target = os.path.join(root, "scripts", "gate-check.py")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    shutil.copy(os.path.join(source, "scripts", "gate-check.py"), target)
    os.makedirs(os.path.join(root, ".gates"), exist_ok=True)


def write(root, name, text):
    target = os.path.join(root, ".gates", name)
    with open(target, "w", encoding="utf-8") as f:
        f.write(text)
    return target


def clear(root):
    for entry in os.listdir(os.path.join(root, ".gates")):
        os.remove(os.path.join(root, ".gates", entry))


def run(root, *args, stdin=""):
    return subprocess.run(
        [sys.executable, os.path.join(root, "scripts", "gate-check.py"), *args],
        capture_output=True, text=True, input=stdin,
        env={**os.environ, "PROJECT_DIR": root},
    )


def ledger_text(root, name="slice.md"):
    with open(os.path.join(root, ".gates", name), encoding="utf-8") as f:
        return f.read()


def case(root, name, text, args, want):
    write(root, "slice.md", text)
    try:
        check(name, run(root, *args).returncode, want)
    finally:
        clear(root)


def hook_payload(session="s1"):
    return json.dumps({"session_id": session, "stop_hook_active": False})


def main():
    source = repo_root()
    with tempfile.TemporaryDirectory() as root:
        build_sandbox(source, root)

        case(root, "통과하는 실행 gate는 0으로 끝난다",
             PASSING, ["--run"], 0)

        case(root, "EXPECT가 맞아도 종료 코드가 0이 아니면 미충족이다",
             PASSING.replace("echo verification passed",
                             "sh -c 'echo verification passed; exit 3'"),
             ["--run"], 1)

        case(root, "EXPECT가 출력에 없으면 미충족이다",
             PASSING.replace("EXPECT: verification passed", "EXPECT: 없는 표식"),
             ["--run"], 1)

        case(root, "정규식 EXPECT를 받는다",
             PASSING.replace("EXPECT: verification passed", "EXPECT: /^verification\\s+passed$/m"),
             ["--run"], 0)

        case(root, "깨진 정규식은 오류다",
             PASSING.replace("EXPECT: verification passed", "EXPECT: /(unclosed/"),
             ["--status"], 2)

        case(root, "모르는 정규식 플래그는 오류다",
             PASSING.replace("EXPECT: verification passed", "EXPECT: /passed/z"),
             ["--status"], 2)

        case(root, "CHECK만 있고 EXPECT가 없으면 오류다",
             PASSING.replace("  EXPECT: verification passed\n", ""),
             ["--status"], 2)

        case(root, "CHECK도 EXPECT도 없는 수동 gate는 오류다",
             "# Gates\n\n- [ ] G1: 사람이 눌러 본다\n  EVIDENCE: pending\n",
             ["--status"], 2)

        case(root, "같은 id가 두 번 나오면 오류다",
             PASSING + PASSING.split("\n", 2)[2],
             ["--status"], 2)

        case(root, "gate가 없는 원장은 ALL MET이 아니라 오류다",
             "# Gates: 빈 원장\n\n할 말이 없다.\n",
             ["--status"], 2)

        case(root, "들여쓰지 않은 CHECK는 오류다",
             PASSING.replace("  CHECK:", "CHECK:"),
             ["--status"], 2)

        case(root, "코드 펜스 안의 gate는 세지 않는다",
             "# Gates\n\n```markdown\n- [ ] G1: 예시\n  CHECK: true\n  EXPECT: ok\n```\n",
             ["--status"], 2)

        case(root, "ABANDON에 사유가 없으면 오류다",
             PASSING + "\nABANDON: G1\n",
             ["--status"], 2)

        case(root, "ABANDON이 없는 id를 가리키면 오류다",
             PASSING + "\nABANDON: G9 사유는 있다\n",
             ["--status"], 2)

        case(root, "포기한 gate는 미충족으로 세지 않는다",
             PASSING + "\nABANDON: G1 결제 사업자 계정이 아직 없다\n",
             ["--status"], 0)

        case(root, "체크됐어도 증거가 pending이면 미충족이다",
             PASSING.replace("- [ ] G1", "- [x] G1"),
             ["--status"], 1)

        case(root, "체크되고 증거가 있으면 충족이다",
             PASSING.replace("- [ ] G1", "- [x] G1").replace("EVIDENCE: pending", "EVIDENCE: exit 0 | verification passed"),
             ["--status"], 0)

        case(root, "타임아웃은 미충족이다",
             PASSING.replace("echo verification passed", "sleep 5"),
             ["--run", "--timeout", "1"], 1)

        write(root, "slice.md", PASSING)
        run(root, "--run")
        check("통과한 gate의 상자가 채워진다", "- [x] G1:" in ledger_text(root), True)
        check("증거에 종료 코드가 남는다", "EVIDENCE: exit 0 |" in ledger_text(root), True)
        clear(root)

        write(root, "slice.md", PASSING.replace("  EVIDENCE: pending\n", ""))
        run(root, "--run")
        check("EVIDENCE 줄이 없으면 넣어 준다", "EVIDENCE: exit 0" in ledger_text(root), True)
        clear(root)

        write(root, "slice.md", PASSING)
        before = ledger_text(root)
        run(root, "--status")
        check("--status는 원장을 고치지 않는다", ledger_text(root), before)
        clear(root)

        stale = PASSING.replace("- [ ] G1", "- [x] G1").replace(
            "EVIDENCE: pending", "EVIDENCE: exit 0 | verification passed"
        ).replace("echo verification passed", "false")
        write(root, "slice.md", stale)
        check("--reverify는 충족된 gate도 다시 돌린다", run(root, "--reverify").returncode, 1)
        check("실패하면 상자를 다시 비운다", "- [ ] G1:" in ledger_text(root), True)
        clear(root)

        write(root, "slice.md", PASSING + "\nABANDON: G1 결제 사업자 계정이 아직 없다\n")
        run(root, "--reverify")
        check("포기한 gate는 다시 돌리지 않는다", "EVIDENCE: pending" in ledger_text(root), True)
        clear(root)

        write(root, "slice.md", stale.replace("CHECK: false", "CHECK: exit 7"))
        run(root, "--run")
        check("--run은 이미 충족된 gate를 건너뛴다", "- [x] G1:" in ledger_text(root), True)
        clear(root)

        check("원장이 없으면 훅은 통과시킨다",
              run(root, "--hook", stdin=hook_payload()).returncode, 0)
        check("원장이 없으면 훅은 아무 말도 하지 않는다",
              run(root, "--hook", stdin=hook_payload()).stdout, "")

        write(root, "slice.md", PASSING)
        blocked = run(root, "--hook", stdin=hook_payload("block-me"))
        check("미충족이면 훅이 block을 낸다",
              json.loads(blocked.stdout or "{}").get("decision"), "block")
        clear(root)

        write(root, "slice.md", PASSING)
        run(root, "--run")
        check("전부 충족이면 훅이 통과시킨다",
              run(root, "--hook", stdin=hook_payload("done")).stdout, "")
        clear(root)

        write(root, "slice.md", PASSING)
        outputs = [run(root, "--hook", stdin=hook_payload("stuck")).stdout for _ in range(7)]
        check("진전이 없으면 여섯 번까지만 막는다",
              [bool(text.strip()) for text in outputs],
              [True] * 6 + [False])
        check("해제되면 원장에 RELEASED 줄이 남는다",
              "RELEASED:" in ledger_text(root), True)
        check("해제 뒤에도 미충족이면 다시 막는다",
              json.loads(run(root, "--hook", stdin=hook_payload("stuck")).stdout or "{}").get("decision"),
              "block")
        clear(root)

        forged = PASSING.replace("- [ ] G1", "- [x] G1").replace(
            "EVIDENCE: pending", "EVIDENCE: exit 0 | verification passed"
        ).replace("echo verification passed", "false")
        write(root, "slice.md", forged)
        run(root, "--subagent")
        check("서브에이전트 훅이 위조된 상자를 되돌린다",
              "- [ ] G1:" in ledger_text(root), True)
        clear(root)

        write(root, "slice.md", PASSING)
        run(root, "--subagent")
        check("서브에이전트 훅이 증거를 채운다",
              "EVIDENCE: exit 0 |" in ledger_text(root), True)
        check("서브에이전트 훅은 막지 않는다",
              run(root, "--subagent").returncode, 0)
        clear(root)

        check("원장이 없으면 서브에이전트 훅은 아무것도 하지 않는다",
              run(root, "--subagent").returncode, 0)

        met_with_note = PASSING.replace("- [ ] G1", "- [x] G1").replace(
            "EVIDENCE: pending", "EVIDENCE: exit 0 | verification passed"
        ) + "\nRELEASED: 훅이 진전 없이 6번 막은 뒤 놓아줬다\n"
        write(root, "slice.md", met_with_note)
        released = run(root, "--status")
        check("RELEASED 줄이 있어도 원장은 깨지지 않는다", released.returncode, 0)
        check("RELEASED 줄은 보고에 실린다", "RELEASED slice" in released.stdout, True)
        clear(root)

        write(root, "slice.md", PASSING.replace("  CHECK:", "CHECK:"))
        check("원장이 깨지면 훅은 통과가 아니라 차단이다",
              json.loads(run(root, "--hook", stdin=hook_payload("broken")).stdout or "{}").get("decision"),
              "block")
        clear(root)

    failed = [name for ok, name in results if not ok]
    print()
    if failed:
        print(f"{len(results) - len(failed)}/{len(results)} 통과, {len(failed)}건 실패")
        return 1
    print(f"{len(results)}/{len(results)} 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
