import type {
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/stats.type";
import {
  shiftMinutes,
  isLiveAssignment,
} from "@/features/stats/model/workTotals.policy";

const TRAINING_KIND = "training";

export type PersonDayRow = {
  workDate: string;
  position: string;
  label: string;
  minutes: number;
};

export type PersonDays = {
  days: PersonDayRow[];
  totalMinutes: number;
  totalCount: number;
};

export function computePersonDays(
  profileId: string,
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
): PersonDays {
  const dayById = new Map(days.map((day) => [day.id, day]));

  const rows = assignments
    .filter(
      (assignment) =>
        isLiveAssignment(assignment) && assignment.profileId === profileId,
    )
    .flatMap((assignment) => {
      const day = dayById.get(assignment.dayId);

      return day === undefined
        ? []
        : [
            {
              workDate: day.workDate,
              position: assignment.position,
              label: rowLabel(assignment),
              minutes: shiftMinutes(day),
            },
          ];
    })
    .sort((left, right) => left.workDate.localeCompare(right.workDate));

  return {
    days: rows,
    totalMinutes: rows.reduce((sum, row) => sum + row.minutes, 0),
    totalCount: rows.length,
  };
}

function rowLabel(assignment: WorkAssignment): string {
  return assignment.kind === TRAINING_KIND
    ? `${assignment.position} 교육`
    : assignment.position;
}
