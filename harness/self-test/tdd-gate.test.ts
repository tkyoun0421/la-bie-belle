import assert from "node:assert/strict";
import { test } from "node:test";
import { checkTddEvidence, runTddGate } from "../lib/tdd-gate.ts";
import {
  createFixtureRoot,
  joinMessages,
  makeTask,
  makeTddEvidence,
  writeFixtureFile,
  writeFixtureJson,
  writeIndexRecords,
} from "./fixture.ts";

const EVIDENCE_PATH = "docs/execution/runs/P0-T01/tdd.json";

function fixtureWithEvidence(evidence: unknown | null, taskOverrides: Record<string, unknown> = {}): string {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ status: "in_progress", ...taskOverrides })]);
  if (evidence !== null) {
    writeFixtureJson(root, EVIDENCE_PATH, evidence);
  }
  return root;
}

test("gate:tdd — RED 다음 GREEN 기록은 통과한다", () => {
  const root = fixtureWithEvidence(makeTddEvidence());

  assert.deepEqual(runTddGate(root), []);
});

test("gate:tdd — tdd.json이 없으면 차단한다", () => {
  const root = fixtureWithEvidence(null);

  const violations = runTddGate(root);

  assert.ok(violations.length > 0, "증거 파일 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /tdd.json/);
  assert.equal(violations[0]?.file, EVIDENCE_PATH);
});

test("gate:tdd — JSON이 깨졌으면 차단한다", () => {
  const root = fixtureWithEvidence(makeTddEvidence());
  writeFixtureFile(root, EVIDENCE_PATH, "{ entries: ");

  const violations = runTddGate(root);

  assert.ok(violations.length > 0, "깨진 JSON은 위반이어야 한다");
  assert.match(joinMessages(violations), /JSON/);
});

test("gate:tdd — test_mode가 tdd가 아니면 검사하지 않는다", () => {
  const root = fixtureWithEvidence(null, { test_mode: "verification" });

  assert.deepEqual(runTddGate(root), []);
});

test("gate:tdd — in_progress task가 없으면 통과한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask()]);

  assert.deepEqual(runTddGate(root), []);
});

test("gate:tdd — 기록이 비면 차단한다", () => {
  assert.ok(checkTddEvidence({ entries: [] }).length > 0, "빈 기록은 위반이어야 한다");
  assert.ok(checkTddEvidence({}).length > 0, "entries 없음은 위반이어야 한다");
});

test("gate:tdd — GREEN만 있으면 차단한다", () => {
  const errors = checkTddEvidence({
    entries: [{ command: "pnpm test", exit_code: 0, at: "2026-08-03T10:00:00+09:00", phase: "green" }],
  });

  assert.ok(errors.length > 0, "RED 없는 GREEN은 위반이어야 한다");
  assert.match(errors.join("\n"), /RED/);
});

test("gate:tdd — GREEN이 RED보다 앞서면 차단한다", () => {
  const errors = checkTddEvidence({
    entries: [
      { command: "pnpm test", exit_code: 0, at: "2026-08-03T10:00:00+09:00", phase: "green" },
      { command: "pnpm test", exit_code: 1, at: "2026-08-03T11:00:00+09:00", phase: "red" },
    ],
  });

  assert.ok(errors.length > 0, "순서가 뒤바뀌면 위반이어야 한다");
});

test("gate:tdd — 다른 command의 RED는 인정하지 않는다", () => {
  const errors = checkTddEvidence({
    entries: [
      { command: "pnpm other", exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "red" },
      { command: "pnpm test", exit_code: 0, at: "2026-08-03T11:00:00+09:00", phase: "green" },
    ],
  });

  assert.ok(errors.length > 0, "다른 명령의 RED는 증거가 아니다");
  assert.match(errors.join("\n"), /pnpm test/);
});

test("gate:tdd — phase와 exit_code가 어긋나면 차단한다", () => {
  const red = checkTddEvidence({
    entries: [{ command: "pnpm test", exit_code: 0, at: "2026-08-03T10:00:00+09:00", phase: "red" }],
  });
  const green = checkTddEvidence({
    entries: [
      { command: "pnpm test", exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "red" },
      { command: "pnpm test", exit_code: 1, at: "2026-08-03T11:00:00+09:00", phase: "green" },
    ],
  });

  assert.ok(red.length > 0, "red는 종료 코드가 0이 아니어야 한다");
  assert.ok(green.length > 0, "green은 종료 코드가 0이어야 한다");
});

test("gate:tdd — 기록 형식이 잘못되면 차단한다", () => {
  assert.ok(
    checkTddEvidence({
      entries: [{ command: "pnpm test", exit_code: 1, at: "어제", phase: "red" }],
    }).length > 0,
    "시각 형식 위반",
  );
  assert.ok(
    checkTddEvidence({
      entries: [{ command: "", exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "red" }],
    }).length > 0,
    "빈 command 위반",
  );
  assert.ok(
    checkTddEvidence({
      entries: [{ command: "pnpm test", exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "yellow" }],
    }).length > 0,
    "알 수 없는 phase 위반",
  );
});
