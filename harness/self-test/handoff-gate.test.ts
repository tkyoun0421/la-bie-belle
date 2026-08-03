import assert from "node:assert/strict";
import { test } from "node:test";
import { checkHandoffDocument, runHandoffGate } from "../lib/handoff-gate.ts";
import {
  createFixtureRoot,
  joinMessages,
  makeHandoffMarkdown,
  makeTask,
  writeFixtureFile,
  writeIndexRecords,
} from "./fixture.ts";

function fixtureWithHandoff(markdown: string | null): string {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ status: "in_progress" })]);
  if (markdown !== null) {
    writeFixtureFile(root, "docs/execution/runs/P0-T01/handoff.md", markdown);
  }
  return root;
}

test("gate:handoff — 필수 필드가 모두 있으면 통과한다", () => {
  const root = fixtureWithHandoff(makeHandoffMarkdown("P0-T01"));

  assert.deepEqual(runHandoffGate(root), []);
});

test("gate:handoff — handoff 파일이 없으면 차단한다", () => {
  const root = fixtureWithHandoff(null);

  const violations = runHandoffGate(root);

  assert.ok(violations.length > 0, "handoff 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /handoff 파일이 없습니다/);
});

test("gate:handoff — 미결 사항 절이 없으면 차단한다", () => {
  const markdown = makeHandoffMarkdown("P0-T01").replace("### 미결 사항", "### 남은 이야기");
  const root = fixtureWithHandoff(markdown);

  const violations = runHandoffGate(root);

  assert.ok(violations.length > 0, "필수 절 누락은 위반이어야 한다");
  assert.match(joinMessages(violations), /미결 사항/);
});

test("gate:handoff — 라벨 필드 값이 비면 차단한다", () => {
  const markdown = makeHandoffMarkdown("P0-T01").replace("- 기준 시각: 2026-08-03", "- 기준 시각:");

  const missing = checkHandoffDocument(markdown);

  assert.ok(missing.length > 0, "빈 라벨 값은 위반이어야 한다");
  assert.match(missing.join("\n"), /기준 시각/);
});

test("gate:handoff — 절 내용이 비면 차단한다", () => {
  const markdown = makeHandoffMarkdown("P0-T01").replace("- 게이트 구현을 마쳤다.", "");

  const missing = checkHandoffDocument(markdown);

  assert.ok(missing.length > 0, "빈 절은 위반이어야 한다");
  assert.match(missing.join("\n"), /확정된 사실/);
});

test("gate:handoff — 7개 필드를 모두 갖춘 문서는 누락이 없다", () => {
  assert.deepEqual(checkHandoffDocument(makeHandoffMarkdown("P0-T31")), []);
});

test("gate:handoff — 인자로 받은 task를 대상으로 삼는다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask()]);
  writeFixtureFile(root, "docs/execution/runs/P0-T02/handoff.md", makeHandoffMarkdown("P0-T02"));

  assert.deepEqual(runHandoffGate(root, "P0-T02"), []);
  assert.ok(runHandoffGate(root, "P0-T09").length > 0, "없는 task의 handoff는 위반이어야 한다");
});

test("gate:handoff — 대상 task를 찾으려는데 index를 읽을 수 없으면 차단한다", () => {
  const root = createFixtureRoot();

  const violations = runHandoffGate(root);

  assert.ok(violations.length > 0, "index 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /읽을 수 없습니다/);
});

test("gate:handoff — in_progress task가 없고 인자도 없으면 통과한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask()]);

  assert.deepEqual(runHandoffGate(root), []);
});
