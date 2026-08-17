import { differenceInCalendarDays } from "date-fns";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import {
  toScheduleEntryState,
  type ScheduleEntryState,
} from "@/views/schedule/model/schedule-cell-state";

export type DeadlineBatchRow = {
  workDate: string;
  state: ScheduleEntryState;
  selectable: boolean;
};

export type DeadlineBatch = {
  deadline: string | null;
  daysLeft: number | null;
  rows: DeadlineBatchRow[];
};

export type ToDeadlineBatchesParams = {
  today: string;
  schedules: readonly RecruitmentScheduleWithApplication[];
  pending: ReadonlySet<string>;
  savedApplied: ReadonlySet<string>;
};

const SELECTABLE_STATES: ReadonlySet<ScheduleEntryState> = new Set<ScheduleEntryState>([
  "open",
  "selected",
]);

function toDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function byWorkDate(left: DeadlineBatchRow, right: DeadlineBatchRow) {
  return left.workDate.localeCompare(right.workDate);
}

export function toDeadlineBatches({
  today,
  schedules,
  pending,
  savedApplied,
}: ToDeadlineBatchesParams): DeadlineBatch[] {
  const openBatches = new Map<string, DeadlineBatchRow[]>();
  const passedRows: DeadlineBatchRow[] = [];

  for (const schedule of schedules) {
    if (schedule.status === "CANCELLED") {
      continue;
    }

    const state = toScheduleEntryState(schedule, pending, savedApplied);
    const row: DeadlineBatchRow = {
      workDate: schedule.workDate,
      state,
      selectable: SELECTABLE_STATES.has(state),
    };

    if (schedule.applicationDeadline < today) {
      passedRows.push(row);
      continue;
    }

    const rows = openBatches.get(schedule.applicationDeadline);
    if (rows === undefined) {
      openBatches.set(schedule.applicationDeadline, [row]);
    } else {
      rows.push(row);
    }
  }

  const batches: DeadlineBatch[] = [...openBatches.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([deadline, rows]) => ({
      deadline,
      daysLeft: differenceInCalendarDays(toDate(deadline), toDate(today)),
      rows: rows.sort(byWorkDate),
    }));

  if (passedRows.length > 0) {
    batches.push({ deadline: null, daysLeft: null, rows: passedRows.sort(byWorkDate) });
  }

  return batches;
}
