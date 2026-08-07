import assert from "node:assert/strict";
import { test } from "node:test";
import { TDD_CLOCK_SKEW_TOLERANCE_MS, checkTddEvidence, runTddGate } from "../lib/tdd-gate.ts";
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

function fixtureWithEvidence(
  evidence: unknown | null,
  taskOverrides: Record<string, unknown> = {},
): string {
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
    entries: [
      { command: "pnpm test", exit_code: 0, at: "2026-08-03T10:00:00+09:00", phase: "green" },
    ],
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
    entries: [
      { command: "pnpm test", exit_code: 0, at: "2026-08-03T10:00:00+09:00", phase: "red" },
    ],
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
      entries: [
        { command: "pnpm test", exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "yellow" },
      ],
    }).length > 0,
    "알 수 없는 phase 위반",
  );
});

const FIXED_NOW = Date.parse("2026-08-07T12:00:00+09:00");

function isoAt(offsetMs: number): string {
  return new Date(FIXED_NOW + offsetMs).toISOString();
}

test("gate:tdd — 검사 시점 + 허용 오차보다 미래인 기록은 거부한다", () => {
  const errors = checkTddEvidence(
    {
      entries: [
        { command: "pnpm test", exit_code: 1, at: isoAt(-3_600_000), phase: "red" },
        {
          command: "pnpm test",
          exit_code: 0,
          at: isoAt(TDD_CLOCK_SKEW_TOLERANCE_MS + 10_000),
          phase: "green",
        },
      ],
    },
    FIXED_NOW,
  );

  assert.ok(errors.length > 0, "허용 오차를 넘는 미래 기록은 위반이어야 한다");
  assert.match(errors.join("\n"), /entries\[1\].*미래/);
});

test("gate:tdd — 여러 항목 중 미래 항목만 지목된다", () => {
  const errors = checkTddEvidence(
    {
      entries: [
        { command: "pnpm test", exit_code: 1, at: isoAt(-7_200_000), phase: "red" },
        { command: "pnpm test", exit_code: 0, at: isoAt(-3_600_000), phase: "green" },
        {
          command: "pnpm other",
          exit_code: 1,
          at: isoAt(TDD_CLOCK_SKEW_TOLERANCE_MS + 60_000),
          phase: "red",
        },
      ],
    },
    FIXED_NOW,
  );

  assert.equal(errors.length, 1, "미래 항목 하나만 위반으로 보고되어야 한다");
  assert.match(errors[0] ?? "", /entries\[2\]/);
});

test("gate:tdd — 허용 오차 경계 ±1초에서 판정이 갈린다", () => {
  const atBoundary = checkTddEvidence(
    {
      entries: [
        { command: "pnpm test", exit_code: 1, at: isoAt(-3_600_000), phase: "red" },
        { command: "pnpm test", exit_code: 0, at: isoAt(TDD_CLOCK_SKEW_TOLERANCE_MS), phase: "green" },
      ],
    },
    FIXED_NOW,
  );
  const withinToleranceByOneSecond = checkTddEvidence(
    {
      entries: [
        { command: "pnpm test", exit_code: 1, at: isoAt(-3_600_000), phase: "red" },
        {
          command: "pnpm test",
          exit_code: 0,
          at: isoAt(TDD_CLOCK_SKEW_TOLERANCE_MS - 1_000),
          phase: "green",
        },
      ],
    },
    FIXED_NOW,
  );
  const beyondToleranceByOneSecond = checkTddEvidence(
    {
      entries: [
        { command: "pnpm test", exit_code: 1, at: isoAt(-3_600_000), phase: "red" },
        {
          command: "pnpm test",
          exit_code: 0,
          at: isoAt(TDD_CLOCK_SKEW_TOLERANCE_MS + 1_000),
          phase: "green",
        },
      ],
    },
    FIXED_NOW,
  );

  assert.deepEqual(atBoundary, [], "허용 오차와 정확히 같은 미래 시각은 통과해야 한다");
  assert.deepEqual(withinToleranceByOneSecond, [], "허용 오차 1초 이내의 미래 시각은 통과해야 한다");
  assert.ok(
    beyondToleranceByOneSecond.length > 0,
    "허용 오차를 1초 넘는 미래 시각은 위반이어야 한다",
  );
});

test("gate:tdd — 고정 시각을 주입해도 기존 유효 증거는 회귀 없이 통과한다", () => {
  const farFutureNow = Date.parse("2030-01-01T00:00:00Z");

  assert.deepEqual(checkTddEvidence(makeTddEvidence(), farFutureNow), []);
});

test("gate:tdd — 실행부가 실제 시각을 주입해 미래 기록을 거부한다", () => {
  const root = fixtureWithEvidence({
    entries: [
      { command: "pnpm test", exit_code: 1, at: "2026-08-03T10:00:00+09:00", phase: "red" },
      { command: "pnpm test", exit_code: 0, at: "9999-01-01T00:00:00Z", phase: "green" },
    ],
  });

  const violations = runTddGate(root);

  assert.ok(violations.length > 0, "실제 시각 기준으로도 먼 미래 기록은 위반이어야 한다");
  assert.match(joinMessages(violations), /미래/);
});
