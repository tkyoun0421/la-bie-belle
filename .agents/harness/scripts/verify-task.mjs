import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { findTask, loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const taskId = process.argv[2];
if (!taskId) throw new Error("Usage: verify-task.mjs <task-id>");
const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
const task = findTask(entries, taskId);
const checks = JSON.parse(readFileSync(join(root, ".agents/harness/checks.json"), "utf8"));
const runDir = join(root, ".agents/runs", taskId);
mkdirSync(join(runDir, "checks"), { recursive: true });
const results = [];
for (const checkId of task.check_ids ?? []) {
  const argv = checks[checkId];
  if (!argv) { results.push({ check_id: checkId, status: "missing" }); continue; }
  const result = spawnSync(argv[0], argv.slice(1), { cwd: root, encoding: "utf8" });
  const logPath = join(runDir, "checks", `${checkId}.log`);
  writeFileSync(logPath, `${result.stdout ?? ""}${result.stderr ?? ""}`);
  results.push({ check_id: checkId, argv, status: result.status === 0 ? "passed" : "failed", exit_code: result.status ?? 1, log: logPath });
  if (result.status !== 0) break;
}
const passed = results.length === (task.check_ids ?? []).length && results.every((result) => result.status === "passed");
const evidence = { task_id: taskId, status: passed ? "passed" : "failed", spec_refs: task.spec_refs, checks: results, recorded_at: new Date().toISOString() };
writeFileSync(join(runDir, "verification.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
if (!passed) process.exit(1);
