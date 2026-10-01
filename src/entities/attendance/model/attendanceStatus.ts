import {
  CHECK_IN_WINDOW_LEAD_MINUTES,
  EXCUSE_DEADLINE_HOURS,
  LATE_THRESHOLD_MINUTES,
} from "@/entities/attendance/model/constants";

export type AttendanceStatus =
  "unmarked" | "present" | "late" | "pending" | "excused" | "absent";

export type CheckInRecord = {
  checkedAt: string;
  reportedAt: string;
  receivedAt: string;
};

export type ExcuseDecision = "approved" | "rejected";

export type ExcuseStatusRecord = {
  submittedAt: string;
  decidedAt: string | null;
  decision: ExcuseDecision | null;
};

export type AttendanceStatusInput = {
  workDate: string;
  startsAt: string;
  endsAt: string;
  checkIn: CheckInRecord | null;
  excuses: ExcuseStatusRecord[];
  now: string;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const KST_OFFSET = "+09:00";

function kstInstant(workDate: string, timeOfDay: string): number {
  return Date.parse(`${workDate}T${timeOfDay}${KST_OFFSET}`);
}

export function checkInWindowOpensAt(input: AttendanceStatusInput): number {
  return (
    kstInstant(input.workDate, input.startsAt) -
    CHECK_IN_WINDOW_LEAD_MINUTES * MINUTE_MS
  );
}

export function excuseDeadlineAt(input: AttendanceStatusInput): number {
  return (
    kstInstant(input.workDate, input.endsAt) + EXCUSE_DEADLINE_HOURS * HOUR_MS
  );
}

function isApproved(excuse: ExcuseStatusRecord): boolean {
  return excuse.decision === "approved";
}

function isUndecided(excuse: ExcuseStatusRecord): boolean {
  return excuse.decidedAt === null;
}

export function getAttendanceStatus(
  input: AttendanceStatusInput,
): AttendanceStatus | null {
  const now = Date.parse(input.now);

  if (now < checkInWindowOpensAt(input)) {
    return null;
  }

  if (input.checkIn !== null) {
    const lateAfter =
      kstInstant(input.workDate, input.startsAt) +
      LATE_THRESHOLD_MINUTES * MINUTE_MS;

    return Date.parse(input.checkIn.checkedAt) > lateAfter ? "late" : "present";
  }

  if (input.excuses.some(isApproved)) {
    return "excused";
  }

  if (input.excuses.some(isUndecided)) {
    return "pending";
  }

  return now > excuseDeadlineAt(input) ? "absent" : "unmarked";
}
