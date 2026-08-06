import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { isPlainObject } from "../lib/json-value.ts";
import { checkRadioBindings, runRadioGate } from "../lib/radio-gate.ts";
import { RADIO_LENS_SNAPSHOT_PATH, readTextFile, resolveRepoRoot } from "../lib/repo.ts";
import {
  isTask,
  parseIndexJsonl,
  readObjectField,
  recordId,
} from "../lib/task-index.ts";
import {
  createFixtureRoot,
  indexEntriesOf,
  joinMessages,
  makeRiskLensRow,
  makeRiskLensSection,
  makeTask,
  radioPathOf,
  writeFixtureFile,
  writeFixtureJson,
  writeIndexRecords,
  writeRadio,
  writeRadioWithRiskLens,
} from "./fixture.ts";

const LENS_TASK_ID = "P9-T01";

function lensTaskWithHash(
  sha256: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return makeTask({
    id: LENS_TASK_ID,
    radio_ref: radioPathOf(LENS_TASK_ID),
    development_approval: { by: "user", at: "2026-08-03", radio_revision: 1, radio_sha256: sha256 },
    ...overrides,
  });
}

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

test("gate:radio — 위험 렌즈 표가 없으면 차단한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  const sha256 = writeRadioWithRiskLens(root, LENS_TASK_ID, ["harness/**"], null);
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "렌즈 표 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /위험 렌즈 표가 없습니다/);
});

test("gate:radio — 위험 렌즈 표에 행이 없으면 차단한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  const sha256 = writeRadioWithRiskLens(
    root,
    LENS_TASK_ID,
    ["harness/**"],
    makeRiskLensSection([]),
  );
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "행 0개는 위반이어야 한다");
  assert.match(joinMessages(violations), /위험 렌즈 표가 없습니다/);
});

test("gate:radio — 렌즈 칸이 비어 있으면 차단한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  const lensSection = makeRiskLensSection([makeRiskLensRow({ "주요 실패": "" })]);
  const sha256 = writeRadioWithRiskLens(root, LENS_TASK_ID, ["harness/**"], lensSection);
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "빈 칸은 위반이어야 한다");
  assert.match(joinMessages(violations), /주요 실패 칸이 비어 있거나 사유가 없습니다/);
});

test("gate:radio — 해당 없음에 사유가 없으면 차단한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  const lensSection = makeRiskLensSection([makeRiskLensRow({ 동시성: "해당 없음" })]);
  const sha256 = writeRadioWithRiskLens(root, LENS_TASK_ID, ["harness/**"], lensSection);
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "사유 없는 해당 없음은 위반이어야 한다");
  assert.match(joinMessages(violations), /동시성 칸이 비어 있거나 사유가 없습니다/);
});

test("gate:radio — 정상 위험 렌즈 표는 통과한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  const lensSection = makeRiskLensSection([
    makeRiskLensRow({ 동시성: "해당 없음 — 단일 사용자 작업이라 경합이 없다" }),
  ]);
  const sha256 = writeRadioWithRiskLens(root, LENS_TASK_ID, ["harness/**"], lensSection);
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  assert.deepEqual(runRadioGate(root), []);
});

test("gate:radio — 문서 전용 task는 렌즈 표 없이 통과한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  const sha256 = writeRadioWithRiskLens(root, LENS_TASK_ID, ["docs/**", ".claude/**"], null);
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  assert.deepEqual(runRadioGate(root), []);
});

test("gate:radio — 면제 스냅숏에 있는 task는 렌즈 표 없이 통과한다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [LENS_TASK_ID] });
  const sha256 = writeRadioWithRiskLens(root, LENS_TASK_ID, ["harness/**"], null);
  writeIndexRecords(root, [lensTaskWithHash(sha256)]);

  assert.deepEqual(runRadioGate(root), []);
});

test("gate:radio — 해시 위반과 렌즈 위반이 서로를 가리지 않고 함께 보고된다", () => {
  const root = createFixtureRoot();
  writeFixtureJson(root, RADIO_LENS_SNAPSHOT_PATH, { exemptTasks: [] });
  writeRadioWithRiskLens(root, LENS_TASK_ID, ["harness/**"], null);
  writeIndexRecords(root, [lensTaskWithHash("f".repeat(64))]);

  const violations = runRadioGate(root);
  const messages = joinMessages(violations);

  assert.match(messages, /해시가 승인 기록과 다릅니다/);
  assert.match(messages, /위험 렌즈 표가 없습니다/);
});

test("gate:radio — 면제 스냅숏이 유효한 JSON이 아니면 게이트 실패로 보고한다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(root, RADIO_LENS_SNAPSHOT_PATH, "{ 이건 JSON이 아니다");
  writeIndexRecords(root, []);

  const violations = runRadioGate(root);

  assert.ok(violations.length > 0, "스냅숏 JSON 오류는 위반이어야 한다");
  assert.match(joinMessages(violations), /JSON/);
});

test("gate:radio — 면제 스냅숏이 index의 development_approval 보유 task와 정확히 일치한다(구현 시점 전수 대조)", () => {
  const root = resolveRepoRoot();
  const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
  const frozenIndexText = readFileSync(
    join(fixturesDirectory, "index-snapshot-p0-t36.jsonl"),
    "utf8",
  );
  const frozenEntries = parseIndexJsonl(frozenIndexText).entries;

  const expectedExemptTasks = frozenEntries
    .filter(
      (entry) => isTask(entry.record) && readObjectField(entry.record, "development_approval") !== null,
    )
    .map((entry) => recordId(entry.record))
    .sort();

  const snapshotText = readTextFile(root, RADIO_LENS_SNAPSHOT_PATH);
  assert.ok(snapshotText !== null, `${RADIO_LENS_SNAPSHOT_PATH}이 있어야 한다`);
  const decoded: unknown = JSON.parse(snapshotText as string);
  assert.ok(isPlainObject(decoded), `${RADIO_LENS_SNAPSHOT_PATH}은 객체여야 한다`);
  const exemptTasks = decoded["exemptTasks"];
  assert.ok(Array.isArray(exemptTasks), "exemptTasks는 배열이어야 한다");

  assert.deepEqual(exemptTasks, expectedExemptTasks);
  assert.deepEqual(exemptTasks, [...new Set(exemptTasks)].sort());
});
