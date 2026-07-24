import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EXECUTABLE_STATUSES, EXECUTION_CONTRACT_STATUSES, executionContractIssues, formatIssues, runnableIssues, taskContractIssues } from "./workflow-contract.mjs";

export const CONTRACT_STATUSES = EXECUTION_CONTRACT_STATUSES;
export const RUNNABLE_STATUSES = EXECUTABLE_STATUSES;

export function repoRootFrom(metaUrl) {
  let current = dirname(fileURLToPath(metaUrl));
  while (current !== dirname(current)) {
    if (current.endsWith(".agents/harness/scripts") || current.endsWith(".agents/harness/scripts/lib")) {
      return resolve(current, current.endsWith("/lib") ? "../../../.." : "../../..");
    }
    current = dirname(current);
  }
  throw new Error(`저장소 루트를 찾을 수 없습니다: ${metaUrl}`);
}

export function loadIndex(repoRoot, indexPath = "docs/phases/index.jsonl") {
  const path = resolve(repoRoot, indexPath);
  const lines = readFileSync(path, "utf8").trim().split(/\r?\n/).filter(Boolean);
  const entries = lines.map((line, lineNumber) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`index.jsonl ${lineNumber + 1}번째 줄을 읽을 수 없습니다: ${error.message}`);
    }
  });
  return { path, entries };
}

export function executionContractError(task) {
  return executionContractIssues(task)[0]?.message ?? null;
}

export function assertExecutionContract(task) {
  const error = executionContractError(task);
  if (error) throw new Error(error);
  return task;
}

export function assertRunnableTask(entries, task, root) {
  const issues = runnableIssues(entries, task, root);
  if (issues.length) throw new Error(formatIssues(issues));
  return task;
}

export function validateIndex(entries) {
  const ids = new Set();
  const errors = [];
  const tasks = entries.filter((entry) => entry.kind === "task");
  for (const entry of entries) {
    if (!entry.id || ids.has(entry.id)) errors.push(`중복되었거나 없는 ID입니다: ${entry.id ?? "<missing>"}`);
    ids.add(entry.id);
    if (!Array.isArray(entry.spec_refs) || entry.spec_refs.length === 0) errors.push(`${entry.id}: spec_refs가 필요합니다`);
    for (const dependency of entry.depends_on ?? []) {
      if (!ids.has(dependency) && !entries.some((candidate) => candidate.id === dependency)) {
        errors.push(`${entry.id}: 의존 작업이 없습니다: ${dependency}`);
      }
    }
    if (entry.schema_version !== 3) errors.push(`${entry.id}: schema_version은 3이어야 합니다`);
    if (entry.kind === "task") errors.push(...taskContractIssues(entry).map(({ code, message }) => `[${code}] ${message}`));
  }
  const active = tasks.filter((entry) => entry.status === "in_progress");
  if (active.length > 1) errors.push(`in_progress 작업이 여러 개입니다: ${active.map((entry) => entry.id).join(", ")}`);
  return errors;
}

export function findTask(entries, taskId) {
  const task = entries.find((entry) => entry.kind === "task" && entry.id === taskId);
  if (!task) throw new Error(`알 수 없는 작업입니다: ${taskId}`);
  return task;
}
