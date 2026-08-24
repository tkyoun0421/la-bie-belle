#!/usr/bin/env python3
import glob
import json
import os
import re
import subprocess
import sys

MALFORMED = 2
UNMET = 1
GATE_LINE = re.compile(r"^- \[( |x)\] ([^\s:]+):[ \t]*(.*?)[ \t]*$")
LOOSE_GATE = re.compile(r"^[ \t]*-[ \t]*\[[^\]]?\]")
ATTRIBUTE = re.compile(r"^[ \t]+(CHECK|EXPECT|EVIDENCE):[ \t]*(.*?)[ \t]*$")
LOOSE_ATTRIBUTE = re.compile(r"^(CHECK|EXPECT|EVIDENCE):")
ABANDON_LINE = re.compile(r"^ABANDON:[ \t]+(\S+)[ \t]*(.*?)[ \t]*$")
LOOSE_ABANDON = re.compile(r"^ABANDON:")
RELEASED_LINE = re.compile(r"^RELEASED:[ \t]*(.*?)[ \t]*$")
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})")
REGEX_EXPECT = re.compile(r"^/(.*)/([a-z]*)$")
FLAGS = {"i": re.I, "m": re.M, "s": re.S}
PENDING = "pending"
OUTPUT_CAP = 1 << 20
EVIDENCE_CAP = 200
BLOCK_LIMIT = 6
DEFAULT_TIMEOUT = 120
STATE_FILE = ".hook-state.json"


class Gate:
    def __init__(self, gate_id, outcome, checked, line):
        self.id = gate_id
        self.outcome = outcome
        self.checked = checked
        self.line = line
        self.check = None
        self.expect = None
        self.evidence = ""
        self.evidence_line = None
        self.abandoned = None

    def met(self):
        return self.checked and self.evidence and self.evidence != PENDING


class Ledger:
    def __init__(self, path):
        self.path = path
        self.stem = os.path.splitext(os.path.basename(path))[0]
        self.lines = []
        self.newline = "\n"
        self.gates = []
        self.errors = []
        self.released = []

    def qualified(self, gate):
        return f"{self.stem}:{gate.id}"

    def live(self):
        return [g for g in self.gates if g.abandoned is None]


def die(message):
    print(message, file=sys.stderr)
    sys.exit(MALFORMED)


def read_lines(path):
    try:
        with open(path, newline="", encoding="utf-8") as f:
            raw = f.read()
    except OSError as e:
        die(f"gate-check: {path}를 읽을 수 없다 ({e}). 통과가 아니라 차단이다.")
    newline = "\r\n" if "\r\n" in raw else "\n"
    return raw.replace("\r\n", "\n").split("\n"), newline


def compile_expect(expect):
    match = REGEX_EXPECT.match(expect)
    if not match:
        return None, expect
    pattern, flags = match.group(1), match.group(2)
    bits = 0
    for flag in flags:
        if flag not in FLAGS:
            return "flag", flag
        bits |= FLAGS[flag]
    try:
        return re.compile(pattern, bits), None
    except re.error as e:
        return "regex", str(e)


def parse(path):
    ledger = Ledger(path)
    ledger.lines, ledger.newline = read_lines(path)
    seen = {}
    current = None
    fence = None

    for index, line in enumerate(ledger.lines):
        opening = FENCE.match(line)
        if opening:
            marker = opening.group(1)
            if fence is None:
                fence = marker[0] * len(marker)
            elif marker[0] == fence[0] and len(marker) >= len(fence):
                fence = None
            continue
        if fence is not None:
            continue

        gate_match = GATE_LINE.match(line)
        if gate_match:
            gate_id = gate_match.group(2)
            if gate_id in seen:
                ledger.errors.append(f"{path}:{index + 1} gate id '{gate_id}'가 두 번 나온다. 파일 안에서 유일해야 한다.")
            seen[gate_id] = index
            current = Gate(gate_id, gate_match.group(3), gate_match.group(1) == "x", index)
            ledger.gates.append(current)
            continue

        if LOOSE_GATE.match(line):
            ledger.errors.append(
                f"{path}:{index + 1} gate 줄의 형태가 어긋난다. `- [ ] ID: 제목`이나 `- [x] ID: 제목`이어야 한다 — "
                "상자는 소문자 x와 공백만 받고, id에는 공백도 콜론도 들어가지 않으며, 줄은 들여쓰지 않는다."
            )
            current = None
            continue

        attribute = ATTRIBUTE.match(line)
        if attribute:
            if current is None:
                ledger.errors.append(f"{path}:{index + 1} {attribute.group(1)}:이 어느 gate에도 붙지 않았다.")
                continue
            key, value = attribute.group(1), attribute.group(2)
            if key == "CHECK":
                current.check = value
            elif key == "EXPECT":
                current.expect = value
            else:
                current.evidence = value
                current.evidence_line = index
            continue

        if LOOSE_ATTRIBUTE.match(line):
            ledger.errors.append(
                f"{path}:{index + 1} {line.split(':', 1)[0]}:이 들여쓰기되지 않았다. gate 아래로 들여써라."
            )
            continue

        abandon = ABANDON_LINE.match(line)
        if abandon:
            gate_id, reason = abandon.group(1), abandon.group(2)
            target = next((g for g in ledger.gates if g.id == gate_id), None)
            if target is None:
                ledger.errors.append(f"{path}:{index + 1} ABANDON:이 없는 gate '{gate_id}'를 가리킨다.")
            elif not reason:
                ledger.errors.append(f"{path}:{index + 1} ABANDON:에 사유가 없다. 사유 없는 포기는 포기가 아니다.")
            else:
                target.abandoned = reason
            continue

        if LOOSE_ABANDON.match(line):
            ledger.errors.append(f"{path}:{index + 1} ABANDON:은 gate id와 사유를 함께 받는다.")
            continue

        release = RELEASED_LINE.match(line)
        if release:
            ledger.released.append(release.group(1))

    if not ledger.gates:
        ledger.errors.append(f"{path} gate가 하나도 없다. 빈 원장은 ALL MET이 아니라 오류다.")

    for gate in ledger.gates:
        where = f"{path}:{gate.line + 1} {ledger.qualified(gate)}"
        if gate.check is None or gate.expect is None:
            ledger.errors.append(
                f"{where} 실행 gate에는 CHECK:와 EXPECT:가 둘 다 있어야 한다. "
                "사람이 눈으로 보는 절차는 원장이 아니라 [Slice] Issue의 확인 방법 칸이 받는다."
            )
            continue
        if not gate.check:
            ledger.errors.append(f"{where} CHECK:가 비었다.")
        if not gate.expect:
            ledger.errors.append(
                f"{where} EXPECT:가 비었다. 빈 기대는 무엇에나 걸리므로 gate가 아무것도 재지 않는다."
            )
            continue
        compiled, detail = compile_expect(gate.expect)
        if compiled == "flag":
            ledger.errors.append(f"{where} EXPECT:의 정규식 플래그 '{detail}'를 모른다. i, m, s만 받는다.")
        elif compiled == "regex":
            ledger.errors.append(f"{where} EXPECT:의 정규식이 깨졌다 ({detail}).")

    return ledger


def matches(expect, output):
    compiled, _ = compile_expect(expect)
    if isinstance(compiled, re.Pattern):
        return compiled.search(output) is not None
    return expect in output


def decisive(output, expect):
    lines = [line.strip() for line in output.splitlines() if line.strip()]
    if not lines:
        return "출력이 없다"
    chosen = next((line for line in reversed(lines) if matches(expect, line)), lines[-1])
    chosen = " ".join(chosen.split())
    return chosen if len(chosen) <= EVIDENCE_CAP else chosen[:EVIDENCE_CAP] + "…"


def execute(gate, cwd, timeout):
    try:
        result = subprocess.run(
            gate.check,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return False, f"exit timeout | {timeout}초를 넘겼다"
    except OSError as e:
        return False, f"exit error | 셸을 띄우지 못했다 ({e})"
    output = (result.stdout + result.stderr)[:OUTPUT_CAP]
    ok = result.returncode == 0 and matches(gate.expect, output)
    return ok, f"exit {result.returncode} | {decisive(output, gate.expect)}"


def write_back(ledger):
    lines = list(ledger.lines)
    inserted = 0
    for gate in sorted(ledger.gates, key=lambda g: g.line):
        box = "x" if gate.met() else " "
        lines[gate.line + inserted] = f"- [{box}] {gate.id}: {gate.outcome}".rstrip()
        if gate.evidence_line is not None:
            lines[gate.evidence_line + inserted] = f"  EVIDENCE: {gate.evidence}"
            continue
        anchor = gate.line + inserted
        while anchor + 1 < len(lines) and ATTRIBUTE.match(lines[anchor + 1]):
            anchor += 1
        lines.insert(anchor + 1, f"  EVIDENCE: {gate.evidence}")
        inserted += 1
    with open(ledger.path, "w", newline="", encoding="utf-8") as f:
        f.write(ledger.newline.join(lines))


def record_release(ledger, note):
    lines = list(ledger.lines)
    while lines and not lines[-1].strip():
        lines.pop()
    lines.extend(["", f"RELEASED: {note}", ""])
    try:
        with open(ledger.path, "w", newline="", encoding="utf-8") as f:
            f.write(ledger.newline.join(lines))
    except OSError:
        pass


def verify_all(root):
    ledgers = [parse(path) for path in discover(root, [])]
    for ledger in ledgers:
        if ledger.errors:
            continue
        for gate in ledger.live():
            ok, evidence = execute(gate, root, DEFAULT_TIMEOUT)
            gate.checked = ok
            gate.evidence = evidence
        write_back(ledger)
    return 0


def discover(root, paths):
    if paths:
        return paths
    return sorted(glob.glob(os.path.join(root, ".gates", "*.md")))


def report(ledgers):
    met = unmet = abandoned = 0
    for ledger in ledgers:
        for gate in ledger.gates:
            if gate.abandoned is not None:
                abandoned += 1
                print(f"ABANDON  {ledger.qualified(gate)} — {gate.abandoned}")
            elif gate.met():
                met += 1
                print(f"MET      {ledger.qualified(gate)}  {gate.evidence}")
            else:
                unmet += 1
                print(f"UNMET    {ledger.qualified(gate)}  {gate.outcome}")
    for ledger in ledgers:
        for note in ledger.released:
            print(f"RELEASED {ledger.stem} — {note}")
    print(f"\n충족 {met} · 미충족 {unmet} · 포기 {abandoned}")
    return unmet


def load_state(path):
    try:
        with open(path, encoding="utf-8") as f:
            state = json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}
    return state if isinstance(state, dict) else {}


def save_state(path, state):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f)


def hook(root):
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}
    session = str(payload.get("session_id") or "unknown")
    chained = bool(payload.get("stop_hook_active"))

    paths = discover(root, [])
    if not paths:
        return 0

    ledgers = [parse(path) for path in paths]
    errors = [error for ledger in ledgers for error in ledger.errors]
    unmet = [
        ledger.qualified(gate)
        for ledger in ledgers
        for gate in ledger.live()
        if not gate.met()
    ]
    state_path = os.path.join(root, ".gates", STATE_FILE)
    state = load_state(state_path)
    entry = state.get(session) or {}
    released = bool(entry.get("released"))
    best = int(entry.get("best", -1))
    met_now = sum(1 for ledger in ledgers for gate in ledger.gates if gate.met())

    if not errors and not unmet:
        if entry:
            state[session] = {"best": met_now, "blocks": 0, "released": released}
            save_state(state_path, state)
        return 0

    if met_now > best and not chained:
        entry = {"best": met_now, "blocks": 1, "released": released}
    else:
        entry = {
            "best": max(best, met_now),
            "blocks": int(entry.get("blocks", 0)) + 1,
            "released": released,
        }
    state[session] = entry

    if entry["blocks"] > BLOCK_LIMIT and not released:
        entry["released"] = True
        state[session] = entry
        save_state(state_path, state)
        note = (
            f"훅이 진전 없이 {BLOCK_LIMIT}번 막은 뒤 놓아줬다. "
            f"미충족: {', '.join(unmet) if unmet else '원장이 깨졌다'}"
        )
        for ledger in ledgers:
            if ledger.errors or any(not gate.met() for gate in ledger.live()):
                record_release(ledger, note)
        print(
            f"gate-check: {note} 이 세션에서 해제는 한 번뿐이고 원장에 RELEASED: 줄로 남았다.",
            file=sys.stderr,
        )
        return 0

    save_state(state_path, state)

    if errors:
        reason = "원장이 깨졌다. 고치기 전에는 완료가 아니다.\n" + "\n".join(errors)
    else:
        reason = (
            "gate가 아직 미충족이다. 채우거나 ABANDON:에 사유를 남겨라.\n"
            + "\n".join(f"  UNMET {name}" for name in unmet)
            + "\n증거를 채우려면 python3 scripts/gate-check.py --run 을 돌려라."
        )
    print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    return 0


def option(args, name, fallback):
    if name not in args:
        return fallback
    index = args.index(name)
    if index + 1 >= len(args):
        die(f"gate-check: {name}에 값이 없다. 차단한다.")
    value = args.pop(index + 1)
    args.pop(index)
    return value


def main():
    args = sys.argv[1:]
    root = os.path.realpath(
        os.environ.get("PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    )
    if "--hook" in args:
        return hook(root)
    if "--subagent" in args:
        return verify_all(root)

    timeout = option(args, "--timeout", DEFAULT_TIMEOUT)
    cwd = option(args, "--cwd", root)
    try:
        timeout = int(timeout)
    except ValueError:
        die("gate-check: --timeout은 정수여야 한다.")
    if not 1 <= timeout <= 86400:
        die("gate-check: --timeout은 1에서 86400 사이여야 한다.")

    mode = ""
    for candidate in ("--status", "--run", "--reverify"):
        if candidate in args:
            args.remove(candidate)
            mode = candidate
            break
    if not mode:
        die("gate-check: --status, --run, --reverify, --hook, --subagent 중 하나를 골라라.")

    paths = discover(root, args)
    if not paths:
        die("gate-check: 읽을 원장이 없다. .gates/ 아래에 원장을 두거나 경로를 넘겨라.")

    ledgers = [parse(path) for path in paths]
    errors = [error for ledger in ledgers for error in ledger.errors]
    if errors:
        for error in errors:
            print(f"gate-check: {error}", file=sys.stderr)
        return MALFORMED

    if mode != "--status":
        for ledger in ledgers:
            for gate in ledger.live():
                if mode == "--run" and gate.met():
                    continue
                ok, evidence = execute(gate, cwd, timeout)
                gate.checked = ok
                gate.evidence = evidence
                print(f"{'PASS' if ok else 'FAIL'}  {ledger.qualified(gate)}  {evidence}")
            write_back(ledger)
        print()

    return UNMET if report(ledgers) else 0


if __name__ == "__main__":
    sys.exit(main())
