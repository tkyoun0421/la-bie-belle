import { clockOf } from "@/shared/utils/kstDate";
import { spellDuration } from "@/shared/utils/spellNumber";
import {
  dayTotal,
  type RehearsalClock,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import type { ScheduleAssignment } from "@/entities/schedule/model/schedule.type";
import type {
  AdjustmentKind,
  AdjustSheetRow,
} from "@/features/adjustment/model/adjustSheetRow.type";
import {
  adjustedMinutes,
  paidMinutes,
  type TimedAdjustment,
  type WorkDayHours,
} from "@/features/payrollCompute/model/paidMinutes.policy";
import { assignedMinutes } from "@/screens/scheduleAdmin/utils/absenceMinutes.utils";

export type AdjustSheetAssignment = Pick<
  ScheduleAssignment,
  "profileId" | "kind" | "endedAt"
> & {
  name: string;
};

export type AdjustSheetAdjustment = TimedAdjustment & { profileId: string };

export type AdjustSheetRehearsal = RehearsalClock & { profileId: string };

export type AdjustSheetRowsInput = {
  day: WorkDayHours;
  assignments: readonly AdjustSheetAssignment[];
  adjustments: readonly AdjustSheetAdjustment[];
  rehearsals: readonly AdjustSheetRehearsal[];
};

export function adjustSheetHead(day: WorkDayHours): string {
  return `${clockOf(day.startsAt)}–${clockOf(day.endsAt)} · ${spellDuration(
    assignedMinutes(day),
  )}`;
}

function kindOf(minutes: number): AdjustmentKind | null {
  if (minutes === 0) {
    return null;
  }

  return minutes < 0 ? "결근" : "연장";
}

function isClockRow(row: RehearsalClock): boolean {
  return row.count === null && row.startsAt !== null && row.endsAt !== null;
}

function rehearsalLineOf(rows: readonly RehearsalClock[]): string | null {
  if (rows.length === 0) {
    return null;
  }

  const total = dayTotal(rows);
  const only = rows.length === 1 ? rows[0] : null;

  if (only !== null && isClockRow(only)) {
    return `리허설 ${clockOf(only.startsAt ?? "")}–${clockOf(
      only.endsAt ?? "",
    )} · ${spellDuration(total.minutes)}`;
  }

  return `리허설 ${total.count}건 · ${spellDuration(total.minutes)}`;
}

export function adjustSheetRows(input: AdjustSheetRowsInput): AdjustSheetRow[] {
  return input.assignments
    .filter((assignment) => assignment.endedAt === null)
    .map((assignment) => {
      const adjustments = input.adjustments.filter(
        (row) => row.profileId === assignment.profileId,
      );
      const rehearsals = input.rehearsals.filter(
        (row) => row.profileId === assignment.profileId,
      );

      return {
        profileId: assignment.profileId,
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
