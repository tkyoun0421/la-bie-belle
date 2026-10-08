import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";
import { tallyMonthlyAttendance } from "@/entities/attendance/utils/attendanceSummary.utils";
import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import {
  buildAttendanceInputs,
  daysOfPerson,
  type AttendanceInputCheckIn,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";
import type {
  AttendanceRow,
  AttendanceTab,
} from "@/screens/adminStats/model/adminStats.type";

const KOREAN = "ko";

export type AttendanceRowInput = {
  profileId: string;
  displayName: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
};

export function buildAttendanceRows(
  people: readonly AttendanceRowInput[],
): AttendanceRow[] {
  return [...people]
    .sort((left, right) =>
      left.displayName.localeCompare(right.displayName, KOREAN),
    )
    .map((person) => ({
      profileId: person.profileId,
      displayName: person.displayName,
      present: person.present,
      late: orNothing(person.late),
      absent: orNothing(person.absent),
      excused: orNothing(person.excused),
    }));
}

function orNothing(count: number): number | null {
  return count === 0 ? null : count;
}

export function buildAttendanceTab(
  days: readonly ScheduleDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): AttendanceTab {
  const names = new Map<string, string>();

  for (const day of days) {
    for (const assignment of day.assignments) {
      if (assignment.ended_at === null) {
        names.set(
          assignment.profile_id,
          assignment.profiles?.display_name ?? "",
        );
      }
    }
  }

  const rows = buildAttendanceRows(
    [...names].map(([profileId, displayName]) => ({
      profileId,
      displayName,
      ...tallyMonthlyAttendance(
        buildAttendanceInputs(
          daysOfPerson(days, profileId),
          checkIns,
          excuseStatuses,
          now,
        ),
      ),
    })),
  );

  return { tally: sumTallies(rows), rows };
}

export function attendanceRowValue(row: AttendanceRow): string {
  return [
    `출근 ${row.present}`,
    row.late === null ? null : `지각 ${row.late}`,
    row.excused === null ? null : `출근 인정 ${row.excused}`,
    row.absent === null ? null : `결근 ${row.absent}`,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");
}

function sumTallies(rows: readonly AttendanceRow[]): MonthlyAttendanceTally {
  return rows.reduce<MonthlyAttendanceTally>(
    (total, row) => ({
      present: total.present + row.present,
      late: total.late + (row.late ?? 0),
      absent: total.absent + (row.absent ?? 0),
      excused: total.excused + (row.excused ?? 0),
    }),
    { present: 0, late: 0, absent: 0, excused: 0 },
  );
}
