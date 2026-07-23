import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function isGitCommit(command) {
  return /(^|[;&|]\s*)git\b(?:(?![;&|]).)*\bcommit\b/.test(command);
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
  const detail = (result.stderr || result.stdout || "task commit guard failed").trim();
  return `Commit blocked by La Vie Belle task/TDD guard${task ? ` for ${task.id}` : ""}: ${detail}`;
}

function runPreCommit(root, taskId) {
  return spawnSync("node", [".agents/harness/scripts/pre-commit.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...(taskId ? { HARNESS_TASK_ID: taskId } : {}) }
  });
}

export function evaluate(root, input, runGuard = runPreCommit, findActiveTask = activeTask) {
  const command = input.tool_input?.command ?? "";
  const task = findActiveTask(root) ?? requestedTask(root, command);
  if (input.tool_name === "Bash" && isGitCommit(command)) {
    const reason = commitDecision(root, task, runGuard);
    return reason
      ? { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }
      : {};
  }
  if (task?.test_mode === "tdd" && input.tool_name === "apply_patch") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: `${task.id} is a TDD task: preserve the RED → GREEN evidence sequence. The Codex commit guard will deny the commit unless tdd-guard check passes.`
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
