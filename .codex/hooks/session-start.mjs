import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function activeTask(root) {
  const indexPath = resolve(root, "docs/phases/index.jsonl");
  if (!existsSync(indexPath)) return null;
  const entries = readFileSync(indexPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  return entries.find((entry) => entry.kind === "task" && entry.status === "in_progress") ?? null;
}

const input = JSON.parse(readFileSync(0, "utf8"));
const task = activeTask(input.cwd);
const context = task
  ? `${task.id} is in progress (test_mode=${task.test_mode}). Read AGENTS.md, its phase document, and spec_refs before editing. ${task.test_mode === "tdd" ? "Record an assertion-failing RED, then the same passing GREEN command with tdd-guard before commit." : "Use its registered check_ids and record verification evidence before commit."}`
  : "No task is in progress. Select and mark exactly one task in progress before implementation.";

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: context
  }
}));
