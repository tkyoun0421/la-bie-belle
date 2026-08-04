import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRadioBindings, runRadioGate } from "../lib/radio-gate.ts";
import {
  createFixtureRoot,
  indexEntriesOf,
  joinMessages,
  makeTask,
  radioPathOf,
  writeIndexRecords,
  writeRadio,
} from "./fixture.ts";

function taskWithHash(
  sha256: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return makeTask({
    development_approval: { by: "user", at: "2026-08-03", radio_revision: 1, radio_sha256: sha256 },
    ...overrides,
  });
}

test("gate:radio — 해시가 일치하면 통과한다", () => {
  const root = createFixtureRoot();
  const sha256 = writeRadio(root, "P0-T01", ["harness/**"]);
  writeIndexRecords(root, [taskWithHash(sha256)]);

  assert.deepEqual(runRadioGate(root), []);
});

test("gate:radio — RADIO 파일이 없으면 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [taskWithHash("a".repeat(64))]);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "RADIO 파일 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /읽을 수 없습니다/);
  assert.equal(violations[0]?.file, radioPathOf("P0-T01"));
});

test("gate:radio — 해시가 다르면 차단한다", () => {
  const root = createFixtureRoot();
  writeRadio(root, "P0-T01", ["harness/**"]);
  writeIndexRecords(root, [taskWithHash("b".repeat(64))]);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "해시 불일치는 위반이어야 한다");
  assert.match(joinMessages(violations), /해시가 승인 기록과 다릅니다/);
});

test("gate:radio — 승인 해시가 없으면 차단한다", () => {
  const task = makeTask({ status: "in_progress" });
  delete task["development_approval"];

  const violations = checkRadioBindings(indexEntriesOf([task]), () => "c".repeat(64));

  assert.ok(violations.length > 0, "승인 해시 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /radio_sha256/);
});

test("gate:radio — planned·in_progress 외 상태는 검사하지 않는다", () => {
  const root = createFixtureRoot();
  writeRadio(root, "P0-T01", ["harness/**"]);
  writeIndexRecords(root, [taskWithHash("d".repeat(64), { status: "done" })]);

  assert.deepEqual(runRadioGate(root), []);
});

test("gate:radio — in_progress task의 해시도 검사한다", () => {
  const root = createFixtureRoot();
  writeRadio(root, "P0-T01", ["harness/**"]);
  writeIndexRecords(root, [taskWithHash("e".repeat(64), { status: "in_progress" })]);

  assert.ok(runRadioGate(root).length > 0, "in_progress 해시 불일치는 위반이어야 한다");
});
