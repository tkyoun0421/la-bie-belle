import assert from "node:assert/strict";
import { test } from "node:test";
import { checkIndexStateRules, runIndexGate } from "../lib/index-gate.ts";
import { validateAgainstSchema } from "../lib/json-schema.ts";
import {
  createFixtureRoot,
  indexEntriesOf,
  joinMessages,
  makePhase,
  makeTask,
  writeIndexRecords,
  writeIndexText,
} from "./fixture.ts";

test("gate:index — 정상 index는 위반 없이 통과한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makePhase(), makeTask(), makeTask({ id: "P0-T02", depends_on: ["P0-T01"] })]);

  assert.deepEqual(runIndexGate(root), []);
});

test("gate:index — index.jsonl이 없으면 차단한다", () => {
  const root = createFixtureRoot();

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "파일이 없으면 위반이어야 한다");
  assert.match(joinMessages(violations), /읽을 수 없습니다/);
});

test("gate:index — JSON이 아닌 줄을 차단하고 줄 번호를 알린다", () => {
  const root = createFixtureRoot();
  writeIndexText(root, `${JSON.stringify(makePhase())}\nnot json\n`);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "잘못된 JSON 줄은 위반이어야 한다");
  assert.equal(violations[0]?.line, 2);
  assert.match(joinMessages(violations), /JSON 파싱 실패/);
});

test("gate:index — 스키마에 없는 status 값을 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ status: "shipped" })]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "허용되지 않은 status는 위반이어야 한다");
  assert.match(joinMessages(violations), /status/);
});

test("gate:index — 스키마에 없는 필드를 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ owner: "누군가" })]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "정의되지 않은 필드는 위반이어야 한다");
  assert.match(joinMessages(violations), /owner/);
});

test("gate:index — 필수 필드 누락을 차단한다", () => {
  const root = createFixtureRoot();
  const task = makeTask();
  delete task["summary"];
  writeIndexRecords(root, [task]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "필수 필드 누락은 위반이어야 한다");
  assert.match(joinMessages(violations), /summary/);
});

test("gate:index — id 패턴 위반을 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ id: "T1" })]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "id 패턴 위반은 위반이어야 한다");
  assert.match(joinMessages(violations), /id/);
});

test("gate:index — in_progress task가 둘이면 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [
    makeTask({ id: "P0-T01", status: "in_progress" }),
    makeTask({ id: "P0-T02", status: "in_progress" }),
  ]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "동시 in_progress는 위반이어야 한다");
  assert.match(joinMessages(violations), /in_progress/);
});

test("gate:index — 개발 승인 없는 planned task를 차단한다", () => {
  const task = makeTask();
  delete task["development_approval"];

  const violations = checkIndexStateRules(indexEntriesOf([task]));

  assert.ok(violations.length > 0, "승인 없는 planned는 위반이어야 한다");
  assert.match(joinMessages(violations), /development_approval/);
});

test("gate:index — 제품 승인과 radio_ref 없는 in_progress task를 차단한다", () => {
  const task = makeTask({ status: "in_progress" });
  delete task["product_approval"];
  delete task["radio_ref"];

  const violations = checkIndexStateRules(indexEntriesOf([task]));

  assert.match(joinMessages(violations), /product_approval/);
  assert.match(joinMessages(violations), /radio_ref/);
});

test("gate:index — 존재하지 않는 depends_on을 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ depends_on: ["P9-T99"] })]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "없는 의존성은 위반이어야 한다");
  assert.match(joinMessages(violations), /P9-T99/);
});

test("gate:index — spec_refs가 비면 차단한다", () => {
  const root = createFixtureRoot();
  writeIndexRecords(root, [makeTask({ spec_refs: [] })]);

  const violations = runIndexGate(root);

  assert.ok(violations.length > 0, "빈 spec_refs는 위반이어야 한다");
  assert.match(joinMessages(violations), /spec_refs/);
});

test("gate:index — 정상 레코드에는 상태 규칙 위반이 없다", () => {
  const violations = checkIndexStateRules(indexEntriesOf([makePhase(), makeTask()]));

  assert.deepEqual(violations, []);
});

test("스키마 검증기 — const·enum·pattern·minItems·uniqueItems를 검사한다", () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "id", "tags"],
    properties: {
      kind: { const: "task" },
      id: { type: "string", pattern: "^P[0-9]+$" },
      status: { enum: ["planned", "done"] },
      tags: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
      count: { type: "integer", minimum: 1 },
    },
  };

  assert.deepEqual(validateAgainstSchema(schema, { kind: "task", id: "P0", tags: ["a"], count: 1 }), []);
  assert.ok(validateAgainstSchema(schema, { kind: "phase", id: "P0", tags: ["a"] }).length > 0, "const 위반");
  assert.ok(validateAgainstSchema(schema, { kind: "task", id: "X", tags: ["a"] }).length > 0, "pattern 위반");
  assert.ok(
    validateAgainstSchema(schema, { kind: "task", id: "P0", tags: ["a"], status: "wip" }).length > 0,
    "enum 위반",
  );
  assert.ok(validateAgainstSchema(schema, { kind: "task", id: "P0", tags: [] }).length > 0, "minItems 위반");
  assert.ok(
    validateAgainstSchema(schema, { kind: "task", id: "P0", tags: ["a", "a"] }).length > 0,
    "uniqueItems 위반",
  );
  assert.ok(
    validateAgainstSchema(schema, { kind: "task", id: "P0", tags: ["a"], count: 0 }).length > 0,
    "minimum 위반",
  );
  assert.ok(validateAgainstSchema(schema, { kind: "task", id: "P0", tags: ["a"], x: 1 }).length > 0, "추가 필드");
});

test("스키마 검증기 — if·then·not·$ref·format을 검사한다", () => {
  const schema = {
    type: "object",
    properties: {
      kind: { const: "task" },
      approval: { $ref: "#/$defs/approval" },
      at: { type: "string", format: "date" },
    },
    $defs: {
      approval: {
        type: "object",
        required: ["by"],
        properties: { by: { const: "user" } },
      },
    },
    allOf: [
      {
        if: { properties: { kind: { const: "task" } }, required: ["kind"] },
        then: { required: ["approval"] },
      },
      { if: { required: ["at"] }, then: { not: { required: ["kind"] } } },
    ],
  };

  assert.deepEqual(validateAgainstSchema(schema, { kind: "task", approval: { by: "user" } }), []);
  assert.ok(validateAgainstSchema(schema, { kind: "task" }).length > 0, "then의 required 위반");
  assert.ok(
    validateAgainstSchema(schema, { kind: "task", approval: { by: "admin" } }).length > 0,
    "$ref const 위반",
  );
  assert.ok(
    validateAgainstSchema(schema, { kind: "task", approval: { by: "user" }, at: "2026-08-03" }).length > 0,
    "not 위반",
  );
  assert.ok(validateAgainstSchema({ type: "string", format: "date" }, "2026-8-3").length > 0, "date 형식 위반");
});

test("스키마 검증기 — 지원하지 않는 keyword를 조용히 통과시키지 않는다", () => {
  const errors = validateAgainstSchema({ type: "string", maxLength: 3 }, "abcd");

  assert.ok(errors.length > 0, "미지원 keyword는 알려야 한다");
  assert.match(errors.join("\n"), /maxLength/);
});
