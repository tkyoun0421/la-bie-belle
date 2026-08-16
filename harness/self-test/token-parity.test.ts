import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runTokenParityGate } from "../lib/token-parity.ts";
import { createFixtureRoot, joinMessages, writeFixtureFile } from "./fixture.ts";

const FOUNDATIONS_PATH = "docs/product/design/FOUNDATIONS.md";
const GLOBALS_PATH = "src/app/globals.css";
const FIXTURES_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "token-parity");

function loadCase(root: string, caseName: string): void {
  const caseDirectory = join(FIXTURES_DIRECTORY, caseName);
  writeFixtureFile(root, FOUNDATIONS_PATH, readFileSync(join(caseDirectory, "FOUNDATIONS.md"), "utf8"));
  writeFixtureFile(root, GLOBALS_PATH, readFileSync(join(caseDirectory, "globals.css"), "utf8"));
}

test("gate:tokens(6,8) — 다섯 표와 하단 고정 여백 토큰이 모두 일치하면 위반 0건이다", () => {
  const root = createFixtureRoot();
  loadCase(root, "match");

  const violations = runTokenParityGate(root);

  assert.deepEqual(violations, []);
});

test("gate:tokens(6) — runTokenParityGate(root)가 Violation 배열을 반환한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "match");

  const violations = runTokenParityGate(root);

  assert.ok(Array.isArray(violations));
});

test("gate:tokens(6) — 원시 팔레트 값이 다르면 문서·코드 위치와 기대값·실제값을 담아 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.ok(violations.length > 0);
  assert.match(messages, /gray-400/u);
  assert.match(messages, /#a8acb3/u);
  assert.match(messages, /#123456/u);
  assert.match(messages, /FOUNDATIONS\.md:\d+/u);
  assert.match(messages, /globals\.css:\d+/u);
});

test("gate:tokens(6) — 의미 토큰 action 행의 배경이 --color-action-surface와 다르면 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.match(messages, /action/u);
  assert.match(messages, /#eef4ff/u);
  assert.match(messages, /#ffffff/u);
});

test("gate:tokens(6) — 타이포 utility 블록의 font-size가 문서 크기/행간과 다르면 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.match(messages, /body/u);
  assert.match(messages, /16px/u);
  assert.match(messages, /15px/u);
});

test("gate:tokens(9) — 간격 표 space-4가 --spacing-4와 다르면 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.match(messages, /space-4|--spacing-4/u);
  assert.match(messages, /16px/u);
  assert.match(messages, /18px/u);
});

test("gate:tokens(9) — 하단 고정 요소 여백 토큰 --spacing-nav-safe 값이 다르면 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.match(messages, /--spacing-nav-safe/u);
  assert.match(messages, /96px/u);
  assert.match(messages, /90px/u);
});

test("gate:tokens(6) — 형태와 깊이 표 radius-sm 값이 다르면 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.match(messages, /radius-sm/u);
  assert.match(messages, /8px/u);
  assert.match(messages, /6px/u);
});

test("gate:tokens(6) — var(--raw-*) 참조가 풀리지 않으면 위반으로 보고한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "unresolved-reference");

  const violations = runTokenParityGate(root);
  const messages = joinMessages(violations);

  assert.ok(violations.length > 0, "풀리지 않는 raw 참조는 위반이어야 한다");
  assert.match(messages, /--raw-blue-999/u);
});

test("gate:tokens(6) — 간격과 레이아웃 표를 지운 fixture는 조용히 통과하지 않고 위반한다", () => {
  const root = createFixtureRoot();
  loadCase(root, "missing-table");

  const violations = runTokenParityGate(root);

  assert.ok(
    violations.length > 0,
    "표가 없어 대조할 문서 행이 없다고 위반 0건으로 조용히 통과해서는 안 된다",
  );
  assert.ok(violations.every((violation) => violation.gate === "gate:tokens"));
});

test("gate:tokens(6~8) — 반복 실행이 같은 결과를 낸다", () => {
  const root = createFixtureRoot();
  loadCase(root, "mismatch");

  const first = runTokenParityGate(root);
  const second = runTokenParityGate(root);

  assert.deepEqual(first, second);
});
