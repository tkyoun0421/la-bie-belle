import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CONTRACT_STATUSES = new Set(["planned", "in_progress", "blocked", "verification_pending"]);
export const TEST_MODES = new Set(["docs_only", "verification", "tdd"]);

export function repoRootFrom(metaUrl) {
  let current = dirname(fileURLToPath(metaUrl));
  while (current !== dirname(current)) {
    if (current.endsWith(".agents/harness/scripts") || current.endsWith(".agents/harness/scripts/lib")) {
      return resolve(current, current.endsWith("/lib") ? "../../../.." : "../../..");
    }
    current = dirname(current);
  }
  throw new Error(`cannot locate repository root from ${metaUrl}`);
}

export function loadIndex(repoRoot, indexPath = "docs/phases/index.jsonl") {
  const path = resolve(repoRoot, indexPath);
  const lines = readFileSync(path, "utf8").trim().split(/\r?\n/).filter(Boolean);
  const entries = lines.map((line, lineNumber) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`index.jsonl line ${lineNumber + 1}: ${error.message}`);
    }
  });
  return { path, entries };
}

export function executionContractError(task) {
  if (!TEST_MODES.has(task.test_mode)) {
    return `${task.id}: runnable task requires test_mode (${[...TEST_MODES].join(", ")})`;
  }
  if (!Array.isArray(task.check_ids) || task.check_ids.length === 0 || task.check_ids.some((id) => typeof id !== "string" || id.length === 0)) {
    return `${task.id}: runnable task requires non-empty check_ids`;
  }
  return null;
}

export function assertExecutionContract(task) {
  const error = executionContractError(task);
  if (error) throw new Error(error);
  return task;
}

export function validateIndex(entries) {
  const ids = new Set();
  const errors = [];
  const tasks = entries.filter((entry) => entry.kind === "task");
  for (const entry of entries) {
    if (!entry.id || ids.has(entry.id)) errors.push(`duplicate or missing id: ${entry.id ?? "<missing>"}`);
    ids.add(entry.id);
    if (!Array.isArray(entry.spec_refs) || entry.spec_refs.length === 0) errors.push(`${entry.id}: spec_refs required`);
    for (const dependency of entry.depends_on ?? []) {
      if (!ids.has(dependency) && !entries.some((candidate) => candidate.id === dependency)) {
        errors.push(`${entry.id}: missing dependency ${dependency}`);
      }
    }
    if (entry.kind === "task" && CONTRACT_STATUSES.has(entry.status)) {
      const contractError = executionContractError(entry);
      if (contractError) errors.push(contractError);
    }
  }
  const active = tasks.filter((entry) => entry.status === "in_progress");
  if (active.length > 1) errors.push(`multiple in_progress tasks: ${active.map((entry) => entry.id).join(", ")}`);
  return errors;
}

export function findTask(entries, taskId) {
  const task = entries.find((entry) => entry.kind === "task" && entry.id === taskId);
  if (!task) throw new Error(`unknown task: ${taskId}`);
  return task;
}

export function selectNext(entries) {
  const active = entries.find((entry) => entry.kind === "task" && entry.status === "in_progress");
  if (active) return assertExecutionContract(active);
  const done = new Set(entries.filter((entry) => entry.status === "done").map((entry) => entry.id));
  return (entries
    .filter((entry) => entry.kind === "task" && entry.status === "planned" && (entry.depends_on ?? []).every((id) => done.has(id)))
    .sort((a, b) => {
      const priority = { must: 0, should: 1, could: 2 };
      return priority[a.priority] - priority[b.priority] || a.id.localeCompare(b.id);
    })
    .map(assertExecutionContract)[0] ?? null);
}
