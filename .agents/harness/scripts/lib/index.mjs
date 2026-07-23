import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

export function loadIndex(repoRoot) {
  const path = resolve(repoRoot, "docs/phases/index.jsonl");
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
    if (entry.kind === "task" && entry.status === "in_progress" && (!entry.test_mode || !Array.isArray(entry.check_ids))) {
      errors.push(`${entry.id}: in_progress task requires test_mode and check_ids`);
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
  if (active) return active;
  const done = new Set(entries.filter((entry) => entry.status === "done").map((entry) => entry.id));
  return entries
    .filter((entry) => entry.kind === "task" && entry.status === "planned" && (entry.depends_on ?? []).every((id) => done.has(id)))
    .sort((a, b) => ({ must: 0, should: 1, could: 2 }[a.priority] - ({ must: 0, should: 1, could: 2 }[b.priority]) || a.id.localeCompare(b.id)))[0] ?? null;
}
