import assert from "node:assert/strict";
import { test } from "node:test";
import { RENDER_BUDGET_MS, evaluateRenderBudget } from "../lib/motion-render-budget.ts";
import { joinMessages } from "./fixture.ts";

test("gate:motion-render-budget — 상한 이내면 통과한다", () => {
  const measurement = { fullMotionMs: 30, reducedMotionMs: 20 };

  assert.deepEqual(evaluateRenderBudget(measurement, 16), []);
});

test("gate:motion-render-budget — 상한과 같으면 통과한다", () => {
  const measurement = { fullMotionMs: 36, reducedMotionMs: 20 };

  assert.deepEqual(evaluateRenderBudget(measurement, 16), []);
});

test("gate:motion-render-budget — 상한을 넘으면 차단한다", () => {
  const measurement = { fullMotionMs: 40, reducedMotionMs: 20 };

  const violations = evaluateRenderBudget(measurement, 16);

  assert.equal(violations.length, 1);
  assert.equal(violations[0]?.gate, "gate:motion-render-budget");
  assert.match(joinMessages(violations), /20\.0ms/);
  assert.match(joinMessages(violations), /16ms/);
});

test("gate:motion-render-budget — reduced-motion이 더 느려도 절댓값으로 판정한다", () => {
  const measurement = { fullMotionMs: 20, reducedMotionMs: 40 };

  const violations = evaluateRenderBudget(measurement, 16);

  assert.equal(violations.length, 1);
});

test("gate:motion-render-budget — 기본 상한은 16ms다", () => {
  assert.equal(RENDER_BUDGET_MS, 16);
});
