import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { findTask, loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";
import {
  captureTreeState,
  isAssertionFailure,
  isInfrastructureFailure,
  sameCommand,
  sha256,
  validateTddEvidence
} from "./lib/tdd-evidence.mjs";

const root = repoRootFrom(import.meta.url);
const [mode, taskId, ...rest] = process.argv.slice(2);
const commandIndex = rest.indexOf("--");
const argv = commandIndex >= 0 ? rest.slice(commandIndex + 1) : [];
if (!mode || !taskId || !["red", "green", "check"].includes(mode)) {
  console.error("Usage: tdd-guard.mjs <red|green|check> <task-id> [-- command args]");
  process.exit(2);
}
const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
const task = findTask(entries, taskId);
const runDir = join(root, ".agents", "runs", taskId);
mkdirSync(runDir, { recursive: true });
const evidencePath = join(runDir, "tdd.json");
const previous = (() => {
  try {
    return JSON.parse(readFileSync(evidencePath, "utf8"));
  } catch {
    return { schema_version: 1, task_id: taskId, spec_refs: task.spec_refs, red: null, green: null };
  }
})();

if (mode === "check") {
  const evidenceErrors = validateTddEvidence(task, previous);
  if (evidenceErrors.length) {
    console.error(evidenceErrors.map((error) => `${taskId}: ${error}`).join("\n"));
    process.exit(1);
  }
  console.log(`${taskId}: TDD evidence valid`);
  process.exit(0);
}

if (!argv.length) throw new Error("a command is required after --");
const result = spawnSync(argv[0], argv.slice(1), { cwd: root, encoding: "utf8" });
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
const record = {
  argv,
  exit_code: result.status ?? 1,
  output_sha256: sha256(output),
  recorded_at: new Date().toISOString(),
  tree: captureTreeState(root)
};
if (mode === "red") {
  if (record.exit_code === 0 || isInfrastructureFailure(output) || !isAssertionFailure(output)) {
    console.error(`${taskId}: RED must be an assertion failure, not infrastructure failure`);
    process.exit(1);
  }
  record.assertion_failure = true;
  previous.red = record;
  previous.green = null;
} else {
  if (!previous.red) {
    console.error(`${taskId}: GREEN requires recorded RED evidence`);
    process.exit(1);
  }
  if (!sameCommand(previous.red.argv, argv)) {
    console.error(`${taskId}: GREEN must run the same command as RED`);
    process.exit(1);
  }
  if (record.exit_code !== 0) {
    console.error(`${taskId}: GREEN command failed\n${output}`);
    process.exit(record.exit_code || 1);
  }
  previous.green = record;
}
previous.task_id = taskId;
previous.schema_version = 1;
previous.spec_refs = task.spec_refs;
writeFileSync(evidencePath, `${JSON.stringify(previous, null, 2)}\n`);
console.log(`${mode} recorded for ${taskId}`);
