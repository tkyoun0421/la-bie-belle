import { EXCUSE_DECISIONS } from "@/entities/attendance/consts/attendance.const";
import type {
  AttendanceStatusInput,
  ExcuseDecision,
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

export type AttendanceInputCheckIn = {
  day_id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type AttendanceInputExcuseStatus = {
  day_id: string;
  profile_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

export function buildAttendanceInputs(
  days: readonly AttendanceInputDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): AttendanceStatusInput[] {
  const checkInAt = new Map(
    checkIns.map((checkIn) => [
      pairKey(checkIn.day_id, checkIn.profile_id),
      checkIn,
    ]),
  );
  const excusesAt = new Map<string, ExcuseStatusRecord[]>();

  for (const excuse of excuseStatuses) {
    const key = pairKey(excuse.day_id, excuse.profile_id);
    const here = excusesAt.get(key) ?? [];

    here.push({
      submittedAt: excuse.submitted_at,
      decidedAt: excuse.decided_at,
      decision: decisionOf(excuse.decision),
    });
    excusesAt.set(key, here);
  }

  return days.flatMap((day) =>
    day.assignments
      .filter((assignment) => assignment.ended_at === null)
      .map((assignment) => {
        const key = pairKey(day.id, assignment.profile_id);
        const checkIn = checkInAt.get(key);

        return {
          workDate: day.work_date,
          startsAt: day.starts_at,
          endsAt: day.ends_at,
          checkIn:
            checkIn === undefined
              ? null
              : {
                  checkedAt: checkIn.checked_at,
                  reportedAt: checkIn.reported_at,
                  receivedAt: checkIn.received_at,
                },
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

function decisionOf(decision: string | null): ExcuseDecision | null {
  return decision !== null &&
    (EXCUSE_DECISIONS as readonly string[]).includes(decision)
    ? (decision as ExcuseDecision)
    : null;
}
