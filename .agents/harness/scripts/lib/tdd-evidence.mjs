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
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed\n${result.stderr ?? ""}`);
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
  if (!Array.isArray(record.argv) || record.argv.length === 0) errors.push(`${name}.argv is required`);
  if (expectedExit !== null && record.exit_code !== expectedExit) errors.push(`${name}.exit_code must be ${expectedExit}`);
  if (!validDigest(record.output_sha256)) errors.push(`${name}.output_sha256 is invalid`);
  if (!record.recorded_at || Number.isNaN(Date.parse(record.recorded_at))) errors.push(`${name}.recorded_at is invalid`);
  if (!record.tree || typeof record.tree.head !== "string" || !validDigest(record.tree.status_sha256)) {
    errors.push(`${name}.tree evidence is invalid`);
  } else if (sha256(record.tree.status ?? "") !== record.tree.status_sha256) {
    errors.push(`${name}.tree status digest does not match`);
  }
  return errors;
}

export function validateTddEvidence(task, evidence) {
  if (task.test_mode !== "tdd") return [];
  const errors = [];
  if (!evidence || evidence.schema_version !== 1 || evidence.task_id !== task.id) {
    errors.push(`${task.id}: invalid TDD evidence envelope`);
    return errors;
  }
  errors.push(...validateRecord("red", evidence.red, null));
  errors.push(...validateRecord("green", evidence.green, 0));
  if (evidence.red?.exit_code === 0 || !Number.isInteger(evidence.red?.exit_code)) {
    errors.push("red.exit_code must be a non-zero integer");
  }
  if (evidence.red?.assertion_failure !== true) errors.push("red must be classified as an assertion failure");
  if (!sameCommand(evidence.red?.argv, evidence.green?.argv)) errors.push("RED and GREEN must use the same command");
  if (evidence.red?.recorded_at && evidence.green?.recorded_at && Date.parse(evidence.red.recorded_at) > Date.parse(evidence.green.recorded_at)) {
    errors.push("RED must be recorded before GREEN");
  }
  const expectedSpecs = [...task.spec_refs].sort();
  const recordedSpecs = Array.isArray(evidence.spec_refs) ? [...evidence.spec_refs].sort() : [];
  if (JSON.stringify(expectedSpecs) !== JSON.stringify(recordedSpecs)) errors.push("TDD evidence spec_refs do not match task");
  return [...new Set(errors)];
}
