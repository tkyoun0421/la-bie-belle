import type { Adjustment } from "@/entities/payroll/model/payroll.type";
import {
  rehearsalHours,
  type RehearsalClock,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";

export type WorkDayHours = Pick<ScheduleDay, "startsAt" | "endsAt">;

export type TimedAdjustment = Pick<Adjustment, "minutes" | "adjustedAt">;

export type LiveAssignments = readonly unknown[];

export type PaidMinutesInput = {
  assignments: LiveAssignments;
  day: WorkDayHours | null;
  adjustments: readonly TimedAdjustment[];
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

  return minutesOfClock(input.day.endsAt) - minutesOfClock(input.day.startsAt);
}

export function adjustedMinutes(rows: readonly TimedAdjustment[]): number {
  const latest = rows.reduce<TimedAdjustment | null>(
    (kept, row) =>
      kept === null || row.adjustedAt > kept.adjustedAt ? row : kept,
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
