import { clockOf } from "@/shared/utils/kstDate";
import type {
  AttendanceStatusInput,
  CheckInRecord,
  ExcuseDecision,
  ExcuseStatusRecord,
} from "@/entities/attendance/model/attendance.type";
import { getAttendanceStatus } from "@/entities/attendance/model/attendanceStatus.policy";
import { REGULAR_MINUTES } from "@/entities/payroll/consts/payroll.const";
import {
  dayAmount,
  type DayAmount,
} from "@/entities/payroll/model/dayAmount.policy";
import type {
  Adjustment,
  ExcuseStatus,
  PayrollDayKind,
  WageRate,
} from "@/entities/payroll/model/payroll.type";
import { wageAt } from "@/entities/payroll/model/wageAt.policy";
import {
  rehearsalHours,
  type RehearsalClock,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import type {
  ScheduleCheckIn,
  ScheduleDay,
} from "@/entities/schedule/model/schedule.type";
import { paidMinutes } from "@/features/payrollCompute/model/paidMinutes.policy";

export type PayrollWorkDay = Pick<
  ScheduleDay,
  "id" | "workDate" | "startsAt" | "endsAt"
>;

export type PayrollAssignment = {
  dayId: string;
};

export type PayrollAdjustment = Pick<
  Adjustment,
  "dayId" | "minutes" | "adjustedAt"
>;

export type PayrollCheckIn = Pick<
  ScheduleCheckIn,
  "checkedAt" | "reportedAt" | "receivedAt"
> & {
  dayId: string;
};

export type PayrollExcuse = Pick<
  ExcuseStatus,
  "dayId" | "submittedAt" | "decidedAt" | "decision"
>;

export type PayrollRehearsal = RehearsalClock & {
  workDate: string;
};

export type PayrollDaysInput = {
  days: readonly PayrollWorkDay[];
  assignments: readonly PayrollAssignment[];
  adjustments: readonly PayrollAdjustment[];
  checkIns: readonly PayrollCheckIn[];
  excuses: readonly PayrollExcuse[];
  rehearsals: readonly PayrollRehearsal[];
  rates: readonly WageRate[];
  now: string;
};

export type PayrollDay = Omit<DayAmount, "kind"> & {
  date: string;
  kind: PayrollDayKind;
};

const ABSENT: DayAmount = { minutes: 0, amount: 0, kind: "absent" };

function decisionOf(decision: string | null): ExcuseDecision | null {
  return decision === "approved" || decision === "rejected" ? decision : null;
}

function excuseRecord(excuse: PayrollExcuse): ExcuseStatusRecord {
  return {
    submittedAt: excuse.submittedAt,
    decidedAt: excuse.decidedAt,
    decision: decisionOf(excuse.decision),
  };
}

function isAbsent(
  input: PayrollDaysInput,
  day: PayrollWorkDay,
  assignments: readonly PayrollAssignment[],
): boolean {
  if (assignments.length === 0) {
    return false;
  }

  const checkIn = input.checkIns.find((row) => row.dayId === day.id) ?? null;

  return (
    getAttendanceStatus({
      workDate: day.workDate,
      startsAt: day.startsAt,
      endsAt: day.endsAt,
      checkIn:
        checkIn === null
          ? null
          : {
              checkedAt: checkIn.checkedAt,
              reportedAt: checkIn.reportedAt,
              receivedAt: checkIn.receivedAt,
            },
      excuses: input.excuses
        .filter((row) => row.dayId === day.id)
        .map(excuseRecord),
      now: input.now,
    }) === "absent"
  );
}

function payrollDate(
  input: PayrollDaysInput,
  dayByDate: ReadonlyMap<string, PayrollWorkDay>,
  date: string,
): PayrollDay {
  const day = dayByDate.get(date) ?? null;
  const assignments =
    day === null ? [] : input.assignments.filter((row) => row.dayId === day.id);

  if (day !== null && isAbsent(input, day, assignments)) {
    return { date, ...ABSENT };
  }

  const minutes = paidMinutes({
    assignments,
    day,
    adjustments:
      day === null
        ? []
        : input.adjustments.filter((row) => row.dayId === day.id),
    rehearsals: input.rehearsals.filter((row) => row.workDate === date),
  });

  const wage = wageAt(input.rates, date);

  return wage === null
    ? { date, minutes, amount: 0, kind: "wage-pending" }
    : { date, ...dayAmount({ minutes, wage }) };
}

export function payrollDays(input: PayrollDaysInput): PayrollDay[] {
  const dayById = new Map(input.days.map((day) => [day.id, day]));
  const dayByDate = new Map(input.days.map((day) => [day.workDate, day]));
  const dates = new Set<string>();

  const touchedDayIds = [
    ...input.assignments.map((row) => row.dayId),
    ...input.adjustments.map((row) => row.dayId),
  ];

  for (const dayId of touchedDayIds) {
    const day = dayById.get(dayId);

    if (day !== undefined) {
      dates.add(day.workDate);
    }
  }

  for (const rehearsal of input.rehearsals) {
    dates.add(rehearsal.workDate);
  }

  return [...dates].sort().map((date) => payrollDate(input, dayByDate, date));
}

export type PayrollViewSource = {
  profileId: string;
  days: readonly ScheduleDay[];
  rates: readonly (WageRate & { profileId: string })[];
  adjustments: readonly (PayrollAdjustment & { profileId: string })[];
  excuses: readonly (PayrollExcuse & { profileId: string })[];
  rehearsals: readonly PayrollRehearsal[];
  now: string;
};

export type PayrollViewDay = PayrollDay & {
  position: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isEducation: boolean;
  overtimeMinutes: number;
  rehearsalMinutes: number;
  attendance: AttendanceStatusInput | null;
};

const EDUCATION_KIND = "training";

function mine<Row extends { profileId: string }>(
  rows: readonly Row[],
  profileId: string,
): Row[] {
  return rows.filter((row) => row.profileId === profileId);
}

function myAssignment(day: ScheduleDay, profileId: string) {
  return (
    day.assignments.find(
      (assignment) =>
        assignment.profileId === profileId && assignment.endedAt === null,
    ) ?? null
  );
}

function myCheckIn(day: ScheduleDay, profileId: string): CheckInRecord | null {
  const row = day.checkIns.find((check) => check.profileId === profileId);

  return row === undefined
    ? null
    : {
        checkedAt: row.checkedAt,
        reportedAt: row.reportedAt,
        receivedAt: row.receivedAt,
      };
}

export function payrollViewDays(source: PayrollViewSource): PayrollViewDay[] {
  const { profileId, now } = source;
  const myExcuses = mine(source.excuses, profileId);
  const dayByDate = new Map(source.days.map((day) => [day.workDate, day]));

  const computed = payrollDays({
    days: source.days.map((day) => ({
      id: day.id,
      workDate: day.workDate,
      startsAt: day.startsAt,
      endsAt: day.endsAt,
    })),
    assignments: source.days.flatMap((day) =>
      myAssignment(day, profileId) === null ? [] : [{ dayId: day.id }],
    ),
    adjustments: mine(source.adjustments, profileId),
    checkIns: source.days.flatMap((day) =>
      day.checkIns
        .filter((row) => row.profileId === profileId)
        .map((row) => ({
          dayId: day.id,
          checkedAt: row.checkedAt,
          reportedAt: row.reportedAt,
          receivedAt: row.receivedAt,
        })),
    ),
    excuses: myExcuses,
    rehearsals: source.rehearsals,
    rates: mine(source.rates, profileId),
    now,
  });

  return computed.map((day) => {
    const scheduled = dayByDate.get(day.date) ?? null;
    const assignment =
      scheduled === null ? null : myAssignment(scheduled, profileId);

    return {
      ...day,
      position: assignment === null ? null : assignment.position,
      startsAt:
        scheduled === null || assignment === null
          ? null
          : clockOf(scheduled.startsAt),
      endsAt:
        scheduled === null || assignment === null
          ? null
          : clockOf(scheduled.endsAt),
      isEducation: assignment !== null && assignment.kind === EDUCATION_KIND,
      overtimeMinutes: Math.max(0, day.minutes - REGULAR_MINUTES),
      rehearsalMinutes: source.rehearsals
        .filter((row) => row.workDate === day.date)
        .reduce((sum, row) => sum + rehearsalHours(row), 0),
      attendance:
        scheduled === null || assignment === null
          ? null
          : {
              workDate: scheduled.workDate,
              startsAt: scheduled.startsAt,
              endsAt: scheduled.endsAt,
              checkIn: myCheckIn(scheduled, profileId),
              excuses: myExcuses
                .filter((row) => row.dayId === scheduled.id)
                .map(excuseRecord),
              now,
            },
    };
  });
}
