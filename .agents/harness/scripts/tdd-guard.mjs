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
  console.error("사용법: tdd-guard.mjs <red|green|check> <task-id> [-- 명령 인수]");
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
  console.log(`${taskId}: TDD 증거가 유효합니다`);
  process.exit(0);
}

if (!argv.length) throw new Error("-- 뒤에 실행할 명령이 필요합니다");
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
    console.error(`${taskId}: RED는 인프라 오류가 아닌 assertion 실패여야 합니다`);
    process.exit(1);
  }
  record.assertion_failure = true;
  previous.red = record;
  previous.green = null;
} else {
  if (!previous.red) {
    console.error(`${taskId}: GREEN 실행에는 기록된 RED 증거가 필요합니다`);
    process.exit(1);
  }
  if (!sameCommand(previous.red.argv, argv)) {
    console.error(`${taskId}: GREEN은 RED와 동일한 명령을 실행해야 합니다`);
    process.exit(1);
  }
  if (record.exit_code !== 0) {
    console.error(`${taskId}: GREEN 명령이 실패했습니다\n${output}`);
    process.exit(record.exit_code || 1);
  }
  previous.green = record;
}
previous.task_id = taskId;
previous.schema_version = 1;
previous.spec_refs = task.spec_refs;
writeFileSync(evidencePath, `${JSON.stringify(previous, null, 2)}\n`);
console.log(`${taskId}: ${mode.toUpperCase()} 증거를 기록했습니다`);
