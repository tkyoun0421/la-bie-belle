import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const INFRASTRUCTURE_FAILURE = /cannot find module|module_not_found|syntaxerror|enoent|command not found|is not recognized as an internal or external command/i;
const ASSERTION_FAILURE = /assertionerror|\bexpected\b.+\b(?:received|actual|equal|to be|to equal|but got)\b|\btests?\s+failed\b|\bfail(?:ed|ure)?\b.+\b(?:assert|expect|test)\b/is;

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function isInfrastructureFailure(output) {
  return INFRASTRUCTURE_FAILURE.test(output);
}

export function isAssertionFailure(output) {
  return !isInfrastructureFailure(output) && ASSERTION_FAILURE.test(output);
}

export function sameCommand(left, right) {
  return Array.isArray(left) && Array.isArray(right) && JSON.stringify(left) === JSON.stringify(right);
}

function gitOutput(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} 명령이 실패했습니다\n${result.stderr ?? ""}`);
  return result.stdout.trim();
}

export function captureTreeState(root) {
  const status = gitOutput(root, ["status", "--porcelain=v1", "--untracked-files=all"]);
  return {
    head: gitOutput(root, ["rev-parse", "HEAD"]),
    status,
    status_sha256: sha256(status)
  };
}

function validDigest(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validateRecord(name, record, expectedExit) {
  const errors = [];
  if (!record || typeof record !== "object") return [`${name} evidence is missing`];
  if (!Array.isArray(record.argv) || record.argv.length === 0) errors.push(`${name}.argv가 필요합니다`);
  if (expectedExit !== null && record.exit_code !== expectedExit) errors.push(`${name}.exit_code는 ${expectedExit}이어야 합니다`);
  if (!validDigest(record.output_sha256)) errors.push(`${name}.output_sha256가 유효하지 않습니다`);
  if (!record.recorded_at || Number.isNaN(Date.parse(record.recorded_at))) errors.push(`${name}.recorded_at이 유효하지 않습니다`);
  if (!record.tree || typeof record.tree.head !== "string" || !validDigest(record.tree.status_sha256)) {
    errors.push(`${name}.tree 증거가 유효하지 않습니다`);
  } else if (sha256(record.tree.status ?? "") !== record.tree.status_sha256) {
    errors.push(`${name}.tree 상태 digest가 일치하지 않습니다`);
  }
  return errors;
}

export function validateTddEvidence(task, evidence) {
  if (task.test_mode !== "tdd") return [];
  const errors = [];
  if (!evidence || evidence.schema_version !== 1 || evidence.task_id !== task.id) {
    errors.push(`${task.id}: TDD 증거 형식이 유효하지 않습니다`);
    return errors;
  }
  errors.push(...validateRecord("red", evidence.red, null));
  errors.push(...validateRecord("green", evidence.green, 0));
  if (evidence.red?.exit_code === 0 || !Number.isInteger(evidence.red?.exit_code)) {
    errors.push("red.exit_code는 0이 아닌 정수여야 합니다");
  }
  if (evidence.red?.assertion_failure !== true) errors.push("red는 assertion 실패로 분류되어야 합니다");
  if (!sameCommand(evidence.red?.argv, evidence.green?.argv)) errors.push("RED와 GREEN은 동일한 명령을 사용해야 합니다");
  if (evidence.red?.recorded_at && evidence.green?.recorded_at && Date.parse(evidence.red.recorded_at) > Date.parse(evidence.green.recorded_at)) {
    errors.push("RED는 GREEN보다 먼저 기록되어야 합니다");
  }
  const expectedSpecs = [...task.spec_refs].sort();
  const recordedSpecs = Array.isArray(evidence.spec_refs) ? [...evidence.spec_refs].sort() : [];
  if (JSON.stringify(expectedSpecs) !== JSON.stringify(recordedSpecs)) errors.push("TDD 증거의 spec_refs가 작업과 일치하지 않습니다");
  return [...new Set(errors)];
}
