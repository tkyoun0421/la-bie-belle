import assert from "node:assert/strict";
import { test } from "node:test";
import { runPath } from "../lib/repo.ts";
import {
  createLoopFixtureRoot,
  makeHandoffMarkdown,
  makeTask,
  readLoopState,
  runLoopCommand,
  writeFixtureFile,
  writeIndexRecords,
  writeIndexText,
  writeRadio,
} from "./fixture.ts";

function withHandoff(root: string, taskId: string): void {
  writeFixtureFile(root, runPath(taskId, "handoff.md"), makeHandoffMarkdown(taskId));
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
  withHandoff(root, "P0-T01");

  const result = runLoopCommand(root, ["start"]);

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

  const result = runLoopCommand(root, ["start"]);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /in_progress/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
  assert.equal(result.status, 2);
});

test("claude-loop start — 승인 계약이 깨진 in_progress task는 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  const task = makeTask({ id: "P0-T01", status: "in_progress" });
  delete task["development_approval"];
  writeIndexRecords(root, [task]);

  const result = runLoopCommand(root, ["start"]);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /development_approval/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
  assert.equal(result.status, 2);
});

test("claude-loop start — RADIO 해시가 승인 기록과 다르면 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  writeRadio(root, "P0-T01", ["scripts/**"]);
  const task = makeTask({ id: "P0-T01", status: "in_progress" });
  writeIndexRecords(root, [task]);

  const result = runLoopCommand(root, ["start"]);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /해시/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
  assert.equal(result.status, 2);
});

test("claude-loop start — --watch는 저장소 재검사를 거치지 않는다", () => {
  const root = createLoopFixtureRoot();
  const first = makeTask({ id: "P0-T01", status: "in_progress" });
  const second = makeTask({ id: "P0-T02", status: "in_progress" });
  writeIndexRecords(root, [first, second]);

  const result = runLoopCommand(root, ["start", "--watch"], { timeout: 5_000 });

  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /repository reverification blocked/);
});

test("claude-loop start — 재검사 거부 후 supervisor lock은 정리되지만 재시도는 안내만 남기고 재검사를 되풀이하지 않는다", () => {
  const root = createLoopFixtureRoot();
  const first = makeTask({ id: "P0-T01", status: "in_progress" });
  const second = makeTask({ id: "P0-T02", status: "in_progress" });
  writeIndexRecords(root, [first, second]);

  const blocked = runLoopCommand(root, ["start"]);
  assert.match(blocked.stderr, /repository reverification blocked/);

  const retry = runLoopCommand(root, ["start"]);

  assert.doesNotMatch(retry.stderr, /supervisor already running/);
  assert.doesNotMatch(`${retry.stdout}${retry.stderr}`, /repository reverification blocked/);
  assert.equal(retry.status, 2);
  assert.match(`${retry.stdout}${retry.stderr}`, /needs_user/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
});

test("claude-loop start — handoff 문서가 없으면 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  const hash = writeRadio(root, "P0-T01", ["scripts/**"]);
  const task = makeTask({
    id: "P0-T01",
    status: "in_progress",
    development_approval: { by: "user", at: "2026-08-03", radio_revision: 1, radio_sha256: hash },
  });
  writeIndexRecords(root, [task]);

  const result = runLoopCommand(root, ["start"]);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /handoff/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
  assert.equal(result.status, 2);
});

test("claude-loop start — index.jsonl에 JSON 파싱 오류가 있으면 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  writeIndexText(root, '{"kind":"task","id":"P0-T01"\n');

  const result = runLoopCommand(root, ["start"]);

  assert.match(result.stderr, /repository reverification blocked/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
  assert.equal(result.status, 2);
});

test("claude-loop start — 스키마를 위반한 malformed development_approval은 재검사가 새 세션을 막는다", () => {
  const root = createLoopFixtureRoot();
  const hash = writeRadio(root, "P0-T01", ["scripts/**"]);
  const task = makeTask({
    id: "P0-T01",
    status: "in_progress",
    development_approval: { radio_sha256: hash },
  });
  writeIndexRecords(root, [task]);
  withHandoff(root, "P0-T01");

  const result = runLoopCommand(root, ["start"]);

  assert.match(result.stderr, /repository reverification blocked/);
  assert.match(result.stderr, /필수 필드/);
  const state = readLoopState(root);
  assert.equal(state["status"], "needs_user");
  assert.equal(state["last_error_kind"], "invalid_request");
  assert.equal(result.status, 2);
});
