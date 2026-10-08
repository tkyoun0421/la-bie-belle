import type { Adjustment } from "@/entities/payroll/model/payroll.type";
import {
  rehearsalHours,
  type RehearsalRow,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";

export type WorkDayHours = {
  starts_at: string;
  ends_at: string;
};

export type TimedAdjustment = Pick<Adjustment, "minutes" | "adjustedAt">;

export type LiveAssignments = readonly unknown[];

export type PaidMinutesInput = {
  assignments: LiveAssignments;
  day: WorkDayHours | null;
  adjustments: readonly TimedAdjustment[];
  rehearsals: readonly RehearsalRow[];
};

const MINUTES_PER_HOUR = 60;

function minutesOfClock(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}

function assignedMinutes(input: PaidMinutesInput): number {
  if (input.assignments.length === 0 || input.day === null) {
    return 0;
  }

  return (
    minutesOfClock(input.day.ends_at) - minutesOfClock(input.day.starts_at)
  );
}

export function adjustedMinutes(rows: readonly TimedAdjustment[]): number {
  const latest = rows.reduce<TimedAdjustment | null>(
    (kept, row) =>
      kept === null || row.adjustedAt > kept.adjustedAt ? row : kept,
    null,
  );

  return latest?.minutes ?? 0;
}

function rehearsedMinutes(rows: readonly RehearsalRow[]): number {
  return rows.reduce((sum, row) => sum + rehearsalHours(row), 0);
}

export function paidMinutes(input: PaidMinutesInput): number {
  const total =
    assignedMinutes(input) +
    adjustedMinutes(input.adjustments) +
    rehearsedMinutes(input.rehearsals);

  return Math.max(total, 0);
}
