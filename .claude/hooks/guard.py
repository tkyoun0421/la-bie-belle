#!/usr/bin/env python3
import json
import os
import re
import sys

ROOT = os.path.abspath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())

CONTENT_KEYS = ("content", "new_string")

OPERATOR = re.compile(
    r"&>>|&>|>>|>\||>&|<<<|<<|<>|<&|<|>|\|\||\|&|\||&&|&|;;|;|\(|\)|\n"
)
OPERATOR_START = frozenset("<>|&;()\n")
SEPARATORS = frozenset({"|", "||", "|&", "&&", "&", ";", ";;", "(", ")", "\n"})
WRITE_REDIRECTS = frozenset({">", ">>", ">|", "&>", "&>>", ">&", "<>"})
FILE_DESCRIPTOR = re.compile(r"\d+-?|-")
HEREDOC = re.compile(r"(?<!<)<<-?[ \t]*\\?([\"']?)([A-Za-z_][\w.-]*)\1")
ASSIGNMENT = re.compile(r"[A-Za-z_]\w*=")
SED_IN_PLACE = re.compile(r"-[A-Za-z]*i")
SED_SCRIPT_FLAGS = ("-e", "-f", "--expression", "--file")
COPY_VALUED = (
    "-t",
    "-S",
    "-m",
    "-o",
    "-g",
    "--target-directory",
    "--suffix",
    "--mode",
    "--owner",
    "--group",
)
TARGET_DIRECTORY = ("-t", "--target-directory")


def exists(relative_path):
    return os.path.exists(os.path.join(ROOT, relative_path))


def contents(relative_path):
    """저장된 파일을 읽는다. 없거나 못 읽으면 빈 문자열이다."""
    try:
        with open(
            os.path.join(ROOT, relative_path), encoding="utf-8", errors="ignore"
        ) as handle:
            return handle.read()
    except OSError:
        return ""


def _without_heredoc_bodies(command):
    kept, pending = [], []
    for line in command.split("\n"):
        if pending:
            if line.strip() == pending[0]:
                pending.pop(0)
            continue
        kept.append(line)
        pending.extend(delimiter for _quote, delimiter in HEREDOC.findall(line))
    return "\n".join(kept)


def _quoted(command, index, quote):
    text = []
    while index < len(command) and command[index] != quote:
        if quote == '"' and command[index] == "\\" and index + 1 < len(command):
            index += 1
        text.append(command[index])
        index += 1
    if index >= len(command):
        raise ValueError("닫히지 않은 따옴표")
    return "".join(text), index + 1


def _tokens(command):
    tokens, word, index = [], None, 0
    while index < len(command):
        char = command[index]
        if char == "\\":
            word = (word or "") + command[index + 1 : index + 2]
            index += 2
        elif char in "'\"":
            text, index = _quoted(command, index + 1, char)
            word = (word or "") + text
        elif char == "#" and word is None:
            end = command.find("\n", index)
            index = len(command) if end < 0 else end
        elif char in " \t":
            if word is not None:
                tokens.append((word, False))
                word = None
            index += 1
        elif char in OPERATOR_START:
            operator = OPERATOR.match(command, index).group()
            if word is not None and not (operator[0] in "<>" and word.isdigit()):
                tokens.append((word, False))
            word = None
            tokens.append((operator, True))
            index += len(operator)
        else:
            word = (word or "") + char
            index += 1
    if word is not None:
        tokens.append((word, False))
    return tokens


def _simple_commands(tokens):
    command = []
    for text, is_operator in tokens:
        if is_operator and text in SEPARATORS:
            if command:
                yield command
            command = []
        else:
            command.append((text, is_operator))
    if command:
        yield command


def _parse_options(args, valued=()):
    options, operands = [], []
    remaining = iter(args)
    for arg in remaining:
        if arg == "--":
            operands.extend(remaining)
            break
        if arg.startswith("-") and arg != "-":
            options.append((arg, next(remaining, "") if arg in valued else None))
        else:
            operands.append(arg)
    return options, operands


def _tee(args, _is_directory):
    return _parse_options(args)[1]


def _touch(args, _is_directory):
    return _parse_options(args, ("-r", "-t", "-d"))[1]


def _sed(args, _is_directory):
    options, operands = _parse_options(args, SED_SCRIPT_FLAGS)
    flags = [flag for flag, _value in options]
    if not any(
        flag == "--in-place"
        or flag.startswith("--in-place=")
        or SED_IN_PLACE.match(flag)
        for flag in flags
    ):
        return []
    files = [operand for operand in operands if operand]
    scripted = any(
        flag in SED_SCRIPT_FLAGS or flag.startswith(("--expression=", "--file="))
        for flag in flags
    )
    return files if scripted else files[1:]


def _copy(args, is_directory):
    options, operands = _parse_options(args, COPY_VALUED)
    directory = None
    for flag, value in options:
        if flag in TARGET_DIRECTORY:
            directory = value
        elif flag.startswith("--target-directory="):
            directory = flag.split("=", 1)[1]
    if directory is not None:
        sources = operands
    elif len(operands) < 2:
        return []
    else:
        *sources, destination = operands
        if not (
            destination.endswith("/") or len(sources) > 1 or is_directory(destination)
        ):
            return [destination]
        directory = destination
    return [
        os.path.join(directory, os.path.basename(source.rstrip("/")))
        for source in sources
    ]


WRITING_COMMANDS = {
    "tee": _tee,
    "touch": _touch,
    "sed": _sed,
    "cp": _copy,
    "mv": _copy,
    "install": _copy,
}


def _targets_of(command, is_directory):
    targets, words = [], []
    remaining = iter(command)
    for text, is_operator in remaining:
        if not is_operator:
            words.append(text)
            continue
        target, target_is_operator = next(remaining, ("", True))
        if target_is_operator or text not in WRITE_REDIRECTS:
            continue
        if text == ">&" and FILE_DESCRIPTOR.fullmatch(target):
            continue
        targets.append(target)

    while words and ASSIGNMENT.match(words[0]):
        words.pop(0)
    if words:
        writer = WRITING_COMMANDS.get(os.path.basename(words[0]))
        if writer:
            targets.extend(writer(words[1:], is_directory))
    return targets


def write_targets(command, is_directory=lambda _path: False):
    """Bash 명령이 쓰는 파일 경로들. 읽어낼 수 없는 꼴이면 빈 목록이다."""
    try:
        tokens = _tokens(_without_heredoc_bodies(command))
    except ValueError:
        return []
    targets = [
        target
        for simple in _simple_commands(tokens)
        for target in _targets_of(simple, is_directory)
    ]
    return [
        target
        for target in dict.fromkeys(targets)
        if target and not target.startswith("/dev/")
    ]


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


def _reader(incoming, relative_path):
    def read(source="disk"):
        """`"disk"`는 지금 저장된 내용, `"incoming"`은 이번에 쓰려는 조각이다. Bash는 조각을 몰라 `None`이다."""
        if source == "incoming":
            return incoming
        if relative_path.startswith(".."):
            return incoming or ""
        try:
            with open(
                os.path.join(ROOT, relative_path), encoding="utf-8", errors="ignore"
            ) as handle:
                return handle.read()
        except OSError:
            return incoming or ""

    return read


def _written_paths(payload):
    tool_input = payload.get("tool_input") or {}
    if payload.get("tool_name") != "Bash":
        incoming = "\n".join(str(tool_input.get(key, "")) for key in CONTENT_KEYS)
        return [tool_input.get("file_path")], incoming

    cwd = payload.get("cwd") or os.getcwd()

    def resolve(path):
        return os.path.join(cwd, os.path.expanduser(path))

    command = str(tool_input.get("command") or "")
    targets = write_targets(command, lambda path: os.path.isdir(resolve(path)))
    return [resolve(target) for target in targets], None


def guard(verdict):
    """verdict(relative_path, read) -> 막는 이유 문자열 또는 None"""
    payload = _payload()
    if not isinstance(payload, dict):
        sys.exit(0)

    raw_paths, incoming = _written_paths(payload)
    reasons = []
    for raw_path in raw_paths:
        if not raw_path:
            continue
        relative_path = _relative_path(raw_path)
        if relative_path is None:
            continue
        reason = verdict(relative_path, _reader(incoming, relative_path))
        if reason:
            reasons.append(reason)

    if not reasons:
        sys.exit(0)

    sys.stderr.write("\n".join(reasons))
    sys.exit(2)
