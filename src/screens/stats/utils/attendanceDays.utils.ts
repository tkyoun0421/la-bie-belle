import { kstClockOf, spellDate } from "@/shared/utils/kstDate";
import type { AttendanceStatus } from "@/entities/attendance/model/attendance.type";
import { getAttendanceStatus } from "@/entities/attendance/model/attendanceStatus.policy";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import {
  buildAttendanceInputs,
  type AttendanceInputCheckIn,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";
import { STATUS_LABELS } from "@/screens/stats/consts/stats.const";

const TRAINING_KIND = "training";

export type MyAttendanceDay = {
  workDate: string;
  position: string;
  isEducation: boolean;
  status: AttendanceStatus;
  checkedAt: string | null;
};

export type MyAttendanceRow = {
  title: string;
  subtitle: string;
  value: string;
};

export function buildMyAttendanceDays(
  profileId: string,
  days: readonly ScheduleDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): MyAttendanceDay[] {
  const mine = days.flatMap((day) => {
    const assignment = day.assignments.find(
      (row) => row.profileId === profileId && row.endedAt === null,
    );

    return assignment === undefined ? [] : [{ day, assignment }];
  });

  const inputs = buildAttendanceInputs(
    mine.map(({ day, assignment }) => ({
      id: day.id,
      workDate: day.workDate,
      startsAt: day.startsAt,
      endsAt: day.endsAt,
      assignments: [assignment],
    })),
    checkIns,
    excuseStatuses,
    now,
  );

  return mine
    .flatMap(({ day, assignment }, at) => {
      const status = getAttendanceStatus(inputs[at]);

      return status === null
        ? []
        : [
            {
              workDate: day.workDate,
              position: assignment.position,
              isEducation: assignment.kind === TRAINING_KIND,
              status,
              checkedAt:
                checkIns.find(
                  (checkIn) =>
                    checkIn.dayId === day.id && checkIn.profileId === profileId,
                )?.checkedAt ?? null,
            },
          ];
    })
    .sort((left, right) => left.workDate.localeCompare(right.workDate));
}

export function myAttendanceRow(day: MyAttendanceDay): MyAttendanceRow {
  const status = STATUS_LABELS[day.status];

  return {
    title: spellDate(day.workDate),
    subtitle: day.isEducation ? `${day.position} 교육` : day.position,
    value:
      day.checkedAt === null
        ? status
        : `${status} · ${checkedTimeLabel(day.checkedAt)}`,
  };
}

export function checkedTimeLabel(checkedAt: string): string {
  return kstClockOf(checkedAt);
}
