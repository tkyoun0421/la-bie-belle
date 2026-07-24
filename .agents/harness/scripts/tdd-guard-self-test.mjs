import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  isAssertionFailure,
  isInfrastructureFailure,
  sameCommand,
  sha256,
  validateTddEvidence
} from "./lib/tdd-evidence.mjs";

const task = { id: "P9-T03", test_mode: "tdd", spec_refs: ["DOCS:SDD"] };
const argv = ["node", "--test", "test/example.test.mjs"];
const tree = { head: "a".repeat(40), status: " M src/example.mjs", status_sha256: sha256(" M src/example.mjs") };
const evidence = {
  schema_version: 1,
  task_id: task.id,
  spec_refs: task.spec_refs,
  red: {
    argv,
    exit_code: 1,
    assertion_failure: true,
    output_sha256: sha256("AssertionError: expected 1 to equal 2"),
    recorded_at: "2026-07-23T00:00:00.000Z",
    tree
  },
  green: {
    argv,
    exit_code: 0,
    output_sha256: sha256("1 test passed"),
    recorded_at: "2026-07-23T00:01:00.000Z",
    tree: { ...tree, status: "", status_sha256: sha256("") }
  }
};

assert.deepEqual(validateTddEvidence(task, evidence), []);
assert.equal(sameCommand(argv, [...argv]), true);
assert.equal(sameCommand(argv, ["node", "--test", "test/other.test.mjs"]), false);

const assertionProcess = spawnSync(process.execPath, ["-e", "const assert=require('node:assert/strict'); assert.equal(1, 2)"], { encoding: "utf8" });
const assertionOutput = `${assertionProcess.stdout ?? ""}${assertionProcess.stderr ?? ""}`;
assert.notEqual(assertionProcess.status, 0);
assert.equal(isAssertionFailure(assertionOutput), true);
assert.equal(isInfrastructureFailure("Error: Cannot find module 'missing-package'"), true);
assert.equal(isAssertionFailure("Error: process exited with code 1"), false);

const mismatched = structuredClone(evidence);
mismatched.green.argv = ["node", "--test", "test/other.test.mjs"];
assert.ok(validateTddEvidence(task, mismatched).includes("RED와 GREEN은 동일한 명령을 사용해야 합니다"));

const tamperedExit = structuredClone(evidence);
tamperedExit.green.exit_code = 1;
assert.ok(validateTddEvidence(task, tamperedExit).some((error) => error.includes("green.exit_code")));

const tamperedTree = structuredClone(evidence);
tamperedTree.red.tree.status = " M src/tampered.mjs";
assert.ok(validateTddEvidence(task, tamperedTree).some((error) => error.includes("tree 상태 digest")));

const missingSpec = structuredClone(evidence);
missingSpec.spec_refs = [];
assert.ok(validateTddEvidence(task, missingSpec).includes("TDD 증거의 spec_refs가 작업과 일치하지 않습니다"));

function run(cwd, executable, args) {
  return spawnSync(executable, args, { cwd, encoding: "utf8" });
}

const fixture = mkdtempSync(join(tmpdir(), "la-bie-belle-tdd-guard-"));
try {
  const fixtureRoot = join(fixture, "repo");
  const scriptsDir = join(fixtureRoot, ".agents/harness/scripts");
  const libDir = join(scriptsDir, "lib");
  mkdirSync(libDir, { recursive: true });
  mkdirSync(join(fixtureRoot, "docs/phases"), { recursive: true });
  mkdirSync(join(fixtureRoot, "test"), { recursive: true });
  for (const relativePath of ["tdd-guard.mjs", "lib/index.mjs", "lib/tdd-evidence.mjs"]) {
    cpSync(join(import.meta.dirname, relativePath), join(scriptsDir, relativePath));
  }
  const taskFixture = (id, status) => ({
    schema_version: 2,
    kind: "task",
    id,
    phase: "P9",
    title: `TDD fixture ${id}`,
    summary: "Exercise the TDD guard CLI",
    status,
    priority: "must",
    depends_on: [],
    doc: "docs/phases/09-fixture.md",
    spec_refs: ["DOCS:SDD"],
    verification: ["fixture"],
    test_mode: "tdd",
    check_ids: ["fixture"],
    tags: ["fixture"],
    updated_at: "2026-07-23",
    approved_by: "user",
    approved_at: "2026-07-23"
  });
  const fixtureEntries = [
    taskFixture("P9-T03", "in_progress"),
    taskFixture("P9-T04", "planned"),
    taskFixture("P9-T05", "planned")
  ];
  writeFileSync(join(fixtureRoot, "docs/phases/index.jsonl"), `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  writeFileSync(join(fixtureRoot, "test/state.json"), `${JSON.stringify({ pass: false })}\n`);
  writeFileSync(join(fixtureRoot, "test/fixture.mjs"), [
    "import assert from 'node:assert/strict';",
    "import { readFileSync } from 'node:fs';",
    "const state = JSON.parse(readFileSync(new URL('./state.json', import.meta.url), 'utf8'));",
    "assert.equal(state.pass, true);",
    ""
  ].join("\n"));
  for (const args of [
    ["init", "-b", "main"],
    ["config", "user.name", "TDD Guard Self Test"],
    ["config", "user.email", "tdd-guard@example.invalid"],
    ["add", "."],
    ["commit", "-m", "fixture: baseline"]
  ]) {
    const result = run(fixtureRoot, "git", args);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  }

  const guardPath = join(scriptsDir, "tdd-guard.mjs");
  const testCommand = ["node", "test/fixture.mjs"];
  const redResult = run(fixtureRoot, process.execPath, [guardPath, "red", "P9-T03", "--", ...testCommand]);
  assert.equal(redResult.status, 0, `${redResult.stdout}${redResult.stderr}`);
  writeFileSync(join(fixtureRoot, "test/state.json"), `${JSON.stringify({ pass: true })}\n`);
  const greenResult = run(fixtureRoot, process.execPath, [guardPath, "green", "P9-T03", "--", ...testCommand]);
  assert.equal(greenResult.status, 0, `${greenResult.stdout}${greenResult.stderr}`);
  const checkResult = run(fixtureRoot, process.execPath, [guardPath, "check", "P9-T03"]);
  assert.equal(checkResult.status, 0, `${checkResult.stdout}${checkResult.stderr}`);
  const recorded = JSON.parse(readFileSync(join(fixtureRoot, ".agents/runs/P9-T03/tdd.json"), "utf8"));
  assert.deepEqual(validateTddEvidence(fixtureEntries[0], recorded), []);

  const infraRed = run(fixtureRoot, process.execPath, [guardPath, "red", "P9-T04", "--", "node", "test/missing.mjs"]);
  assert.notEqual(infraRed.status, 0);
  assert.match(`${infraRed.stdout}${infraRed.stderr}`, /RED는 인프라 오류가 아닌 assertion 실패/);

  writeFileSync(join(fixtureRoot, "test/state.json"), `${JSON.stringify({ pass: false })}\n`);
  const secondRed = run(fixtureRoot, process.execPath, [guardPath, "red", "P9-T05", "--", ...testCommand]);
  assert.equal(secondRed.status, 0, `${secondRed.stdout}${secondRed.stderr}`);
  writeFileSync(join(fixtureRoot, "test/state.json"), `${JSON.stringify({ pass: true })}\n`);
  const mismatchedGreen = run(fixtureRoot, process.execPath, [guardPath, "green", "P9-T05", "--", "node", "-e", "process.exit(0)"]);
  assert.notEqual(mismatchedGreen.status, 0);
  assert.match(`${mismatchedGreen.stdout}${mismatchedGreen.stderr}`, /GREEN은 RED와 동일한 명령/);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log("TDD 가드 수용 자체 검사를 통과했습니다");
