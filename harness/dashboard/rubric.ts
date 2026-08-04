import type { IndexRecord } from "../lib/task-index.ts";
import { isTask, readStringField, recordId, recordStatus } from "../lib/task-index.ts";

/** One gate execution result. `passed` means the gate reported no violation. */
export type GateOutcome = {
  readonly id: string;
  readonly passed: boolean;
  readonly violations: number;
  /** True when the gate itself could not run. Counted as not passed. */
  readonly errored?: boolean;
};

/**
 * Whether the regeneration rule (ADR-0012) was followed: measured against the
 * base commit recorded inside the previously committed dashboard artifact.
 */
export type ArtifactFreshness =
  | { readonly kind: "no-head" }
  | { readonly kind: "no-previous" }
  | { readonly kind: "unreadable" }
  | { readonly kind: "fresh"; readonly recordedCommit: string }
  | {
      readonly kind: "stale";
      readonly recordedCommit: string;
      /** Short SHAs of state-changing commits that were never regenerated over. */
      readonly missedCommits: readonly string[];
    };

export type EvidenceRequirement = "handoff" | "tdd";

/** One required run artifact of a completed task and whether it exists. */
export type EvidenceItem = {
  readonly taskId: string;
  readonly requirement: EvidenceRequirement;
  readonly present: boolean;
};

export type EvidenceTask = {
  readonly taskId: string;
  readonly requiresTdd: boolean;
};

export type RubricInput = {
  /** Repository gates that make up the score (index, radio, handoff, tdd). */
  readonly gates: readonly GateOutcome[];
  /** Commit-context gates (scope, commit-msg): shown as reference, never scored. */
  readonly referenceGates: readonly GateOutcome[];
  readonly evidence: readonly EvidenceItem[];
  readonly runnablePlannedCount: number;
  readonly blockedCount: number;
  readonly freshness: ArtifactFreshness;
  readonly pendingAdrCount: number;
  readonly openDebtCount: number;
  /** Optional sources behind the counts, appended to the evidence sentence. */
  readonly pendingAdrDetail?: readonly string[];
  readonly openDebtDetail?: readonly string[];
};

export type ScoreItem = {
  readonly id: string;
  readonly label: string;
  readonly earned: number;
  readonly max: number;
  /** Korean sentence with the numbers the score was derived from. */
  readonly evidence: string;
};

export type ScoreSection = {
  readonly id: string;
  readonly label: string;
  readonly earned: number;
  readonly max: number;
  readonly items: readonly ScoreItem[];
};

export type Grade = "우수" | "양호" | "주의";

export type Readiness = {
  readonly total: number;
  readonly grade: Grade;
  readonly sections: readonly ScoreSection[];
};

/**
 * First task of the five-layer restructure (ADR-0013). Tasks completed before it
 * predate the current run-evidence contract, so their missing `runs/**` records
 * are history, not debt.
 */
export const EVIDENCE_BASELINE_TASK_ID = "P0-T30";

/** Approval contract of tasks closed before the dual approval transition. */
const LEGACY_APPROVAL_CONTRACT = "legacy-v2";

const GRADE_EXCELLENT_MIN = 90;
const GRADE_GOOD_MIN = 70;

export function gradeOf(total: number): Grade {
  if (total >= GRADE_EXCELLENT_MIN) {
    return "우수";
  }
  return total >= GRADE_GOOD_MIN ? "양호" : "주의";
}

const TASK_ID_PARTS = /^P([0-9]+)-T([0-9]+)$/u;

/** Sort key of a task ID, or null when the ID has another shape. */
function taskOrder(taskId: string): readonly [number, number] | null {
  const parts = TASK_ID_PARTS.exec(taskId);
  if (parts === null) {
    return null;
  }
  return [Number(parts[1]), Number(parts[2])];
}

/** True when `taskId` is at or after `baselineId` in phase then task order. */
function isAtOrAfter(taskId: string, baselineId: string): boolean {
  const left = taskOrder(taskId);
  const right = taskOrder(baselineId);
  if (left === null || right === null) {
    return false;
  }
  return left[0] !== right[0] ? left[0] > right[0] : left[1] >= right[1];
}

/**
 * Completed tasks that must carry run evidence: `done` tasks from the
 * restructure baseline onward, excluding the `legacy-v2` approval contract.
 */
export function selectEvidenceTasks(records: readonly IndexRecord[]): EvidenceTask[] {
  return records
    .filter(
      (record) =>
        isTask(record) &&
        recordStatus(record) === "done" &&
        readStringField(record, "approval_contract") !== LEGACY_APPROVAL_CONTRACT &&
        isAtOrAfter(recordId(record), EVIDENCE_BASELINE_TASK_ID),
    )
    .map((record) => ({
      taskId: recordId(record),
      requiresTdd: readStringField(record, "test_mode") === "tdd",
    }));
}

function item(id: string, label: string, earned: number, max: number, evidence: string): ScoreItem {
  return { id, label, earned, max, evidence };
}

function section(id: string, label: string, items: readonly ScoreItem[]): ScoreSection {
  return {
    id,
    label,
    earned: items.reduce((accumulator, entry) => accumulator + entry.earned, 0),
    max: items.reduce((accumulator, entry) => accumulator + entry.max, 0),
    items,
  };
}

const CONTRACT_MAX = 40;
const EVIDENCE_MAX = 25;
const RUNNABLE_MAX = 10;
const NO_BLOCKED_MAX = 10;
const BASE_COMMIT_MAX = 7;
const PENDING_ADR_MAX = 4;
const OPEN_DEBT_MAX = 4;

/** One-word Korean state of a gate outcome, for the evidence sentence. */
function gateState(gate: GateOutcome): string {
  if (gate.errored === true) {
    return `${gate.id} 실행 실패`;
  }
  return gate.passed ? `${gate.id} 통과` : `${gate.id} 위반 ${gate.violations}건`;
}

function contractSection(
  gates: readonly GateOutcome[],
  referenceGates: readonly GateOutcome[],
): ScoreSection {
  if (gates.length === 0) {
    return section("contract", "계약 준수", [
      item(
        "gate-pass-rate",
        "저장소 게이트 통과율",
        0,
        CONTRACT_MAX,
        "게이트 실행 결과 누락 — 통과율을 판정할 수 없다.",
      ),
    ]);
  }
  const passed = gates.filter((gate) => gate.passed);
  const violatedIds = gates.filter((gate) => !gate.passed && gate.errored !== true).map((gate) => gate.id);
  const erroredIds = gates.filter((gate) => gate.errored === true).map((gate) => gate.id);

  let evidence = `저장소 게이트 ${passed.length}/${gates.length} 통과.`;
  if (violatedIds.length > 0) {
    evidence += ` 위반: ${violatedIds.join(", ")}.`;
  }
  if (erroredIds.length > 0) {
    evidence += ` 실행 실패: ${erroredIds.join(", ")}.`;
  }
  if (referenceGates.length > 0) {
    evidence += ` 참고(점수 제외): ${referenceGates.map(gateState).join(", ")}.`;
  }
  return section("contract", "계약 준수", [
    item(
      "gate-pass-rate",
      "저장소 게이트 통과율",
      Math.round((passed.length / gates.length) * CONTRACT_MAX),
      CONTRACT_MAX,
      evidence,
    ),
  ]);
}

function evidenceSection(evidence: readonly EvidenceItem[]): ScoreSection {
  if (evidence.length === 0) {
    return section("evidence", "증거 완결성", [
      item(
        "evidence-rate",
        "완료 task 증거 보유율",
        EVIDENCE_MAX,
        EVIDENCE_MAX,
        `대상 없음 — ${EVIDENCE_BASELINE_TASK_ID} 이후 완료된 task가 없어 확인할 증거가 없다.`,
      ),
    ]);
  }
  const present = evidence.filter((entry) => entry.present);
  const missing = evidence
    .filter((entry) => !entry.present)
    .map((entry) => `${entry.taskId}:${entry.requirement}`);
  const description =
    missing.length === 0
      ? `증거 ${present.length}/${evidence.length}건 보유(${EVIDENCE_BASELINE_TASK_ID} 이후 완료 task, legacy-v2 제외).`
      : `증거 ${present.length}/${evidence.length}건 보유. 누락: ${missing.join(", ")}.`;
  return section("evidence", "증거 완결성", [
    item(
      "evidence-rate",
      "완료 task 증거 보유율",
      Math.round((present.length / evidence.length) * EVIDENCE_MAX),
      EVIDENCE_MAX,
      description,
    ),
  ]);
}

function executionSection(runnablePlannedCount: number, blockedCount: number): ScoreSection {
  return section("execution", "실행 준비도", [
    item(
      "runnable-planned",
      "실행 가능한 planned 존재",
      runnablePlannedCount > 0 ? RUNNABLE_MAX : 0,
      RUNNABLE_MAX,
      `의존성이 모두 done인 planned task ${runnablePlannedCount}건.`,
    ),
    item(
      "no-blocked",
      "blocked 0건",
      blockedCount === 0 ? NO_BLOCKED_MAX : 0,
      NO_BLOCKED_MAX,
      `blocked task ${blockedCount}건.`,
    ),
  ]);
}

function freshnessItem(freshness: ArtifactFreshness): ScoreItem {
  const LABEL = "재생성 준수";
  switch (freshness.kind) {
    case "no-head":
      return item("base-commit", LABEL, 0, BASE_COMMIT_MAX, "git HEAD 누락 — 재생성 준수를 확인할 수 없다.");
    case "no-previous":
      return item(
        "base-commit",
        LABEL,
        BASE_COMMIT_MAX,
        BASE_COMMIT_MAX,
        "커밋된 기존 산출물이 없다(첫 생성) — 재생성 규칙 위반 없음으로 본다.",
      );
    case "unreadable":
      return item(
        "base-commit",
        LABEL,
        0,
        BASE_COMMIT_MAX,
        "커밋된 기존 산출물의 기준 커밋을 읽지 못했다 — 재생성 준수를 판정할 수 없다.",
      );
    case "fresh":
      return item(
        "base-commit",
        LABEL,
        BASE_COMMIT_MAX,
        BASE_COMMIT_MAX,
        `기존 산출물 기준 커밋 ${freshness.recordedCommit.slice(0, 7)} 이후 재생성이 필요한 상태 변경 커밋이 없다.`,
      );
    case "stale":
      return item(
        "base-commit",
        LABEL,
        0,
        BASE_COMMIT_MAX,
        `기존 산출물 기준 커밋 ${freshness.recordedCommit.slice(0, 7)} 이후 재생성 없이 상태 변경 커밋 ${freshness.missedCommits.length}건(${freshness.missedCommits.join(", ")})이 쌓였다.`,
      );
  }
}

/** Appends the sources behind a count, when the caller knows them. */
function withDetail(sentence: string, detail: readonly string[] | undefined): string {
  return detail === undefined || detail.length === 0 ? sentence : `${sentence} ${detail.join(", ")}.`;
}

function freshnessSection(input: RubricInput): ScoreSection {
  return section("freshness", "문서 신선도", [
    freshnessItem(input.freshness),
    item(
      "pending-adr",
      "보류 ADR 0건",
      input.pendingAdrCount === 0 ? PENDING_ADR_MAX : 0,
      PENDING_ADR_MAX,
      withDetail(`보류 상태 ADR ${input.pendingAdrCount}건.`, input.pendingAdrDetail),
    ),
    item(
      "open-debt",
      "미결 부채 0건",
      input.openDebtCount === 0 ? OPEN_DEBT_MAX : 0,
      OPEN_DEBT_MAX,
      withDetail(`최신 handoff의 미결 항목 ${input.openDebtCount}건.`, input.openDebtDetail),
    ),
  ]);
}

/**
 * Machine judged readiness over four areas: contract compliance 40, evidence
 * completeness 25, execution readiness 20 and document freshness 15. Every item
 * carries the numbers it was derived from so no score is unexplained.
 */
export function computeReadiness(input: RubricInput): Readiness {
  const sections = [
    contractSection(input.gates, input.referenceGates),
    evidenceSection(input.evidence),
    executionSection(input.runnablePlannedCount, input.blockedCount),
    freshnessSection(input),
  ];
  const total = sections.reduce((accumulator, entry) => accumulator + entry.earned, 0);
  return { total, grade: gradeOf(total), sections };
}
