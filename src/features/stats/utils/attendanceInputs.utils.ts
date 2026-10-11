import { groupBy } from "@/shared/utils/collect";
import type {
  AttendanceStatusInput,
  CheckIn,
  ExcuseStatus,
} from "@/entities/attendance/model/attendance.type";
import type {
  ScheduleAssignment,
  ScheduleDay,
} from "@/entities/schedule/model/schedule.type";

export type AttendanceInputAssignment = Pick<
  ScheduleAssignment,
  "profileId" | "endedAt"
>;

export type AttendanceInputDay = Pick<
  ScheduleDay,
  "id" | "workDate" | "startsAt" | "endsAt"
> & {
  assignments: readonly AttendanceInputAssignment[];
};

export type AttendanceInputCheckIn = Pick<
  CheckIn,
  "dayId" | "profileId" | "checkedAt" | "reportedAt" | "receivedAt"
>;

export type AttendanceInputExcuseStatus = Pick<
  ExcuseStatus,
  "dayId" | "profileId" | "submittedAt" | "decidedAt" | "decision"
>;

export function buildAttendanceInputs(
  days: readonly AttendanceInputDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): AttendanceStatusInput[] {
  const checkInAt = new Map(
    checkIns.map((checkIn) => [
      pairKey(checkIn.dayId, checkIn.profileId),
      checkIn,
    ]),
  );
  const excusesAt = groupBy(excuseStatuses, (excuse) =>
    pairKey(excuse.dayId, excuse.profileId),
  );

  return days.flatMap((day) =>
    day.assignments
      .filter((assignment) => assignment.endedAt === null)
      .map((assignment) => {
        const key = pairKey(day.id, assignment.profileId);

        return {
          workDate: day.workDate,
          startsAt: day.startsAt,
          endsAt: day.endsAt,
          checkIn: checkInAt.get(key) ?? null,
          excuses: excusesAt.get(key) ?? [],
          now,
        };
      }),
  );
}

export function daysOfPerson(
  days: readonly AttendanceInputDay[],
  profileId: string | null,
): AttendanceInputDay[] {
  return profileId === null
    ? []
    : days.map((day) => ({
        ...day,
        assignments: day.assignments.filter(
          (assignment) => assignment.profileId === profileId,
        ),
      }));
}

function pairKey(dayId: string, profileId: string): string {
  return `${dayId} ${profileId}`;
}
