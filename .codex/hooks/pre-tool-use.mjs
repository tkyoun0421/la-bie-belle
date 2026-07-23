import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateTddEvidence } from "../../.agents/harness/scripts/lib/tdd-evidence.mjs";

export function isGitCommit(command) {
  return /(^|[;&|]\s*)git\b(?:(?![;&|]).)*\bcommit\b/.test(command);
}

function commandSegments(command) {
  return command.split(/[;|&\n]+/).map((segment) => segment.trim()).filter(Boolean);
}

function hasBroadRecursiveRemoval(segment) {
  const match = segment.match(/\brm\s+((?:--?[A-Za-z][\w-]*\s+)+)(.+)$/);
  if (!match) return false;
  const flags = match[1].trim().split(/\s+/);
  const isRecursive = flags.some((flag) => flag === "--recursive" || /^-[^-]*r/i.test(flag));
  if (!isRecursive) return false;
  return match[2].trim().split(/\s+/).some((target) => /^(?:\.(?:\/|$)|\.\.(?:\/|$)|\/(?:$|\*)|~(?:\/|$)|\$(?:HOME|PWD)(?:\/|$)|\$\{(?:HOME|PWD)\}(?:\/|$)|\*|\/\*)/.test(target));
}

function hasDestructiveGitCommand(segment) {
  return /\bgit\b[^\n]*\breset\s+(?:[^\n]*\s)?--hard\b/.test(segment)
    || /\bgit\b[^\n]*\bclean\s+[^\n]*(?:--force|-[-a-z]*f[-a-z]*)/.test(segment)
    || /\bgit\b[^\n]*\bpush\s+[^\n]*(?:--force(?:-with-lease)?|-[-a-z]*f[-a-z]*|\+[^\s]+)/.test(segment);
}

function hasSystemMutation(segment) {
  return /(?:^|\s)(?:sudo|doas)\b/.test(segment)
    || /\b(?:chmod|chown)\s+(?:[^\s]+\s+)*-R\b/.test(segment)
    || /\b(?:shutdown|reboot|poweroff|halt|mkfs)\b/.test(segment)
    || /\bdd\s+[^\n]*\bof=\/dev\//.test(segment)
    || /(?:>|>>)\s*\/(?:etc|usr|bin|sbin|var|System|Library)(?:\/|\s|$)/.test(segment);
}

export function dangerousCommandDecision(command) {
  const segments = commandSegments(command);
  if (segments.some((segment) => hasDestructiveGitCommand(segment)
    || hasBroadRecursiveRemoval(segment)
    || hasSystemMutation(segment))
    || /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash|zsh)\b/.test(command)) {
    return "복구가 어렵거나 시스템·원격 이력에 영향을 주는 명령은 Codex 훅에서 실행할 수 없습니다. 필요한 경우 안전한 범위의 대안으로 바꾸거나 사용자가 직접 명시적으로 실행하세요.";
  }
  return null;
}

export function activeTask(root) {
  const indexPath = resolve(root, "docs/phases/index.jsonl");
  if (!existsSync(indexPath)) return null;
  const entries = readFileSync(indexPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  return entries.find((entry) => entry.kind === "task" && entry.status === "in_progress") ?? null;
}

export function requestedTask(root, command) {
  const taskId = command.match(/(?:^|\s)HARNESS_TASK_ID=([A-Z]\d+-T\d+)(?:\s|$)/)?.[1];
  if (!taskId) return null;
  const indexPath = resolve(root, "docs/phases/index.jsonl");
  if (!existsSync(indexPath)) return null;
  const entries = readFileSync(indexPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  return entries.find((entry) => entry.kind === "task" && entry.id === taskId) ?? null;
}

export function commitDecision(root, task, runGuard) {
  const result = runGuard(root, task?.id);
  if (result.status === 0) return null;
  const detail = (result.stderr || result.stdout || "작업 커밋 가드 검증에 실패했습니다").trim();
  return `라비에벨 작업/TDD 가드가${task ? ` ${task.id} 작업의` : ""} 커밋을 차단했습니다: ${detail}`;
}

function changedPaths(input) {
  const raw = [input?.patch, input?.content, input?.path].filter(Boolean).join("\n");
  const paths = [...raw.matchAll(/^\*\*\* (?:Add|Update|Delete) File: ([^\n]+)$/gm)].map((match) => match[1].trim());
  return paths.length ? paths : input?.path ? [input.path] : [];
}

function isTestPath(path) {
  return /(?:^|\/)(?:test|tests|__tests__)\/|(?:\.(?:test|spec)|-self-test)\.[cm]?[jt]sx?$/.test(path);
}

function tddState(root, task) {
  const evidencePath = resolve(root, ".agents/runs", task.id, "tdd.json");
  if (!existsSync(evidencePath)) return { hasRed: false, hasGreen: false };
  try {
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    return {
      hasRed: evidence.red?.assertion_failure === true,
      hasGreen: validateTddEvidence(task, evidence).length === 0
    };
  } catch {
    return { hasRed: false, hasGreen: false };
  }
}

export function tddEditDecision(task, input, state) {
  if (task?.test_mode !== "tdd") return null;
  const raw = [input?.patch, input?.content].filter(Boolean).join("\n");
  const paths = changedPaths(input);
  if (raw.includes(`\"id\":\"${task.id}\"`) && raw.includes("\"status\":\"done\"") && !state.hasGreen) {
    return `${task.id}: GREEN 증거와 tdd-guard check를 통과한 뒤에만 작업을 완료할 수 있습니다.`;
  }
  if (paths.length > 0 && paths.some((path) => !isTestPath(path)) && !state.hasRed) {
    return `${task.id}: production 로직을 변경하기 전에 테스트를 작성하고 tdd-guard red 증거를 기록하세요.`;
  }
  return null;
}

function runPreCommit(root, taskId) {
  return spawnSync("node", [".agents/harness/scripts/pre-commit.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...(taskId ? { HARNESS_TASK_ID: taskId } : {}) }
  });
}

export function evaluate(root, input, runGuard = runPreCommit, findActiveTask = activeTask, inspectTddState = tddState) {
  const command = input.tool_input?.command ?? "";
  const task = findActiveTask(root) ?? requestedTask(root, command);
  if (input.tool_name === "Bash") {
    const reason = dangerousCommandDecision(command);
    if (reason) {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: reason
        }
      };
    }
  }
  if (input.tool_name === "Bash" && isGitCommit(command)) {
    const reason = commitDecision(root, task, runGuard);
    return reason
      ? { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }
      : {};
  }
  if (task?.test_mode === "tdd" && ["apply_patch", "Edit", "Write"].includes(input.tool_name)) {
    const reason = tddEditDecision(task, input.tool_input, inspectTddState(root, task));
    if (reason) {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: reason
        }
      };
    }
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: `${task.id}은(는) TDD 작업입니다. 테스트 변경은 허용되지만 production 변경 전에는 RED, 작업 완료·커밋 전에는 GREEN 증거가 필요합니다.`
      }
    };
  }
  return {};
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  console.log(JSON.stringify(evaluate(input.cwd, input)));
}
