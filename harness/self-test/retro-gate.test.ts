import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkRetrospectiveCoverage,
  hasCaseEntry,
  parseExemptSnapshot,
  runRetroGate,
} from "../lib/retro-gate.ts";
import {
  createFixtureRoot,
  joinMessages,
  makeTask,
  writeFixtureFile,
  writeFixtureJson,
  writeIndexRecords,
} from "./fixture.ts";

const EXEMPT_PATH = "docs/execution/retrospective/exempt.json";
const CASES_PATH = "docs/execution/retrospective/cases.md";

function fixtureWith(options: {
  tasks: readonly Record<string, unknown>[];
  exempt?: unknown;
  cases?: string;
}): string {
  const root = createFixtureRoot();
  writeIndexRecords(root, options.tasks);
  if (options.exempt !== undefined) {
    writeFixtureJson(root, EXEMPT_PATH, options.exempt);
  }
  if (options.cases !== undefined) {
    writeFixtureFile(root, CASES_PATH, options.cases);
  }
  return root;
}

test("gate:retro — 면제 밖 done task의 회고 항목이 있으면 통과한다", () => {
  const root = fixtureWith({
    tasks: [makeTask({ id: "P0-T20", status: "done" })],
    exempt: { generated_at: "2026-08-16T00:00:00Z", task_ids: [] },
    cases: "- P0-T20 | 성공 | 게이트를 먼저 세워 되돌림이 없었다 | docs/execution/runs/P0-T20/\n",
  });

  assert.deepEqual(runRetroGate(root), []);
});

test("gate:retro — 회고 항목이 없는 done task를 위반 1건으로 차단한다", () => {
  const root = fixtureWith({
    tasks: [makeTask({ id: "P0-T20", status: "done" })],
    exempt: { generated_at: "2026-08-16T00:00:00Z", task_ids: [] },
    cases: "",
  });

  const violations = runRetroGate(root);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /P0-T20/);
});

test("gate:retro — 면제 스냅숏에 있는 done task는 항목이 없어도 통과한다", () => {
  const root = fixtureWith({
    tasks: [makeTask({ id: "P0-T20", status: "done" })],
    exempt: { generated_at: "2026-08-16T00:00:00Z", task_ids: ["P0-T20"] },
    cases: "",
  });

  assert.deepEqual(runRetroGate(root), []);
});

test("gate:retro — done이 아닌 상태는 검사 대상이 아니다", () => {
  const root = fixtureWith({
    tasks: [
      makeTask({ id: "P0-T21", status: "in_progress" }),
      makeTask({ id: "P0-T22", status: "planned" }),
      makeTask({ id: "P0-T23", status: "proposed" }),
    ],
    exempt: { generated_at: "2026-08-16T00:00:00Z", task_ids: [] },
    cases: "",
  });

  assert.deepEqual(runRetroGate(root), []);
});

test("gate:retro — 면제 스냅숏이 없으면 차단한다", () => {
  const root = fixtureWith({
    tasks: [makeTask({ id: "P0-T20", status: "done" })],
    cases: "",
  });

  const violations = runRetroGate(root);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /면제 스냅숏 파일이 없습니다/);
});

test("gate:retro — 면제 스냅숏 형식이 어긋나면 차단한다", () => {
  const root = fixtureWith({
    tasks: [makeTask({ id: "P0-T20", status: "done" })],
    exempt: { generated_at: "2026-08-16T00:00:00Z", task_ids: "P0-T20" },
    cases: "",
  });

  const violations = runRetroGate(root);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /task_ids는 문자열 배열/);
});

test("gate:retro — generated_at이 비면 스냅숏을 거부한다", () => {
  const snapshot = parseExemptSnapshot(JSON.stringify({ generated_at: "", task_ids: [] }));

  assert.equal(snapshot.ok, false);
});

test("gate:retro — 깨진 JSON 스냅숏을 거부한다", () => {
  const snapshot = parseExemptSnapshot("{");

  assert.equal(snapshot.ok, false);
});

test("gate:retro — task ID가 다른 ID의 앞부분과 겹쳐도 오탐하지 않는다", () => {
  assert.equal(hasCaseEntry("- P0-T460 | 성공 | 요약 | 경로\n", "P0-T46"), false);
  assert.equal(hasCaseEntry("- P0-T46 | 성공 | 요약 | 경로\n", "P0-T46"), true);
});

test("gate:retro — 여러 done task 중 빠진 것만 위반으로 센다", () => {
  const missing = checkRetrospectiveCoverage(
    ["P0-T20", "P0-T21", "P0-T22"],
    new Set(["P0-T21"]),
    "- P0-T20 | 성공 | 요약 | 경로\n",
  );

  assert.equal(missing.length, 1);
  assert.match(missing.join("\n"), /P0-T22/);
});

test("gate:retro — cases.md가 없으면 면제 밖 done을 전부 차단한다", () => {
  const root = fixtureWith({
    tasks: [makeTask({ id: "P0-T20", status: "done" })],
    exempt: { generated_at: "2026-08-16T00:00:00Z", task_ids: [] },
  });

  assert.equal(runRetroGate(root).length, 1);
});

test("gate:retro — index를 읽을 수 없으면 차단한다", () => {
  const root = createFixtureRoot();

  const violations = runRetroGate(root);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /읽을 수 없습니다/);
});
