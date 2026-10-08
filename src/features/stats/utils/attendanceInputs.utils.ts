import type {
  AttendanceStatusInput,
  CheckIn,
  ExcuseStatus,
  ExcuseStatusRecord,
} from "@/entities/attendance/model/attendance.type";

export type AttendanceInputAssignment = {
  profile_id: string;
  ended_at: string | null;
};

export type AttendanceInputDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
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
  const excusesAt = new Map<string, ExcuseStatusRecord[]>();

  for (const excuse of excuseStatuses) {
    const key = pairKey(excuse.dayId, excuse.profileId);
    const here = excusesAt.get(key) ?? [];

    here.push(excuse);
    excusesAt.set(key, here);
  }

  return days.flatMap((day) =>
    day.assignments
      .filter((assignment) => assignment.ended_at === null)
      .map((assignment) => {
        const key = pairKey(day.id, assignment.profile_id);

        return {
          workDate: day.work_date,
          startsAt: day.starts_at,
          endsAt: day.ends_at,
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
          (assignment) => assignment.profile_id === profileId,
        ),
      }));
}

function pairKey(dayId: string, profileId: string): string {
  return `${dayId} ${profileId}`;
}
