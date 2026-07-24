import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CONTRACT_STATUSES = new Set(["planned", "in_progress", "blocked", "verification_pending"]);
export const TEST_MODES = new Set(["docs_only", "verification", "tdd"]);
export const RUNNABLE_STATUSES = new Set(["planned", "in_progress"]);

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
  if (!TEST_MODES.has(task.test_mode)) {
    return `${task.id}: 실행 가능한 작업에는 test_mode가 필요합니다 (${[...TEST_MODES].join(", ")})`;
  }
  if (!Array.isArray(task.check_ids) || task.check_ids.length === 0 || task.check_ids.some((id) => typeof id !== "string" || id.length === 0)) {
    return `${task.id}: 실행 가능한 작업에는 비어 있지 않은 check_ids가 필요합니다`;
  }
  return null;
}

export function assertExecutionContract(task) {
  const error = executionContractError(task);
  if (error) throw new Error(error);
  return task;
}

export function approvalError(task) {
  if (task.approved_by !== "user") {
    return `${task.id}: 실행 가능한 작업에는 approved_by: "user"가 필요합니다`;
  }
  if (typeof task.approved_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(task.approved_at)) {
    return `${task.id}: 실행 가능한 작업에는 YYYY-MM-DD 형식의 approved_at이 필요합니다`;
  }
  return null;
}

export function assertRunnableTask(entries, task) {
  if (!RUNNABLE_STATUSES.has(task.status)) {
    throw new Error(`${task.id}: ${task.status} 작업은 실행할 수 없습니다. 딥인터뷰 승인 후 planned 상태로 인계하세요`);
  }
  assertExecutionContract(task);
  const taskApprovalError = approvalError(task);
  if (taskApprovalError) throw new Error(taskApprovalError);
  const done = new Set(entries.filter((entry) => entry.status === "done").map((entry) => entry.id));
  const missingDependencies = (task.depends_on ?? []).filter((id) => !done.has(id));
  if (missingDependencies.length) {
    throw new Error(`${task.id}: 완료되지 않은 의존 작업이 있습니다: ${missingDependencies.join(", ")}`);
  }
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
    if (entry.kind === "task" && CONTRACT_STATUSES.has(entry.status)) {
      const contractError = executionContractError(entry);
      if (contractError) errors.push(contractError);
      const taskApprovalError = approvalError(entry);
      if (taskApprovalError) errors.push(taskApprovalError);
    }
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
