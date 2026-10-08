import {
  dayTotal,
  type RehearsalRow,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import {
  adjustedMinutes,
  paidMinutes,
  type AdjustmentRow,
  type WorkDayHours,
} from "@/features/payrollCompute/model/paidMinutes.policy";
import { assignedMinutes } from "@/screens/scheduleAdmin/utils/absenceMinutes.utils";

const MINUTES_PER_HOUR = 60;

const CLOCK_LENGTH = 5;

export type AdjustSheetAssignment = {
  profile_id: string;
  name: string;
  kind: string;
  ended_at: string | null;
};

export type AdjustSheetAdjustment = AdjustmentRow & { profile_id: string };

export type AdjustSheetRehearsal = RehearsalRow & { profile_id: string };

export type AdjustmentKind = "결근" | "연장";

export type AdjustSheetRow = {
  profile_id: string;
  name: string;
  finalMinutes: number;
  adjustmentKind: AdjustmentKind | null;
  rehearsalLine: string | null;
};

export type AdjustSheetInput = {
  day: WorkDayHours;
  assignments: readonly AdjustSheetAssignment[];
  adjustments: readonly AdjustSheetAdjustment[];
  rehearsals: readonly AdjustSheetRehearsal[];
};

export function spellHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (rest === 0) {
    return `${hours}시간`;
  }

  return hours === 0 ? `${rest}분` : `${hours}시간 ${rest}분`;
}

function clock(value: string): string {
  return value.slice(0, CLOCK_LENGTH);
}

export function adjustSheetHead(day: WorkDayHours): string {
  return `${clock(day.starts_at)}–${clock(day.ends_at)} · ${spellHours(
    assignedMinutes(day),
  )}`;
}

export function adjustRowLabel(row: AdjustSheetRow): string {
  const time = spellHours(row.finalMinutes);
  const spelled =
    row.adjustmentKind === null ? time : `${row.adjustmentKind} ${time}`;

  return `${row.name} · ${spelled}`;
}

function kindOf(minutes: number): AdjustmentKind | null {
  if (minutes === 0) {
    return null;
  }

  return minutes < 0 ? "결근" : "연장";
}

function isClockRow(row: RehearsalRow): boolean {
  return row.count === null && row.starts_at !== null && row.ends_at !== null;
}

function rehearsalLineOf(rows: readonly RehearsalRow[]): string | null {
  if (rows.length === 0) {
    return null;
  }

  const total = dayTotal(rows);
  const only = rows.length === 1 ? rows[0] : null;

  if (only !== null && isClockRow(only)) {
    return `리허설 ${clock(only.starts_at ?? "")}–${clock(
      only.ends_at ?? "",
    )} · ${spellHours(total.minutes)}`;
  }

  return `리허설 ${total.count}건 · ${spellHours(total.minutes)}`;
}

export function adjustSheetRows(input: AdjustSheetInput): AdjustSheetRow[] {
  return input.assignments
    .filter((assignment) => assignment.ended_at === null)
    .map((assignment) => {
      const adjustments = input.adjustments.filter(
        (row) => row.profile_id === assignment.profile_id,
      );
      const rehearsals = input.rehearsals.filter(
        (row) => row.profile_id === assignment.profile_id,
      );

      return {
        profile_id: assignment.profile_id,
        name: assignment.name,
        finalMinutes: paidMinutes({
          assignments: [assignment],
          day: input.day,
          adjustments,
          rehearsals,
        }),
        adjustmentKind: kindOf(adjustedMinutes(adjustments)),
        rehearsalLine: rehearsalLineOf(rehearsals),
      };
    });
}
