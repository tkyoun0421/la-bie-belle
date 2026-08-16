import assert from "node:assert/strict";
import { test } from "node:test";
import { REPOSITORY_GATES, runAllGates } from "../lib/gate-suite.ts";
import { createFixtureRoot, joinMessages, makeTask, writeFixtureFile, writeIndexRecords } from "./fixture.ts";

test("gate-suite — 신설 게이트 2종이 저장소 게이트 묶음에 등록돼 있다", () => {
  const ids = REPOSITORY_GATES.map((gate) => gate.id);

  assert.ok(ids.includes("gate:retro"), "gate:retro가 묶음에 있어야 한다");
  assert.ok(ids.includes("gate:docs"), "gate:docs가 묶음에 있어야 한다");
});

test("gate-suite — 문서 링크 위반이 gate:all 실행 결과로 전파된다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask()]);
  writeFixtureFile(root, "docs/example.md", "[깨진 링크](./missing-file.md)\n");

  const violations = runAllGates(root);

  assert.match(joinMessages(violations), /missing-file\.md/);
});

test("gate-suite — 회고 누락이 gate:all 실행 결과로 전파된다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ id: "P0-T20", status: "done" })]);
  writeFixtureFile(
    root,
    "docs/execution/retrospective/exempt.json",
    '{"generated_at":"2026-08-16T00:00:00Z","task_ids":[]}\n',
  );
  writeFixtureFile(root, "docs/execution/retrospective/cases.md", "");

  const violations = runAllGates(root);

  assert.match(joinMessages(violations), /P0-T20/);
});
