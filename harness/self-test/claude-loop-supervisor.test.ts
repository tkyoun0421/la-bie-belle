import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  createFakeClaudeAdapter,
  createHeldRespawnAdapter,
  createLoopFixtureRoot,
  makeTask,
  readFakeClaudeLog,
  readLoopState,
  runLoopCommand,
  spawnLoopCommand,
  waitForFile,
  writeIndexRecords,
  writeRadio,
} from "./fixture.ts";

function runtimeDir(root: string): string {
  return join(root, ".claude", "runtime");
}

function statePath(root: string): string {
  return join(runtimeDir(root), "loop-state.json");
}

function lockPath(root: string): string {
  return join(runtimeDir(root), "supervisor.lock");
}

function writeLoopState(root: string, state: Record<string, unknown>): void {
  mkdirSync(runtimeDir(root), { recursive: true });
  writeFileSync(statePath(root), `${JSON.stringify(state, null, 2)}\n`);
}

function baseState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: 1,
    session_id: null,
    task_id: null,
    status: "stopped",
    attempt: 0,
    next_attempt_at: null,
    last_failure_at: null,
    last_error_kind: null,
    usage: {
      five_hour: { used_percentage: 0, resets_at: null },
      seven_day: { used_percentage: 0, resets_at: null },
      armed_window: null,
    },
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function readyTask(root: string, id = "P0-T01"): Record<string, unknown> {
  const hash = writeRadio(root, id, ["scripts/**"]);
  return makeTask({
    id,
    status: "planned",
    depends_on: [],
    development_approval: { by: "user", at: "2026-08-01", radio_revision: 1, radio_sha256: hash },
  });
}

test("claude-loop start — 다른 supervisor lock이 있으면 두 번째 start는 거부되고 그 lock을 지우지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [readyTask(root)]);
  mkdirSync(runtimeDir(root), { recursive: true });
  writeFileSync(lockPath(root), "999999");

  const result = runLoopCommand(root, ["start"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /supervisor already running/);
  assert.equal(readFileSync(lockPath(root), "utf8"), "999999");
});

test("claude-loop stop — 살아있는 supervisor의 lock을 삭제하지 않고 상태만 stopped로 남긴다", () => {
  const root = createLoopFixtureRoot();
  mkdirSync(runtimeDir(root), { recursive: true });
  writeFileSync(lockPath(root), "999999");
  writeLoopState(root, baseState({ status: "running", session_id: "sess-live" }));

  const result = runLoopCommand(root, ["stop"]);

  assert.equal(result.status, 0);
  assert.equal(readFileSync(lockPath(root), "utf8"), "999999");
  const state = readLoopState(root);
  assert.equal(state["status"], "stopped");
});

test("claude-loop start — stopped checkpoint는 재검사를 통과하면 새 세션을 만든다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [readyTask(root)]);
  writeLoopState(root, baseState({ status: "stopped", session_id: "old-session" }));
  const adapter = createFakeClaudeAdapter(root, { bgSessionId: "new-session" });

  const result = runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir }, timeout: 4_000 });
  void result;

  const log = readFakeClaudeLog(adapter.logPath);
  assert.equal(log.some((line) => line.startsWith("--bg")), true);
  const state = readLoopState(root);
  assert.equal(state["session_id"], "new-session");
  assert.equal(state["status"], "running");
});

test("claude-loop start — needs_user checkpoint는 자동으로 재기동하지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [readyTask(root)]);
  writeLoopState(root, baseState({ status: "needs_user", last_error_kind: "authentication_failed" }));
  const adapter = createFakeClaudeAdapter(root);

  const result = runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir } });

  assert.equal(result.status, 2);
  assert.match(`${result.stdout}${result.stderr}`, /needs_user/);
  assert.deepEqual(readFakeClaudeLog(adapter.logPath), []);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
});

test("claude-loop start --watch — needs_user checkpoint를 running으로 되살리지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeLoopState(root, baseState({ status: "needs_user", last_error_kind: "billing_error" }));

  const result = runLoopCommand(root, ["start", "--watch"], { timeout: 5_000 });

  assert.equal(result.status, 2);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
});

test("claude-loop start — 손상된 checkpoint는 needs_user로 fail-closed되어 새 세션을 만들지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [readyTask(root)]);
  mkdirSync(runtimeDir(root), { recursive: true });
  writeFileSync(statePath(root), "{ this is not json");
  const adapter = createFakeClaudeAdapter(root);

  const result = runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir } });

  assert.equal(result.status, 2);
  assert.deepEqual(readFakeClaudeLog(adapter.logPath), []);
  const status = runLoopCommand(root, ["status"]);
  assert.match(status.stdout, /"needs_user"/);
});

test("claude-loop start --dry-run — 세 가지 모드 모두 claude를 호출하지 않고 상태 파일도 쓰지 않는다", () => {
  const plain = createLoopFixtureRoot();
  writeIndexRecords(plain, [readyTask(plain)]);
  const plainAdapter = createFakeClaudeAdapter(plain);
  const plainResult = runLoopCommand(plain, ["start", "--dry-run"], {
    env: { PATH: plainAdapter.binDir },
  });
  assert.equal(plainResult.status, 0);
  const plainPlan = JSON.parse(plainResult.stdout);
  assert.equal(plainPlan.dry_run, true);
  assert.equal(plainPlan.action, "claude --bg");
  assert.equal(plainPlan.task_id, "P0-T01");
  assert.equal(existsSync(statePath(plain)), false);
  assert.deepEqual(readFakeClaudeLog(plainAdapter.logPath), []);

  const watchRoot = createLoopFixtureRoot();
  writeIndexRecords(watchRoot, [makeTask({ id: "P0-T02", status: "in_progress" })]);
  const watchAdapter = createFakeClaudeAdapter(watchRoot);
  const watchResult = runLoopCommand(watchRoot, ["start", "--watch", "--dry-run"], {
    env: { PATH: watchAdapter.binDir },
  });
  assert.equal(watchResult.status, 0);
  const watchPlan = JSON.parse(watchResult.stdout);
  assert.equal(watchPlan.action, "watch");
  assert.equal(watchPlan.task_id, "P0-T02");
  assert.equal(existsSync(statePath(watchRoot)), false);
  assert.deepEqual(readFakeClaudeLog(watchAdapter.logPath), []);

  const sessionRoot = createLoopFixtureRoot();
  const sessionAdapter = createFakeClaudeAdapter(sessionRoot);
  const sessionResult = runLoopCommand(
    sessionRoot,
    ["start", "--session-id", "existing-session", "--resume-at", "23:59", "--dry-run"],
    { env: { PATH: sessionAdapter.binDir } },
  );
  assert.equal(sessionResult.status, 0);
  const sessionPlan = JSON.parse(sessionResult.stdout);
  assert.equal(sessionPlan.action, "respawn");
  assert.equal(sessionPlan.session_id, "existing-session");
  assert.equal(existsSync(statePath(sessionRoot)), false);
  assert.deepEqual(readFakeClaudeLog(sessionAdapter.logPath), []);
});

test("claude-loop start — claude --bg 호출 인자에 bypass 권한 플래그가 없다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [readyTask(root)]);
  const adapter = createFakeClaudeAdapter(root, { bgSessionId: "new-session-1" });

  const result = runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir }, timeout: 4_000 });
  void result;

  const log = readFakeClaudeLog(adapter.logPath);
  assert.equal(log.length >= 1, true);
  for (const line of log) {
    assert.doesNotMatch(line, /dangerously-skip-permissions/);
  }
});

test("claude-loop record-failure — index.jsonl의 in_progress task로 task_id를 유도해 채운다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [makeTask({ id: "P0-T05", status: "in_progress" })]);
  writeLoopState(root, baseState({ session_id: "sess-a" }));

  const result = runLoopCommand(root, ["record-failure"], {
    input: JSON.stringify({ session_id: "sess-a", error_type: "rate_limit" }),
  });

  assert.equal(result.status, 0);
  const state = readLoopState(root);
  assert.equal(state["task_id"], "P0-T05");
});

test("claude-loop start --watch — task_id가 비어 있으면 index.jsonl에서 유도해 채운다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [makeTask({ id: "P0-T09", status: "in_progress" })]);

  const result = runLoopCommand(root, ["start", "--watch"], { timeout: 5_000 });
  void result;

  const state = readLoopState(root);
  assert.equal(state["task_id"], "P0-T09");
});

test("claude-loop record-usage — waiting_rate_limit 안전 대기 상태는 usage 기록으로도 살아나지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeLoopState(
    root,
    baseState({
      status: "waiting_rate_limit",
      session_id: "sess-b",
      next_attempt_at: "2026-08-09T00:00:00.000Z",
    }),
  );

  const result = runLoopCommand(root, ["record-usage"], {
    input: JSON.stringify({
      rate_limits: {
        five_hour: { used_percentage: 99, resets_at: "2026-08-08T02:00:00Z" },
        seven_day: { used_percentage: 0, resets_at: null },
      },
    }),
  });

  assert.equal(result.status, 0);
  const state = readLoopState(root);
  assert.equal(state["status"], "waiting_rate_limit");
});

test("claude-loop record-failure — 상태 lock을 살아있는 다른 프로세스가 쥐고 있으면 이번 회차를 건너뛰고 경고와 함께 비영으로 종료한다", () => {
  const root = createLoopFixtureRoot();
  const initial = baseState({ status: "waiting_rate_limit", session_id: "sess-c", attempt: 3 });
  writeLoopState(root, initial);
  mkdirSync(runtimeDir(root), { recursive: true });
  const heldLock = join(runtimeDir(root), "loop-state.lock");
  writeFileSync(heldLock, String(process.pid));

  const result = runLoopCommand(root, ["record-failure"], {
    input: JSON.stringify({ session_id: "sess-c", error_type: "rate_limit" }),
    timeout: 3_000,
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /lock/);
  const state = readLoopState(root);
  assert.equal(state["attempt"], 3);
  assert.equal(state["updated_at"], initial["updated_at"]);
});

test("claude-loop record-failure — 소유 프로세스가 죽은 상태 lock은 회수해 갱신을 진행한다", () => {
  const root = createLoopFixtureRoot();
  const initial = baseState({ status: "waiting_rate_limit", session_id: "sess-dead-lock", attempt: 3 });
  writeLoopState(root, initial);
  mkdirSync(runtimeDir(root), { recursive: true });
  writeFileSync(join(runtimeDir(root), "loop-state.lock"), "999999");

  const result = runLoopCommand(root, ["record-failure"], {
    input: JSON.stringify({ session_id: "sess-dead-lock", error_type: "rate_limit" }),
    timeout: 3_000,
  });

  assert.equal(result.status, 0);
  const state = readLoopState(root);
  assert.notEqual(state["updated_at"], initial["updated_at"]);
  assert.equal(existsSync(join(runtimeDir(root), "loop-state.lock")), false);
});

test("claude-loop start — due한 waiting_rate_limit은 respawn 한 번만으로 running에 수렴한다", () => {
  const root = createLoopFixtureRoot();
  writeLoopState(
    root,
    baseState({
      status: "waiting_rate_limit",
      session_id: "sess-due",
      attempt: 1,
      next_attempt_at: "2020-01-01T00:00:00.000Z",
    }),
  );
  const adapter = createFakeClaudeAdapter(root, { respawnExitCode: 0 });

  runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir }, timeout: 7_500 });

  const log = readFakeClaudeLog(adapter.logPath).filter((line) => line.startsWith("respawn"));
  assert.equal(log.length, 1);
  const state = readLoopState(root);
  assert.equal(state["status"], "running");
});

test("claude-loop start — respawn 성공 기록 직후 상태 lock이 죽은 pid로 남아 있어도 재시도로 회복해 중복 respawn을 만들지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeLoopState(
    root,
    baseState({
      status: "waiting_rate_limit",
      session_id: "sess-stale-lock",
      attempt: 1,
      next_attempt_at: "2020-01-01T00:00:00.000Z",
    }),
  );
  mkdirSync(runtimeDir(root), { recursive: true });
  writeFileSync(join(runtimeDir(root), "loop-state.lock"), "999999");
  const adapter = createFakeClaudeAdapter(root, { respawnExitCode: 0 });

  runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir }, timeout: 7_500 });

  const log = readFakeClaudeLog(adapter.logPath).filter((line) => line.startsWith("respawn"));
  assert.equal(log.length, 1);
  const state = readLoopState(root);
  assert.equal(state["status"], "running");
});

test("claude-loop start — respawn 실행 중 record-failure가 needs_user를 기록하면 성공 기록이 이를 덮지 않는다", async () => {
  const root = createLoopFixtureRoot();
  writeLoopState(
    root,
    baseState({
      status: "waiting_rate_limit",
      session_id: "sess-race",
      attempt: 1,
      next_attempt_at: "2020-01-01T00:00:00.000Z",
    }),
  );
  const adapter = createHeldRespawnAdapter(root, { respawnExitCode: 0 });
  const child = spawnLoopCommand(root, ["start"], { env: { PATH: adapter.binDir } });

  try {
    await waitForFile(adapter.startedMarkerPath);

    const failure = runLoopCommand(root, ["record-failure"], {
      input: JSON.stringify({ session_id: "sess-race", error_type: "authentication_failed" }),
    });
    assert.equal(failure.status, 0);
    const midFlightState = readLoopState(root);
    assert.equal(midFlightState["status"], "needs_user");

    writeFileSync(adapter.releaseMarkerPath, "");
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    child.kill();
  }

  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "authentication_failed");
});

test("claude-loop start — last_error_kind가 없는 needs_user도 안내와 함께 즉시 멈추고 claude를 호출하지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeIndexRecords(root, [readyTask(root)]);
  writeLoopState(root, baseState({ status: "needs_user", last_error_kind: null }));
  const adapter = createFakeClaudeAdapter(root);

  const result = runLoopCommand(root, ["start"], { env: { PATH: adapter.binDir } });

  assert.equal(result.status, 2);
  assert.match(`${result.stdout}${result.stderr}`, /needs_user/);
  assert.deepEqual(readFakeClaudeLog(adapter.logPath), []);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
});

test("claude-loop start --watch — last_error_kind가 없는 needs_user도 running으로 되살리지 않는다", () => {
  const root = createLoopFixtureRoot();
  writeLoopState(root, baseState({ status: "needs_user", last_error_kind: null }));

  const result = runLoopCommand(root, ["start", "--watch"], { timeout: 5_000 });

  assert.equal(result.status, 2);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
});
