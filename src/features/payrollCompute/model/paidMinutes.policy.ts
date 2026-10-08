import {
  rehearsalHours,
  type RehearsalClock,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";

export type WorkDayHours = {
  starts_at: string;
  ends_at: string;
};

export type AdjustmentRow = {
  minutes: number;
  adjusted_at: string;
};

export type LiveAssignments = readonly unknown[];

export type PaidMinutesInput = {
  assignments: LiveAssignments;
  day: WorkDayHours | null;
  adjustments: readonly AdjustmentRow[];
  rehearsals: readonly RehearsalClock[];
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

export function adjustedMinutes(rows: readonly AdjustmentRow[]): number {
  const latest = rows.reduce<AdjustmentRow | null>(
    (kept, row) =>
      kept === null || row.adjusted_at > kept.adjusted_at ? row : kept,
    null,
  );

  return latest?.minutes ?? 0;
}

function rehearsedMinutes(rows: readonly RehearsalClock[]): number {
  return rows.reduce((sum, row) => sum + rehearsalHours(row), 0);
}

export function paidMinutes(input: PaidMinutesInput): number {
  const total =
    assignedMinutes(input) +
    adjustedMinutes(input.adjustments) +
    rehearsedMinutes(input.rehearsals);

  return Math.max(total, 0);
}
