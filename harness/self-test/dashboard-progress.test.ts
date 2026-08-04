import assert from "node:assert/strict";
import { test } from "node:test";
import { recommendNextAction } from "../dashboard/next-action.ts";
import { summarizeProgress } from "../dashboard/progress.ts";
import { makePhase, makeTask } from "./fixture.ts";

function withoutKey(record: Record<string, unknown>, key: string): Record<string, unknown> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

const PHASE = makePhase({ id: "P0", title: "기반" });

test("progress — 전체·phase별 완료율과 상태별 집계를 센다", () => {
  const progress = summarizeProgress([
    PHASE,
    makePhase({ id: "P1", phase: "P1", title: "인증" }),
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T02", status: "done" }),
    makeTask({ id: "P0-T03", status: "in_progress" }),
    makeTask({ id: "P0-T04", status: "planned" }),
    makeTask({ id: "P1-T01", phase: "P1", status: "proposed" }),
  ]);

  assert.equal(progress.totalTasks, 5);
  assert.equal(progress.doneTasks, 2);
  assert.equal(progress.completionRate, 40);
  assert.deepEqual(
    progress.statusCounts.map((entry) => [entry.status, entry.count]),
    [
      ["proposed", 1],
      ["planned", 1],
      ["in_progress", 1],
      ["done", 2],
    ],
  );

  const phase0 = progress.phases.find((entry) => entry.id === "P0");
  assert.equal(phase0?.total, 4);
  assert.equal(phase0?.done, 2);
  assert.equal(phase0?.rate, 50);
  assert.equal(progress.phases.find((entry) => entry.id === "P1")?.rate, 0);
});

test("progress — 현재 in_progress task를 식별한다", () => {
  const progress = summarizeProgress([PHASE, makeTask({ id: "P0-T01", status: "in_progress" })]);

  assert.deepEqual(
    progress.inProgress.map((task) => task.id),
    ["P0-T01"],
  );
});

test("progress — 의존성이 모두 done인 planned만 실행 가능이다", () => {
  const progress = summarizeProgress([
    PHASE,
    makeTask({ id: "P0-T01", status: "done" }),
    makeTask({ id: "P0-T02", status: "proposed" }),
    makeTask({ id: "P0-T03", status: "planned", depends_on: ["P0-T01"] }),
    makeTask({ id: "P0-T04", status: "planned", depends_on: ["P0-T01", "P0-T02"] }),
  ]);

  assert.deepEqual(
    progress.runnable.map((candidate) => candidate.task.id),
    ["P0-T03"],
  );
  assert.deepEqual(
    progress.waiting.map((candidate) => candidate.task.id),
    ["P0-T04"],
  );
  assert.match(progress.waiting[0]?.blockers.join("\n") ?? "", /P0-T02/u);
});

test("progress — 승인이 빠진 planned는 실행 가능이 아니다", () => {
  const progress = summarizeProgress([
    PHASE,
    withoutKey(makeTask({ id: "P0-T01", status: "planned" }), "development_approval"),
    withoutKey(makeTask({ id: "P0-T02", status: "planned" }), "radio_ref"),
  ]);

  assert.deepEqual(progress.runnable, []);
  assert.equal(progress.waiting.length, 2);
  assert.match(progress.waiting[0]?.blockers.join("\n") ?? "", /개발 설계 승인|development_approval/u);
  assert.match(progress.waiting[1]?.blockers.join("\n") ?? "", /radio_ref|RADIO/u);
});

test("progress — blocked·design_pending·proposed를 각각 모은다", () => {
  const progress = summarizeProgress([
    PHASE,
    makeTask({ id: "P0-T01", status: "blocked" }),
    makeTask({ id: "P0-T02", status: "design_pending" }),
    makeTask({ id: "P0-T03", status: "proposed" }),
  ]);

  assert.deepEqual(
    progress.blocked.map((task) => task.id),
    ["P0-T01"],
  );
  assert.deepEqual(
    progress.designPending.map((task) => task.id),
    ["P0-T02"],
  );
  assert.deepEqual(
    progress.proposed.map((task) => task.id),
    ["P0-T03"],
  );
});

test("next-action — in_progress task가 있으면 그 task를 마치는 것이 다음 행동이다", () => {
  const progress = summarizeProgress([
    PHASE,
    makeTask({ id: "P0-T01", status: "in_progress" }),
    makeTask({ id: "P0-T02", status: "planned" }),
  ]);

  const action = recommendNextAction(progress);

  assert.equal(action.taskId, "P0-T01");
  assert.match(action.headline, /P0-T01/u);
  assert.ok(action.rationale.length > 0, "추천 근거가 있어야 한다");
});

test("next-action — 실행 가능한 planned가 있으면 index 등록 순서로 하나만 추천한다", () => {
  const progress = summarizeProgress([
    PHASE,
    makeTask({ id: "P0-T02", status: "planned" }),
    makeTask({ id: "P0-T03", status: "planned" }),
  ]);

  const action = recommendNextAction(progress);

  assert.equal(action.taskId, "P0-T02");
  assert.deepEqual(action.alternatives, ["P0-T03"]);
  assert.deepEqual(action.blockers, []);
  // F-06: 근거 문구는 실제 판정 기준(index 등록 순서)을 말해야 하고,
  // 계산하지 않는 "의존성 순서"를 단정하면 안 된다.
  assert.match(action.rationale, /index 등록 순서/u);
  assert.doesNotMatch(action.rationale, /의존성 순서/u);
});

test("next-action — 실행 가능한 후보가 없으면 차단 사유를 함께 제시한다", () => {
  const progress = summarizeProgress([
    PHASE,
    makeTask({ id: "P0-T01", status: "proposed" }),
    makeTask({ id: "P0-T02", status: "planned", depends_on: ["P0-T01"] }),
  ]);

  const action = recommendNextAction(progress);

  assert.match(action.blockers.join("\n"), /P0-T02/u);
  assert.match(action.blockers.join("\n"), /P0-T01/u);
});

test("next-action — blocked task 해소가 새 후보보다 앞선다", () => {
  const progress = summarizeProgress([
    PHASE,
    makeTask({ id: "P0-T01", status: "blocked" }),
    makeTask({ id: "P0-T02", status: "design_pending" }),
  ]);

  const action = recommendNextAction(progress);

  assert.equal(action.taskId, "P0-T01");
  assert.match(action.headline, /blocked|중단/u);
});

test("next-action — 실행 큐가 비면 설계 인터뷰, 그다음 기획 인터뷰를 안내한다", () => {
  const design = recommendNextAction(
    summarizeProgress([PHASE, makeTask({ id: "P0-T02", status: "design_pending" })]),
  );
  assert.equal(design.taskId, "P0-T02");
  assert.match(design.headline, /설계/u);

  const planning = recommendNextAction(
    summarizeProgress([PHASE, makeTask({ id: "P0-T03", status: "proposed" })]),
  );
  assert.equal(planning.taskId, "P0-T03");
  assert.match(planning.headline, /기획/u);
});

test("next-action — 아무 task도 없으면 추정하지 않고 없음을 알린다", () => {
  const action = recommendNextAction(summarizeProgress([PHASE]));

  assert.equal(action.taskId, null);
  assert.ok(action.headline.length > 0, "안내 문구는 있어야 한다");
});
