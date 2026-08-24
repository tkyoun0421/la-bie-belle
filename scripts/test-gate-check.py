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


def partial(met):
    gates = []
    for index in range(1, 4):
        done = index <= met
        box = "x" if done else " "
        evidence = "exit 0 | verification passed" if done else "pending"
        gates.append(
            f"- [{box}] G{index}: 스펙 1.{index}\n"
            f"  CHECK: echo verification passed\n"
            f"  EXPECT: verification passed\n"
            f"  EVIDENCE: {evidence}\n"
        )
    return "# Gates: 흔들림\n\n" + "\n".join(gates)


def hook_payload(session="s1", chained=False):
    return json.dumps({"session_id": session, "stop_hook_active": chained})


def two_gates(second):
    return (
        "# Gates\n\n"
        "- [ ] G1: 결제가 실제로 승인된다\n"
        "  CHECK: false\n"
        "  EXPECT: never\n"
        "  EVIDENCE: pending\n\n"
        f"{second}\n"
        "  CHECK: echo ok\n"
        "  EXPECT: ok\n"
        "  EVIDENCE: pending\n"
    )


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

        case(root, "상자에 대문자를 쓰면 오류다",
             PASSING.replace("- [ ] G1", "- [X] G1"),
             ["--status"], 2)

        case(root, "gate 줄에 콜론이 빠지면 오류다",
             PASSING.replace("- [ ] G1: 스펙 1.1", "- [ ] G1 스펙 1.1"),
             ["--status"], 2)

        case(root, "gate 줄을 들여쓰면 오류다",
             PASSING.replace("- [ ] G1", "  - [ ] G1"),
             ["--status"], 2)

        case(root, "id에 공백이 들면 오류다",
             PASSING.replace("- [ ] G1:", "- [ ] G 1:"),
             ["--status"], 2)

        case(root, "빈 EXPECT는 오류다",
             PASSING.replace("EXPECT: verification passed", "EXPECT:"),
             ["--status"], 2)

        for label, second in (
            ("대문자 상자", "- [X] G2: 둘"),
            ("별표 불릿", "* [ ] G2: 둘"),
            ("더하기 불릿", "+ [ ] G2: 둘"),
            ("번호 불릿", "1. [ ] G2: 둘"),
            ("두 글자 상자", "- [xx] G2: 둘"),
            ("괄호 번호 불릿", "1) [ ] G2: 둘"),
            ("들여쓴 gate 줄", "  - [ ] G2: 둘"),
            ("콜론 없는 gate 줄", "- [ ] G2 둘"),
            ("숫자 상자", "- [1] G2: 둘"),
        ):
            case(root, f"{label}로 쓴 줄이 앞 gate를 덮어쓰지 않는다",
                 two_gates(second), ["--run"], 2)

        case(root, "코드 펜스 안의 gate는 세지 않는다",
             "# Gates\n\n```markdown\n- [ ] G1: 예시\n  CHECK: true\n  EXPECT: ok\n```\n",
             ["--status"], 2)

        case(root, "물결 펜스 안의 gate도 세지 않는다",
             "# Gates\n\n~~~markdown\n- [ ] G1: 예시\n  CHECK: true\n  EXPECT: ok\n~~~\n",
             ["--status"], 2)

        case(root, "다른 문자의 펜스는 열린 펜스를 닫지 않는다",
             "# Gates\n\n```markdown\n~~~\n- [ ] G1: 예시\n  CHECK: true\n  EXPECT: ok\n```\n",
             ["--status"], 2)

        case(root, "속성이 없는 어긋난 gate 줄도 오류다",
             PASSING + "\n* [ ] G2: 둘\n",
             ["--status"], 2)

        case(root, "체크박스가 아닌 목록은 gate로 오해하지 않는다",
             PASSING + "\n참고\n\n- [문서](docs/x.md) 스펙\n- [1] 각주\n",
             ["--status"], 1)

        case(root, "--timeout이 정수가 아니면 막는다",
             PASSING, ["--run", "--timeout", "빨리"], 2)

        case(root, "--timeout이 범위를 벗어나면 막는다",
             PASSING, ["--run", "--timeout", "0"], 2)

        write(root, "slice.md", PASSING)
        blank = run(root, "--run", "--cwd")
        check("--cwd에 값이 없으면 그 이유를 말하며 막는다",
              (blank.returncode, "값이 없다" in blank.stderr), (2, True))
        clear(root)

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

        write(root, "slice.md", PASSING)
        run(root, "--run")
        run(root, "--hook", stdin=hook_payload("stuck"))
        write(root, "slice.md", PASSING)
        again = [run(root, "--hook", stdin=hook_payload("stuck")).stdout for _ in range(8)]
        check("전부 충족했다 다시 미충족이 돼도 두 번 해제하지 않는다",
              [bool(text.strip()) for text in again], [True] * 8)
        clear(root)

        for index in range(12):
            write(root, "slice.md", partial(1 if index % 2 == 0 else 2))
            if not run(root, "--hook", stdin=hook_payload("swing")).stdout.strip():
                break
        check("충족 수가 오르내려도 결국 해제된다", index < 11, True)
        clear(root)

        blocked_while_moving = []
        for index in range(3):
            write(root, "slice.md", partial(index))
            blocked_while_moving.append(
                bool(run(root, "--hook", stdin=hook_payload("moving", chained=index > 0)).stdout.strip())
            )
        check("차단이 이어져도 매번 새로 충족하면 막힌 채로 간다",
              blocked_while_moving, [True] * 3)
        clear(root)

        os.makedirs(os.path.join(root, "안쪽"), exist_ok=True)
        write(root, "slice.md", PASSING.replace("echo verification passed", "pwd")
              .replace("EXPECT: verification passed", "EXPECT: 안쪽"))
        check("--cwd가 명령이 도는 자리를 바꾼다",
              run(root, "--run", "--cwd", os.path.join(root, "안쪽")).returncode, 0)
        clear(root)

        write(root, "slice.md", PASSING.replace(
            "echo verification passed",
            "sh -c 'echo verification passed; echo 뒤에 붙은 잡음'"))
        run(root, "--run")
        check("증거는 마지막 줄이 아니라 기대에 걸린 줄을 남긴다",
              "verification passed" in ledger_text(root).split("EVIDENCE:")[1].split("\n")[0], True)
        clear(root)

        write(root, "slice.md", PASSING.replace(
            "echo verification passed",
            "python3 -c \"print('verification passed ' + 'x' * 500)\""))
        run(root, "--run")
        evidence = ledger_text(root).split("EVIDENCE:")[1].split("\n")[0]
        check("긴 증거는 잘린다", len(evidence) < 300 and evidence.endswith("…"), True)
        clear(root)

        write(root, "done.md", PASSING.replace("- [ ] G1", "- [x] G1").replace(
            "EVIDENCE: pending", "EVIDENCE: exit 0 | verification passed"))
        write(root, "stuck.md", PASSING.replace("G1", "G9"))
        for _ in range(7):
            run(root, "--hook", stdin=hook_payload("two-ledgers"))
        check("해제 줄은 미충족이 남은 원장에만 남는다",
              ("RELEASED:" in ledger_text(root, "stuck.md"),
               "RELEASED:" in ledger_text(root, "done.md")),
              (True, False))
        clear(root)

        write(root, "slice.md", PASSING)
        with open(os.path.join(root, ".gates", ".hook-state.json"), "w", encoding="utf-8") as f:
            f.write('{"broken": {"best": "많이", "blocks": null}}')
        corrupt = json.loads(run(root, "--hook", stdin=hook_payload("broken")).stdout or "{}")
        check("상태 값이 망가져도 훅은 죽지 않고 막는다", corrupt.get("decision"), "block")
        check("망가진 상태는 판정을 죽이지 않고 처음부터 센다",
              "죽었다" in corrupt.get("reason", ""), False)
        clear(root)

        os.makedirs(os.path.join(root, ".gates", "wedged.md"), exist_ok=True)
        wedged = json.loads(run(root, "--hook", stdin=hook_payload("wedged")).stdout or "{}")
        shutil.rmtree(os.path.join(root, ".gates", "wedged.md"))
        check("원장을 읽지 못하면 훅은 통과가 아니라 차단이다", wedged.get("decision"), "block")
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

        met = PASSING.replace("- [ ] G1", "- [x] G1").replace(
            "EVIDENCE: pending", "EVIDENCE: exit 0 | verification passed"
        )
        write(root, "slice.md", met + met.split("\n", 2)[2])
        check("전부 충족이어도 원장이 깨졌으면 훅은 차단한다",
              json.loads(run(root, "--hook", stdin=hook_payload("dup")).stdout or "{}").get("decision"),
              "block")
        clear(root)

        write(root, "slice.md", PASSING + "\nABANDON: G1 결제 사업자 계정이 아직 없다\n")
        check("포기만 남은 원장은 훅이 통과시킨다",
              run(root, "--hook", stdin=hook_payload("abandoned")).stdout, "")
        run(root, "--subagent")
        check("서브에이전트 훅도 포기한 gate는 건너뛴다",
              "EVIDENCE: pending" in ledger_text(root), True)
        clear(root)

        write(root, "slice.md", PASSING.replace("CHECK: echo verification passed", "CHECK:"))
        check("빈 CHECK는 오류다", run(root, "--status").returncode, 2)
        clear(root)

        write(root, "slice.md", PASSING + "\nABANDON:\n")
        check("맨 ABANDON 줄은 오류다", run(root, "--status").returncode, 2)
        clear(root)

        duplicated = met.replace("echo verification passed", "false")
        write(root, "slice.md", duplicated + duplicated.split("\n", 2)[2])
        before = ledger_text(root)
        run(root, "--subagent")
        check("서브에이전트 훅은 깨진 원장을 건드리지 않는다", ledger_text(root), before)
        clear(root)

        write(root, "slice.md", PASSING.replace("\n", "\r\n"))
        run(root, "--run")
        with open(os.path.join(root, ".gates", "slice.md"), newline="", encoding="utf-8") as f:
            raw = f.read()
        check("CRLF 원장은 CRLF로 남는다",
              "\r\n" in raw and "\n" not in raw.replace("\r\n", ""), True)
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
