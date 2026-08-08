import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { LoopState } from "../lib/claude-loop-state.ts";
import {
  EPISODE_WINDOW_MS,
  ERROR_TYPES,
  MAX_RETRY_ATTEMPTS,
  deriveTaskId,
  initialState,
  isSafeToInvokeClaude,
  normalizeErrorType,
  readState,
  recordFailure,
  recordRespawnFailure,
  recordRespawnSuccess,
  recordUsage,
  sanitizeState,
  selectQueueTask,
} from "../lib/claude-loop-state.ts";
import { indexEntriesOf, makeTask } from "./fixture.ts";

const now = new Date("2026-08-07T00:00:00.000Z");

test("usage arms at exactly 95% and stores reset times", () => {
  const state = recordUsage(
    { ...initialState(), status: "running" },
    {
      session_id: "session-test-1",
      rate_limits: {
        five_hour: { used_percentage: 95, resets_at: "2026-08-07T01:00:00Z" },
        seven_day: { used_percentage: 20, resets_at: "2026-08-10T00:00:00Z" },
      },
    },
    now,
  );
  assert.equal(state.status, "armed");
  assert.equal(state.usage.armed_window, "five_hour");
  assert.equal(state.usage.five_hour.used_percentage, 95);
});

test("usage below 94% does not arm and 100% clamps", () => {
  const below = recordUsage(
    { ...initialState(), status: "running" },
    { rate_limits: { five_hour: { used_percentage: 94, resets_at: null }, seven_day: { used_percentage: 10, resets_at: null } } },
    now,
  );
  assert.equal(below.usage.armed_window, null);
  assert.equal(below.status, "running");

  const clamped = recordUsage(
    { ...initialState(), status: "running" },
    { rate_limits: { five_hour: { used_percentage: 140, resets_at: null }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  assert.equal(clamped.usage.five_hour.used_percentage, 100);
  assert.equal(clamped.status, "armed");
});

test("recordUsage preserves waiting_rate_limit, needs_user, and stopped status while still refreshing usage fields", () => {
  const highUsageInput = {
    rate_limits: {
      five_hour: { used_percentage: 99, resets_at: "2026-08-07T01:00:00Z" },
      seven_day: { used_percentage: 0, resets_at: null },
    },
  };
  for (const guardedStatus of ["waiting_rate_limit", "needs_user", "stopped"] as const) {
    const guarded: LoopState = { ...initialState(), status: guardedStatus, session_id: "sess" };
    const result = recordUsage(guarded, highUsageInput, now);
    assert.equal(result.status, guardedStatus);
    assert.equal(result.usage.armed_window, "five_hour");
    assert.equal(result.usage.five_hour.used_percentage, 99);
  }
});

test("recordUsage still toggles between running and armed once the lifecycle status is not guarded", () => {
  const running: LoopState = { ...initialState(), status: "running" };
  const armed = recordUsage(
    running,
    { rate_limits: { five_hour: { used_percentage: 96, resets_at: null }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  assert.equal(armed.status, "armed");
  const droppedBelowThreshold = recordUsage(
    armed,
    { rate_limits: { five_hour: { used_percentage: 10, resets_at: null }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  assert.equal(droppedBelowThreshold.status, "running");
});

test("resets_at as epoch seconds normalizes to ISO 8601", () => {
  const state = recordUsage(
    initialState(),
    { rate_limits: { five_hour: { used_percentage: 96, resets_at: 1786100000 }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  assert.equal(state.usage.five_hour.resets_at, new Date(1786100000 * 1000).toISOString());
});

test("record-usage without rate_limits leaves state untouched", () => {
  const armed = recordUsage(
    initialState(),
    { rate_limits: { five_hour: { used_percentage: 96, resets_at: "2026-08-07T02:00:00Z" }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  const untouched = recordUsage(armed, { hello: "world" }, new Date("2026-08-07T00:05:00.000Z"));
  assert.deepEqual(untouched, armed);

  const malformedInput = recordUsage(armed, null, now);
  assert.deepEqual(malformedInput, armed);
});

test("all ten documented error types normalize and only rate_limit/overloaded get bounded backoff", () => {
  assert.deepEqual(
    [...ERROR_TYPES].sort(),
    [
      "authentication_failed",
      "billing_error",
      "invalid_request",
      "max_output_tokens",
      "model_not_found",
      "oauth_org_not_allowed",
      "overloaded",
      "rate_limit",
      "server_error",
      "unknown",
    ].sort(),
  );
  assert.equal(normalizeErrorType("rate_limit"), "rate_limit");
  assert.equal(normalizeErrorType("something-new"), "unknown");
  assert.equal(normalizeErrorType(42), "unknown");

  for (const type of ERROR_TYPES) {
    const result = recordFailure(initialState(), { session_id: `s-${type}`, error_type: type }, now);
    if (type === "rate_limit" || type === "overloaded") {
      assert.equal(result.status, "waiting_rate_limit", type);
    } else {
      assert.equal(result.status, "needs_user", type);
    }
    assert.equal(result.last_error_kind, type);
  }
});

test("unclassified error_type normalizes to unknown and stops safely", () => {
  const blocked = recordFailure(initialState(), { session_id: "sess", error_type: "totally_new_type" }, now);
  assert.equal(blocked.status, "needs_user");
  assert.equal(blocked.last_error_kind, "unknown");
});

test("overloaded uses backoff only, without a reset time", () => {
  const armed = recordUsage(
    initialState(),
    { rate_limits: { five_hour: { used_percentage: 96, resets_at: "2026-08-08T00:00:00Z" }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  const waiting = recordFailure({ ...armed, session_id: "sess" }, { session_id: "sess", error_type: "overloaded" }, now);
  assert.equal(waiting.status, "waiting_rate_limit");
  assert.equal(waiting.next_attempt_at, new Date(now.getTime() + 5 * 60_000).toISOString());
});

test("rate_limit backoff respects the armed reset time boundary", () => {
  const armed = recordUsage(
    initialState(),
    { rate_limits: { five_hour: { used_percentage: 96, resets_at: "2026-08-07T00:20:00Z" }, seven_day: { used_percentage: 0, resets_at: null } } },
    now,
  );
  const waiting = recordFailure({ ...armed, session_id: "sess" }, { session_id: "sess", error_type: "rate_limit" }, now);
  assert.equal(waiting.next_attempt_at, "2026-08-07T00:20:00.000Z");
});

test("retries beyond the cap of six stop with needs_user", () => {
  let state: LoopState = { ...initialState(), session_id: "sess" };
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    state = recordFailure({ ...state, status: "running" }, { session_id: "sess", error_type: "overloaded" }, now);
    assert.equal(state.status, "waiting_rate_limit");
    assert.equal(state.attempt, attempt);
  }
  const overflow = recordFailure({ ...state, status: "running" }, { session_id: "sess", error_type: "overloaded" }, now);
  assert.equal(overflow.status, "needs_user");
  assert.equal(overflow.attempt, MAX_RETRY_ATTEMPTS + 1);
});

test("respawn failure increases attempt and recomputes backoff up to the cap", () => {
  let state: LoopState = { ...initialState(), session_id: "sess", status: "waiting_rate_limit", attempt: 0 };
  state = recordRespawnFailure(state, now);
  assert.equal(state.status, "waiting_rate_limit");
  assert.equal(state.attempt, 1);
  assert.equal(state.next_attempt_at, new Date(now.getTime() + 5 * 60_000).toISOString());

  const atCap = { ...state, attempt: MAX_RETRY_ATTEMPTS };
  const overflow = recordRespawnFailure(atCap, now);
  assert.equal(overflow.status, "needs_user");
  assert.equal(overflow.attempt, MAX_RETRY_ATTEMPTS + 1);
});

test("respawn success clears the pending wakeup and resumes running", () => {
  const waiting = { ...initialState(), session_id: "sess", status: "waiting_rate_limit" as const, attempt: 2, next_attempt_at: now.toISOString() };
  const resumed = recordRespawnSuccess(waiting, now);
  assert.equal(resumed.status, "running");
  assert.equal(resumed.next_attempt_at, null);
});

test("respawn success does not revive a needs_user or stopped checkpoint set while the respawn call was in flight", () => {
  const needsUser: LoopState = {
    ...initialState(),
    session_id: "sess",
    status: "needs_user",
    last_error_kind: "authentication_failed",
  };
  assert.deepEqual(recordRespawnSuccess(needsUser, now), needsUser);

  const stopped: LoopState = { ...initialState(), session_id: "sess", status: "stopped" };
  assert.deepEqual(recordRespawnSuccess(stopped, now), stopped);
});

test("respawn failure does not revive a needs_user or stopped checkpoint set while the respawn call was in flight", () => {
  const needsUser: LoopState = {
    ...initialState(),
    session_id: "sess",
    status: "needs_user",
    last_error_kind: "billing_error",
    attempt: 3,
  };
  assert.deepEqual(recordRespawnFailure(needsUser, now), needsUser);

  const stopped: LoopState = { ...initialState(), session_id: "sess", status: "stopped", attempt: 3 };
  assert.deepEqual(recordRespawnFailure(stopped, now), stopped);
});

test("a repeated failure event for the same session updates state only once", () => {
  const first = recordFailure({ ...initialState(), session_id: "sess" }, { session_id: "sess", error_type: "rate_limit" }, now);
  assert.equal(first.attempt, 1);
  const duplicate = recordFailure(first, { session_id: "sess", error_type: "rate_limit" }, new Date(now.getTime() + 1000));
  assert.deepEqual(duplicate, first);

  const blocked = recordFailure({ ...initialState(), session_id: "sess" }, { session_id: "sess", error_type: "billing_error" }, now);
  const duplicateBlocked = recordFailure(blocked, { session_id: "sess", error_type: "billing_error" }, new Date(now.getTime() + 1000));
  assert.deepEqual(duplicateBlocked, blocked);
});

test("a new failure for a different session is not treated as a duplicate", () => {
  const first = recordFailure({ ...initialState(), session_id: "sess-a" }, { session_id: "sess-a", error_type: "rate_limit" }, now);
  const second = recordFailure(first, { session_id: "sess-b", error_type: "rate_limit" }, new Date(now.getTime() + 1000));
  assert.equal(second.attempt, 2);
  assert.equal(second.session_id, "sess-b");
});

test("a failure within the episode window keeps counting attempts", () => {
  const first = recordFailure({ ...initialState(), session_id: "sess" }, { session_id: "sess", error_type: "rate_limit" }, now);
  const resumed = recordRespawnSuccess(first, new Date(now.getTime() + 5 * 60_000));
  const second = recordFailure(resumed, { session_id: "sess", error_type: "rate_limit" }, new Date(now.getTime() + 30 * 60_000));
  assert.equal(second.attempt, 2);
});

test("a failure after the episode window starts a fresh attempt count", () => {
  const first = recordFailure({ ...initialState(), session_id: "sess", attempt: 4 }, { session_id: "sess", error_type: "rate_limit" }, now);
  const resumed = recordRespawnSuccess(first, new Date(now.getTime() + 5 * 60_000));
  const second = recordFailure(resumed, { session_id: "sess", error_type: "rate_limit" }, new Date(now.getTime() + EPISODE_WINDOW_MS + 60_000));
  assert.equal(second.attempt, 1);
  assert.equal(second.status, "waiting_rate_limit");
});

test("a failure one millisecond before the one-hour episode boundary still counts within the episode", () => {
  const priorFailure: LoopState = {
    ...initialState(),
    session_id: "sess",
    attempt: 3,
    last_failure_at: now.toISOString(),
    status: "waiting_rate_limit",
  };
  const justBeforeBoundary = new Date(now.getTime() + EPISODE_WINDOW_MS - 1);
  const result = recordFailure(priorFailure, { session_id: "sess", error_type: "rate_limit" }, justBeforeBoundary);
  assert.equal(result.attempt, 4);
  assert.equal(result.status, "waiting_rate_limit");
});

test("a failure exactly at the one-hour episode boundary starts a fresh episode", () => {
  const priorFailure: LoopState = {
    ...initialState(),
    session_id: "sess",
    attempt: 3,
    last_failure_at: now.toISOString(),
    status: "waiting_rate_limit",
  };
  const atBoundary = new Date(now.getTime() + EPISODE_WINDOW_MS);
  const result = recordFailure(priorFailure, { session_id: "sess", error_type: "rate_limit" }, atBoundary);
  assert.equal(result.attempt, 1);
  assert.equal(result.status, "waiting_rate_limit");
});

test("sanitizer keeps last_failure_at only as a string", () => {
  assert.equal(sanitizeState({ last_failure_at: 12345 }).last_failure_at, null);
  assert.equal(sanitizeState({ last_failure_at: "2026-08-07T00:00:00.000Z" }).last_failure_at, "2026-08-07T00:00:00.000Z");
});

test("state sanitizer removes unapproved and oversized values", () => {
  const state = sanitizeState({ status: "running", session_id: "x".repeat(300), secret: "no", usage: { five_hour: { used_percentage: 101 } } });
  assert.equal(state.session_id?.length, 128);
  assert.equal(state.usage.five_hour.used_percentage, 100);
  assert.equal("secret" in state, false);
});

test("sanitizer normalizes an unknown last_error_kind and rejects an unknown status", () => {
  const state = sanitizeState({ status: "hallucinated", last_error_kind: "not-a-real-type" });
  assert.equal(state.status, "needs_user");
  assert.equal(state.last_error_kind, "unknown");
});

test("hook and statusline inputs never leak raw fields into stored state", () => {
  const state = recordFailure(
    initialState(),
    {
      session_id: "sess",
      prompt_id: "prompt-1",
      transcript_path: "/Users/example/.claude/projects/x/transcript.jsonl",
      cwd: "/Users/example/secret-project",
      permission_mode: "acceptEdits",
      hook_event_name: "StopFailure",
      error_type: "rate_limit",
      error_message: "sk-ant-super-secret-token leaked in raw error text",
    },
    now,
  );
  const serialized = JSON.stringify(state);
  assert.doesNotMatch(serialized, /transcript_path/);
  assert.doesNotMatch(serialized, /secret-project/);
  assert.doesNotMatch(serialized, /permission_mode/);
  assert.doesNotMatch(serialized, /prompt_id/);
  assert.doesNotMatch(serialized, /super-secret-token/);
  assert.doesNotMatch(serialized, /leaked in raw error text/);
  assert.equal(Object.keys(state).sort().join(","), Object.keys(initialState()).sort().join(","));
});

test("selectQueueTask resumes the single in_progress task", () => {
  const entries = indexEntriesOf([
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T02", status: "in_progress" }),
    makeTask({ id: "P0-T03", status: "planned", depends_on: ["P0-T01"] }),
  ]);
  assert.deepEqual(selectQueueTask(entries), { kind: "resume", taskId: "P0-T02" });
});

test("selectQueueTask picks the next approved planned task whose dependencies are done", () => {
  const entries = indexEntriesOf([
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T02", status: "planned", depends_on: ["P0-T99"] }),
    makeTask({ id: "P0-T03", status: "planned", depends_on: ["P0-T01"] }),
  ]);
  assert.deepEqual(selectQueueTask(entries), { kind: "next", taskId: "P0-T03" });
});

test("selectQueueTask is idle when nothing is executable", () => {
  const entries = indexEntriesOf([
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T02", status: "planned", development_approval: null }),
  ]);
  assert.deepEqual(selectQueueTask(entries), { kind: "idle" });
});

test("isSafeToInvokeClaude is false whenever gate violations exist", () => {
  assert.equal(isSafeToInvokeClaude([]), true);
  assert.equal(isSafeToInvokeClaude([{ gate: "gate:index", message: "in_progress task가 2개입니다" }]), false);
});

test("readState returns the initial state when the checkpoint file does not exist", () => {
  const dir = mkdtempSync(join(tmpdir(), "lbb-loop-state-"));
  try {
    const state = readState(join(dir, "missing-loop-state.json"));
    assert.deepEqual(state, initialState());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readState fails closed to needs_user when the checkpoint file exists but is corrupted", () => {
  const dir = mkdtempSync(join(tmpdir(), "lbb-loop-state-"));
  try {
    const path = join(dir, "loop-state.json");
    writeFileSync(path, "{ not valid json ");
    const state = readState(path);
    assert.equal(state.status, "needs_user");
    assert.equal(state.session_id, null);
    assert.equal(state.last_error_kind, "unknown");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readState fails closed to needs_user when the checkpoint file holds a JSON array instead of an object", () => {
  const dir = mkdtempSync(join(tmpdir(), "lbb-loop-state-"));
  try {
    const path = join(dir, "loop-state.json");
    writeFileSync(path, "[]");
    const state = readState(path);
    assert.equal(state.status, "needs_user");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("deriveTaskId follows the in_progress task, or the sole executable task, or null when idle", () => {
  const resuming = indexEntriesOf([
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T02", status: "in_progress" }),
  ]);
  assert.equal(deriveTaskId(resuming), "P0-T02");

  const executable = indexEntriesOf([
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T03", status: "planned", depends_on: ["P0-T01"] }),
  ]);
  assert.equal(deriveTaskId(executable), "P0-T03");

  const idle = indexEntriesOf([makeTask({ id: "P0-T01", status: "done" })]);
  assert.equal(deriveTaskId(idle), null);
});
