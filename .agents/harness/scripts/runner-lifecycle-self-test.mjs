import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { findTask, loadIndex } from "./lib/index.mjs";
import {
  beginAttempt,
  createRunnerFixtureRoot,
  finishAttempt,
  integrateBlockedTask,
  integrateSuccessfulTask,
  prepareTaskWorktree,
  readRunnerState,
  updateTaskStatus,
  validateSuccessfulTask
} from "./lib/orchestrator.mjs";

function command(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${executable} ${args.join(" ")} failed\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  return result.stdout.trim();
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(taskId) {
  const fixture = createRunnerFixtureRoot();
  const root = join(fixture, "integration");
  mkdirSync(join(root, "docs/phases"), { recursive: true });
  mkdirSync(join(root, ".agents/harness"), { recursive: true });
  const entries = [
    {
      schema_version: 2,
      kind: "task",
      id: "P0-T00",
      phase: "P0",
      title: "Harness base",
      summary: "Fixture dependency",
      status: "done",
      priority: "must",
      depends_on: [],
      doc: "docs/phases/00-foundation.md",
      spec_refs: ["DOCS:SDD"],
      verification: ["fixture"],
      test_mode: "verification",
      check_ids: ["fixture"],
      tags: ["fixture"],
      updated_at: "2026-07-23"
    },
    {
      schema_version: 2,
      kind: "task",
      id: taskId,
      phase: "P9",
      title: "Runner fixture",
      summary: "Exercise isolated worktree lifecycle",
      status: "planned",
      priority: "must",
      depends_on: ["P0-T00"],
      doc: "docs/phases/09-fixture.md",
      spec_refs: ["DOCS:SDD"],
      verification: ["fixture"],
      test_mode: "verification",
      check_ids: ["fixture"],
      tags: ["fixture"],
      updated_at: "2026-07-23"
    }
  ];
  writeFileSync(join(root, "docs/phases/index.jsonl"), `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  writeJson(join(root, ".agents/harness/config.json"), { max_attempts: 3 });
  command(root, "git", ["init", "-b", "main"]);
  command(root, "git", ["config", "user.name", "Harness Self Test"]);
  command(root, "git", ["config", "user.email", "harness@example.invalid"]);
  command(root, "git", ["add", "."]);
  command(root, "git", ["commit", "-m", "fixture: baseline"]);
  return { fixture, root, task: findTask(loadIndex(root).entries, taskId) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function successScenario() {
  const fixture = createFixture("P9-T01");
  try {
    const config = { max_attempts: 3 };
    const state = prepareTaskWorktree(fixture.root, fixture.task, config, {
      worktreeRoot: join(fixture.fixture, "worktrees")
    });
    assert(command(fixture.root, "git", ["status", "--porcelain"]) === "", "integration worktree was polluted during preparation");
    assert(findTask(loadIndex(fixture.root).entries, fixture.task.id).status === "planned", "integration index changed before success");
    assert(findTask(loadIndex(state.worktree_path).entries, fixture.task.id).status === "in_progress", "task worktree was not activated");

    const attempt = beginAttempt(fixture.root, state);
    updateTaskStatus(state.worktree_path, fixture.task.id, "done");
    const runDir = join(state.worktree_path, ".agents/runs", fixture.task.id);
    mkdirSync(runDir, { recursive: true });
    writeJson(join(runDir, "verification.json"), {
      task_id: fixture.task.id,
      status: "passed",
      spec_refs: fixture.task.spec_refs,
      checks: [{ check_id: "fixture", status: "passed" }]
    });
    mkdirSync(join(state.worktree_path, "src"), { recursive: true });
    writeFileSync(join(state.worktree_path, "src/success.txt"), "isolated success\n");
    command(state.worktree_path, "git", ["add", "."]);
    command(state.worktree_path, "git", ["commit", "-m", `feat(${fixture.task.id}): complete fixture task`]);
    const success = validateSuccessfulTask(fixture.task, state);
    finishAttempt(fixture.root, state, attempt, { exitCode: 0, outcome: "passed" });
    integrateSuccessfulTask(fixture.root, state, success);

    assert(findTask(loadIndex(fixture.root).entries, fixture.task.id).status === "done", "successful task was not integrated");
    assert(existsSync(join(fixture.root, "src/success.txt")), "successful task artifact was not integrated");
    assert(command(fixture.root, "git", ["status", "--porcelain"]) === "", "integration worktree is dirty after success");
    assert(readRunnerState(fixture.root, fixture.task.id).attempts.length === 1, "success attempt count is incorrect");
    console.log("runner lifecycle success self-test ok");
  } finally {
    rmSync(fixture.fixture, { recursive: true, force: true });
  }
}

function blockedScenario() {
  const fixture = createFixture("P9-T02");
  try {
    const config = { max_attempts: 3 };
    const state = prepareTaskWorktree(fixture.root, fixture.task, config, {
      worktreeRoot: join(fixture.fixture, "worktrees")
    });
    const interrupted = beginAttempt(fixture.root, state);
    const resumed = prepareTaskWorktree(fixture.root, fixture.task, config, {
      worktreeRoot: join(fixture.fixture, "worktrees")
    });
    assert(resumed.worktree_path === state.worktree_path, "runner did not reuse the recorded task worktree");
    assert(resumed.attempts[0].number === interrupted.number && resumed.attempts[0].outcome === "interrupted", "interrupted attempt was not recovered");

    mkdirSync(join(state.worktree_path, "src"), { recursive: true });
    writeFileSync(join(state.worktree_path, "src/failed-change.txt"), "must remain isolated\n");
    command(state.worktree_path, "git", ["add", "src/failed-change.txt"]);
    assert(command(state.worktree_path, "git", ["diff", "--cached", "--name-only"]) === "src/failed-change.txt", "fixture failed change was not staged");
    for (let number = 2; number <= config.max_attempts; number += 1) {
      const attempt = beginAttempt(fixture.root, state);
      finishAttempt(fixture.root, state, attempt, { exitCode: 1, outcome: "codex_failed", error: `fixture failure ${number}` });
    }
    let fourthAttemptRejected = false;
    try {
      beginAttempt(fixture.root, state);
    } catch (error) {
      fourthAttemptRejected = error.message.includes("maximum 3 attempts exhausted");
    }
    assert(fourthAttemptRejected, "runner allowed a fourth attempt");
    integrateBlockedTask(fixture.root, fixture.task, state);

    assert(findTask(loadIndex(fixture.root).entries, fixture.task.id).status === "blocked", "blocked status was not integrated");
    assert(!existsSync(join(fixture.root, "src/failed-change.txt")), "failed production change leaked into integration");
    assert(existsSync(join(fixture.root, ".agents/runs", fixture.task.id, "attempts.json")), "attempt evidence was not integrated");
    assert(existsSync(join(fixture.root, ".agents/runs", fixture.task.id, "manual-summary.md")), "manual summary was not integrated");
    assert(existsSync(join(state.worktree_path, "src/failed-change.txt")), "failed worktree change was not preserved");
    const integratedPaths = command(fixture.root, "git", ["show", "--pretty=", "--name-only", "HEAD"]).split(/\r?\n/).filter(Boolean).sort();
    assert(JSON.stringify(integratedPaths) === JSON.stringify([
      `.agents/runs/${fixture.task.id}/attempts.json`,
      `.agents/runs/${fixture.task.id}/manual-summary.md`,
      "docs/phases/index.jsonl"
    ].sort()), `blocked commit contained unexpected paths: ${integratedPaths.join(", ")}`);
    assert(command(state.worktree_path, "git", ["diff", "--cached", "--name-only"]) === "", "failed implementation remained staged after blocked commit");
    assert(command(fixture.root, "git", ["status", "--porcelain"]) === "", "integration worktree is dirty after blocked integration");
    assert(readRunnerState(fixture.root, fixture.task.id).attempts.length === 3, "blocked attempt count is incorrect");
    console.log("runner blocked-state self-test ok");
  } finally {
    rmSync(fixture.fixture, { recursive: true, force: true });
  }
}

const scenario = process.argv[2] ?? "all";
if (!["all", "success", "blocked"].includes(scenario)) throw new Error("Usage: runner-lifecycle-self-test.mjs [all|success|blocked]");
if (scenario === "all" || scenario === "success") successScenario();
if (scenario === "all" || scenario === "blocked") blockedScenario();
