import type { IndexRecord } from "../lib/task-index.ts";
import {
  isTask,
  readObjectField,
  readStringField,
  recordId,
  recordStatus,
} from "../lib/task-index.ts";

export type TaskSummary = {
  readonly id: string;
  readonly phase: string;
  readonly title: string;
  readonly status: string;
  readonly dependsOn: readonly string[];
  readonly testMode: string | null;
  readonly checkIds: readonly string[];
  readonly radioRef: string | null;
  readonly hasProductApproval: boolean;
  readonly hasDevelopmentApproval: boolean;
};

export type PhaseSummary = {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly total: number;
  readonly done: number;
  readonly rate: number;
};

export type PlannedCandidate = {
  readonly task: TaskSummary;
  readonly blockers: readonly string[];
};

export type StatusCount = {
  readonly status: string;
  readonly count: number;
};

export type ProgressSummary = {
  readonly tasks: readonly TaskSummary[];
  readonly phases: readonly PhaseSummary[];
  readonly totalTasks: number;
  readonly doneTasks: number;
  readonly completionRate: number;
  readonly statusCounts: readonly StatusCount[];
  readonly inProgress: readonly TaskSummary[];
  readonly runnable: readonly PlannedCandidate[];
  readonly waiting: readonly PlannedCandidate[];
  readonly blocked: readonly TaskSummary[];
  readonly designPending: readonly TaskSummary[];
  readonly proposed: readonly TaskSummary[];
};

export const STATUS_ORDER: readonly string[] = [
  "proposed",
  "design_pending",
  "planned",
  "in_progress",
  "verification_pending",
  "blocked",
  "done",
  "skipped",
];

export const STATUS_LABELS: Readonly<Record<string, string>> = {
  proposed: "기획 미승인",
  design_pending: "설계 대기",
  planned: "실행 대기",
  in_progress: "진행 중",
  verification_pending: "검증 대기",
  blocked: "중단",
  done: "완료",
  skipped: "건너뜀",
};

function readStringArray(record: IndexRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function toTaskSummary(record: IndexRecord): TaskSummary {
  return {
    id: recordId(record),
    phase: readStringField(record, "phase") ?? "",
    title: readStringField(record, "title") ?? "",
    status: recordStatus(record),
    dependsOn: readStringArray(record, "depends_on"),
    testMode: readStringField(record, "test_mode"),
    checkIds: readStringArray(record, "check_ids"),
    radioRef: readStringField(record, "radio_ref"),
    hasProductApproval: readObjectField(record, "product_approval") !== null,
    hasDevelopmentApproval: readObjectField(record, "development_approval") !== null,
  };
}

function percentage(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function countStatuses(tasks: readonly TaskSummary[]): StatusCount[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  }
  const known = STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
  const unknown = [...counts.keys()]
    .filter((status) => !STATUS_ORDER.includes(status))
    .sort()
    .map((status) => ({ status, count: counts.get(status) ?? 0 }));
  return [...known, ...unknown];
}

function summarizePhases(
  records: readonly IndexRecord[],
  tasks: readonly TaskSummary[],
): PhaseSummary[] {
  return records
    .filter((record) => !isTask(record))
    .map((record) => {
      const id = recordId(record);
      const owned = tasks.filter((task) => task.phase === id);
      const done = owned.filter((task) => task.status === "done").length;
      return {
        id,
        title: readStringField(record, "title") ?? "",
        status: recordStatus(record),
        total: owned.length,
        done,
        rate: percentage(done, owned.length),
      };
    });
}

function candidateBlockers(task: TaskSummary, doneIds: ReadonlySet<string>): string[] {
  const blockers: string[] = [];
  if (!task.hasProductApproval) {
    blockers.push(`${task.id}: 기획 승인(product_approval)이 없다.`);
  }
  if (!task.hasDevelopmentApproval) {
    blockers.push(`${task.id}: 개발 설계 승인(development_approval)이 없다.`);
  }
  if (task.radioRef === null) {
    blockers.push(`${task.id}: 승인된 RADIO 경로(radio_ref)가 없다.`);
  }
  const unmet = task.dependsOn.filter((dependency) => !doneIds.has(dependency));
  if (unmet.length > 0) {
    blockers.push(`${task.id}: 선행 task ${unmet.join(", ")}가 done이 아니다.`);
  }
  return blockers;
}

export function summarizeProgress(records: readonly IndexRecord[]): ProgressSummary {
  const tasks = records.filter(isTask).map(toTaskSummary);
  const doneIds = new Set(tasks.filter((task) => task.status === "done").map((task) => task.id));

  const candidates = tasks
    .filter((task) => task.status === "planned")
    .map((task) => ({ task, blockers: candidateBlockers(task, doneIds) }));

  const withStatus = (status: string): TaskSummary[] =>
    tasks.filter((task) => task.status === status);

  return {
    tasks,
    phases: summarizePhases(records, tasks),
    totalTasks: tasks.length,
    doneTasks: doneIds.size,
    completionRate: percentage(doneIds.size, tasks.length),
    statusCounts: countStatuses(tasks),
    inProgress: withStatus("in_progress"),
    runnable: candidates.filter((candidate) => candidate.blockers.length === 0),
    waiting: candidates.filter((candidate) => candidate.blockers.length > 0),
    blocked: withStatus("blocked"),
    designPending: withStatus("design_pending"),
    proposed: withStatus("proposed"),
  };
}
