import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../lib/repo.ts";
import { createFixtureRoot, makeTask, writeIndexRecords, writeRadio } from "./fixture.ts";

function createLoopFixtureRoot(): string {
  const root = createFixtureRoot();
  const source = resolveRepoRoot();
  cpSync(join(source, "harness", "lib"), join(root, "harness", "lib"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  cpSync(join(source, "scripts", "claude-loop.mjs"), join(root, "scripts", "claude-loop.mjs"));
  return root;
}

type LoopRunResult = { readonly status: number; readonly stdout: string; readonly stderr: string };

function runLoopStart(root: string): LoopRunResult {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", "scripts/claude-loop.mjs", "start"],
    { cwd: root, encoding: "utf8", env: { ...process.env, PATH: "" }, timeout: 15_000 },
  );
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function readLoopState(root: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, ".claude/runtime/loop-state.json"), "utf8"));
}

test("claude-loop start — 재검사를 통과한 승인 상태는 claude 호출을 시도하고 게이트 메시지를 남기지 않는다", () => {
  const root = createLoopFixtureRoot();
  const hash = writeRadio(root, "P0-T01", ["scripts/**"]);
  const task = makeTask({
    id: "P0-T01",
    status: "in_progress",
    development_approval: { by: "user", at: "2026-08-03", radio_revision: 1, radio_sha256: hash },
  });
  writeIndexRecords(root, [task]);

  const result = runLoopStart(root);

  assert.doesNotMatch(result.stderr, /repository reverification blocked/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "unknown");
});

test("claude-loop start — in_progress task가 둘이면 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  const hash = writeRadio(root, "P0-T01", ["scripts/**"]);
  const first = makeTask({
    id: "P0-T01",
    status: "in_progress",
    development_approval: { by: "user", at: "2026-08-03", radio_revision: 1, radio_sha256: hash },
  });
  const second = makeTask({ id: "P0-T02", status: "in_progress" });
  writeIndexRecords(root, [first, second]);

  const result = runLoopStart(root);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /in_progress/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], null);
  assert.equal(result.status, 2);
});

test("claude-loop start — 승인 계약이 깨진 in_progress task는 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  const task = makeTask({ id: "P0-T01", status: "in_progress" });
  delete task["development_approval"];
  writeIndexRecords(root, [task]);

  const result = runLoopStart(root);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /development_approval/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], null);
  assert.equal(result.status, 2);
});

test("claude-loop start — RADIO 해시가 승인 기록과 다르면 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  writeRadio(root, "P0-T01", ["scripts/**"]);
  const task = makeTask({ id: "P0-T01", status: "in_progress" });
  writeIndexRecords(root, [task]);

  const result = runLoopStart(root);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /해시/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], null);
  assert.equal(result.status, 2);
});

test("claude-loop start — --watch는 저장소 재검사를 거치지 않는다", () => {
  const root = createLoopFixtureRoot();
  const first = makeTask({ id: "P0-T01", status: "in_progress" });
  const second = makeTask({ id: "P0-T02", status: "in_progress" });
  writeIndexRecords(root, [first, second]);

  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      "scripts/claude-loop.mjs",
      "start",
      "--watch",
    ],
    { cwd: root, encoding: "utf8", env: { ...process.env, PATH: "" }, timeout: 5_000 },
  );

  assert.doesNotMatch(`${result.stdout ?? ""}${result.stderr ?? ""}`, /repository reverification blocked/);
});

test("claude-loop start — 재검사 거부 후 supervisor lock이 정리되어 재시도할 수 있다", () => {
  const root = createLoopFixtureRoot();
  const first = makeTask({ id: "P0-T01", status: "in_progress" });
  const second = makeTask({ id: "P0-T02", status: "in_progress" });
  writeIndexRecords(root, [first, second]);

  runLoopStart(root);
  const retry = runLoopStart(root);

  assert.doesNotMatch(retry.stderr, /supervisor already running/);
  assert.match(retry.stderr, /repository reverification blocked/);
});
