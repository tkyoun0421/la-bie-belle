import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactFreshness, RubricInput, Readiness } from "../dashboard/rubric.ts";
import {
  EVIDENCE_BASELINE_TASK_ID,
  computeReadiness,
  gradeOf,
  selectEvidenceTasks,
} from "../dashboard/rubric.ts";
import { makePhase, makeTask } from "./fixture.ts";

const SCORED_GATE_IDS = ["gate:index", "gate:radio", "gate:handoff", "gate:tdd"];

function gates(passedCount: number): RubricInput["gates"] {
  return SCORED_GATE_IDS.map((id, position) => ({
    id,
    passed: position < passedCount,
    violations: position < passedCount ? 0 : 1,
  }));
}

function referenceGates(passed: boolean): RubricInput["referenceGates"] {
  return [
    { id: "gate:scope", passed, violations: passed ? 0 : 1 },
    { id: "commit-msg", passed, violations: passed ? 0 : 1 },
  ];
}

const COMMIT = "a".repeat(40);
const FRESH: ArtifactFreshness = { kind: "fresh", recordedCommit: COMMIT };

function perfectInput(overrides: Partial<RubricInput> = {}): RubricInput {
  return {
    gates: gates(4),
    referenceGates: referenceGates(true),
    evidence: [
      { taskId: "P0-T30", requirement: "handoff", present: true },
      { taskId: "P0-T31", requirement: "handoff", present: true },
      { taskId: "P0-T31", requirement: "tdd", present: true },
    ],
    runnablePlannedCount: 1,
    blockedCount: 0,
    freshness: FRESH,
    pendingAdrCount: 0,
    openDebtCount: 0,
    ...overrides,
  };
}

function section(readiness: Readiness, id: string): Readiness["sections"][number] {
  const found = readiness.sections.find((candidate) => candidate.id === id);
  assert.ok(found !== undefined, `영역 ${id}가 없다`);
  return found;
}

function itemOf(
  readiness: Readiness,
  sectionId: string,
  itemId: string,
): { earned: number; evidence: string } {
  const found = section(readiness, sectionId).items.find((candidate) => candidate.id === itemId);
  assert.ok(found !== undefined, `항목 ${itemId}가 없다`);
  return found;
}

test("rubric — 만점 입력은 100점 우수 등급이다", () => {
  const readiness = computeReadiness(perfectInput());

  assert.equal(readiness.total, 100);
  assert.equal(readiness.grade, "우수");
  assert.equal(section(readiness, "contract").earned, 40);
  assert.equal(section(readiness, "evidence").earned, 25);
  assert.equal(section(readiness, "execution").earned, 20);
  assert.equal(section(readiness, "freshness").earned, 15);
});

test("rubric — 총점은 4개 영역 배점 합과 같다", () => {
  const readiness = computeReadiness(
    perfectInput({ gates: gates(2), blockedCount: 2, pendingAdrCount: 1 }),
  );
  const sum = readiness.sections.reduce((accumulator, entry) => accumulator + entry.earned, 0);

  assert.equal(readiness.total, sum);
  assert.equal(
    readiness.sections.reduce((accumulator, entry) => accumulator + entry.max, 0),
    100,
  );
});

test("rubric — 계약 준수는 저장소 게이트 4종 통과율에 비례하고 근거 수치를 남긴다", () => {
  assert.equal(section(computeReadiness(perfectInput({ gates: gates(2) })), "contract").earned, 20);
  assert.equal(section(computeReadiness(perfectInput({ gates: gates(0) })), "contract").earned, 0);
  assert.equal(section(computeReadiness(perfectInput({ gates: gates(3) })), "contract").earned, 30);

  const evidence = itemOf(
    computeReadiness(perfectInput({ gates: gates(3) })),
    "contract",
    "gate-pass-rate",
  ).evidence;
  assert.match(evidence, /3\s*\/\s*4/u);
});

test("rubric — 커밋 문맥 게이트는 점수에 넣지 않고 참고로만 표시한다", () => {
  const readiness = computeReadiness(perfectInput({ referenceGates: referenceGates(false) }));

  assert.equal(section(readiness, "contract").earned, 40);
  const evidence = itemOf(readiness, "contract", "gate-pass-rate").evidence;
  assert.match(evidence, /참고/u);
  assert.match(evidence, /gate:scope/u);
  assert.match(evidence, /commit-msg/u);
});

test("rubric — 실행에 실패한 게이트는 통과로 세지 않고 실행 실패로 표기한다", () => {
  const withErrored = perfectInput({
    gates: [
      { id: "gate:index", passed: false, violations: 0, errored: true },
      { id: "gate:radio", passed: true, violations: 0 },
      { id: "gate:handoff", passed: true, violations: 0 },
      { id: "gate:tdd", passed: true, violations: 0 },
    ],
  });
  const readiness = computeReadiness(withErrored);

  assert.equal(section(readiness, "contract").earned, 30);
  const evidence = itemOf(readiness, "contract", "gate-pass-rate").evidence;
  assert.match(evidence, /실행 실패/u);
  assert.match(evidence, /gate:index/u);
});

test("rubric — 게이트 결과가 없으면 계약 준수는 0점이고 누락을 표시한다", () => {
  const readiness = computeReadiness(perfectInput({ gates: [] }));

  assert.equal(section(readiness, "contract").earned, 0);
  assert.match(itemOf(readiness, "contract", "gate-pass-rate").evidence, /누락|없/u);
});

test("rubric — 증거 완결성은 보유율에 비례한다", () => {
  const partial = computeReadiness(
    perfectInput({
      evidence: [
        { taskId: "P0-T30", requirement: "handoff", present: true },
        { taskId: "P0-T31", requirement: "handoff", present: true },
        { taskId: "P0-T31", requirement: "tdd", present: true },
        { taskId: "P0-T32", requirement: "handoff", present: false },
      ],
    }),
  );

  assert.equal(section(partial, "evidence").earned, 19);
  assert.match(itemOf(partial, "evidence", "evidence-rate").evidence, /3\s*\/\s*4/u);
});

test("rubric — 증거 대상이 없으면 만점을 주되 대상 없음을 명시한다", () => {
  const readiness = computeReadiness(perfectInput({ evidence: [] }));

  assert.equal(section(readiness, "evidence").earned, 25);
  assert.match(itemOf(readiness, "evidence", "evidence-rate").evidence, /대상 없음/u);
});

test("rubric — 실행 준비도는 실행 가능 planned와 blocked 0건을 각각 10점으로 센다", () => {
  const noCandidate = computeReadiness(perfectInput({ runnablePlannedCount: 0 }));
  assert.equal(itemOf(noCandidate, "execution", "runnable-planned").earned, 0);
  assert.equal(itemOf(noCandidate, "execution", "no-blocked").earned, 10);
  assert.equal(section(noCandidate, "execution").earned, 10);

  const blocked = computeReadiness(perfectInput({ blockedCount: 2 }));
  assert.equal(itemOf(blocked, "execution", "runnable-planned").earned, 10);
  assert.equal(itemOf(blocked, "execution", "no-blocked").earned, 0);
  assert.match(itemOf(blocked, "execution", "no-blocked").evidence, /2/u);
});

test("rubric — 재생성 준수 7점은 기존 산출물의 기준 커밋으로 실측한다", () => {
  const fresh = computeReadiness(perfectInput());
  assert.equal(itemOf(fresh, "freshness", "base-commit").earned, 7);
  assert.match(
    itemOf(fresh, "freshness", "base-commit").evidence,
    new RegExp(COMMIT.slice(0, 7), "u"),
  );

  const stale = computeReadiness(
    perfectInput({
      freshness: {
        kind: "stale",
        recordedCommit: COMMIT,
        missedCommits: ["b".repeat(7), "c".repeat(7)],
      },
    }),
  );
  assert.equal(itemOf(stale, "freshness", "base-commit").earned, 0);
  assert.match(itemOf(stale, "freshness", "base-commit").evidence, /2건/u);
  assert.match(itemOf(stale, "freshness", "base-commit").evidence, new RegExp("b".repeat(7), "u"));
});

test("rubric — 기존 산출물이 없으면(첫 생성) 재생성 위반 없음으로 만점을 준다", () => {
  const readiness = computeReadiness(perfectInput({ freshness: { kind: "no-previous" } }));

  assert.equal(itemOf(readiness, "freshness", "base-commit").earned, 7);
  assert.match(itemOf(readiness, "freshness", "base-commit").evidence, /첫 생성|기존 산출물이 없/u);
});

test("rubric — 기존 산출물의 기준 커밋을 읽지 못하면 점수를 추정하지 않는다", () => {
  const unreadable = computeReadiness(perfectInput({ freshness: { kind: "unreadable" } }));
  assert.equal(itemOf(unreadable, "freshness", "base-commit").earned, 0);
  assert.match(itemOf(unreadable, "freshness", "base-commit").evidence, /읽지 못|판정할 수 없/u);

  const noHead = computeReadiness(perfectInput({ freshness: { kind: "no-head" } }));
  assert.equal(itemOf(noHead, "freshness", "base-commit").earned, 0);
  assert.match(itemOf(noHead, "freshness", "base-commit").evidence, /누락|확인할 수 없/u);
});

test("rubric — 문서 신선도는 재생성 준수·보류 ADR·미결 부채를 7·4·4로 센다", () => {
  const fresh = computeReadiness(perfectInput());
  assert.equal(itemOf(fresh, "freshness", "base-commit").earned, 7);
  assert.equal(itemOf(fresh, "freshness", "pending-adr").earned, 4);
  assert.equal(itemOf(fresh, "freshness", "open-debt").earned, 4);

  const stale = computeReadiness(
    perfectInput({
      freshness: { kind: "stale", recordedCommit: COMMIT, missedCommits: ["b".repeat(7)] },
      pendingAdrCount: 1,
      openDebtCount: 3,
    }),
  );
  assert.equal(section(stale, "freshness").earned, 0);
  assert.match(itemOf(stale, "freshness", "open-debt").evidence, /3/u);
});

test("rubric — 보류 ADR과 미결 부채는 근거에 출처를 함께 남긴다", () => {
  const readiness = computeReadiness(
    perfectInput({
      pendingAdrCount: 1,
      pendingAdrDetail: ["ADR-0012 정적 운영 대시보드"],
      openDebtCount: 5,
      openDebtDetail: [
        "docs/execution/runs/P0-T30/handoff.md 3건",
        "docs/execution/runs/P0-T32/handoff.md 2건",
      ],
    }),
  );

  assert.match(itemOf(readiness, "freshness", "pending-adr").evidence, /ADR-0012/u);
  assert.match(itemOf(readiness, "freshness", "open-debt").evidence, /P0-T30/u);
  assert.match(itemOf(readiness, "freshness", "open-debt").evidence, /P0-T32/u);
});

test("rubric — 모든 항목이 근거 수치를 가진다", () => {
  const readiness = computeReadiness(perfectInput({ gates: gates(3), blockedCount: 1 }));

  for (const entry of readiness.sections) {
    assert.ok(entry.label.length > 0, `${entry.id} 영역 이름이 비었다`);
    for (const item of entry.items) {
      assert.ok(item.evidence.trim().length > 0, `${item.id} 항목의 근거가 비었다`);
      assert.ok(item.earned <= item.max, `${item.id} 항목이 배점을 넘었다`);
    }
    assert.equal(
      entry.items.reduce((accumulator, item) => accumulator + item.max, 0),
      entry.max,
    );
  }
});

test("rubric — 등급 경계는 90과 70이다", () => {
  assert.equal(gradeOf(100), "우수");
  assert.equal(gradeOf(90), "우수");
  assert.equal(gradeOf(89), "양호");
  assert.equal(gradeOf(70), "양호");
  assert.equal(gradeOf(69), "주의");
  assert.equal(gradeOf(0), "주의");
});

test("rubric — 증거 대상은 재편 기준 이후의 완료 task만이다", () => {
  const selected = selectEvidenceTasks([
    makePhase(),
    makeTask({
      id: "P0-T13",
      status: "done",
      approval_contract: "legacy-v2",
      test_mode: "verification",
    }),
    makeTask({ id: "P0-T28", status: "done", test_mode: "tdd" }),
    makeTask({ id: "P0-T30", status: "done", test_mode: "docs_only" }),
    makeTask({ id: "P0-T31", status: "done", test_mode: "tdd" }),
    makeTask({ id: "P0-T29", status: "in_progress", test_mode: "tdd" }),
    makeTask({ id: "P1-T01", status: "done", test_mode: "tdd" }),
  ]);

  assert.deepEqual(
    selected.map((entry) => entry.taskId),
    ["P0-T30", "P0-T31", "P1-T01"],
  );
  assert.deepEqual(
    selected.map((entry) => entry.requiresTdd),
    [false, true, true],
  );
  assert.equal(EVIDENCE_BASELINE_TASK_ID, "P0-T30");
});
