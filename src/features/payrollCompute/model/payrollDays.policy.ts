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
import type { DayKind } from "@/entities/payroll/model/payroll.type";
import { wageAt, type WageRate } from "@/entities/payroll/model/wageAt.policy";
import {
  rehearsalHours,
  type RehearsalClock,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import { paidMinutes } from "@/features/payrollCompute/model/paidMinutes.policy";

export type PayrollWorkDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
};

export type PayrollAssignment = {
  day_id: string;
};

export type PayrollAdjustment = {
  day_id: string;
  minutes: number;
  adjusted_at: string;
};

export type PayrollCheckIn = {
  day_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type PayrollExcuse = {
  day_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

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

export type PayrollDayKind = DayKind | "wage-pending";

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
    submittedAt: excuse.submitted_at,
    decidedAt: excuse.decided_at,
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

  const checkIn = input.checkIns.find((row) => row.day_id === day.id) ?? null;

  return (
    getAttendanceStatus({
      workDate: day.work_date,
      startsAt: day.starts_at,
      endsAt: day.ends_at,
      checkIn:
        checkIn === null
          ? null
          : {
              checkedAt: checkIn.checked_at,
              reportedAt: checkIn.reported_at,
              receivedAt: checkIn.received_at,
            },
      excuses: input.excuses
        .filter((row) => row.day_id === day.id)
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
    day === null
      ? []
      : input.assignments.filter((row) => row.day_id === day.id);

  if (day !== null && isAbsent(input, day, assignments)) {
    return { date, ...ABSENT };
  }

  const minutes = paidMinutes({
    assignments,
    day,
    adjustments:
      day === null
        ? []
        : input.adjustments.filter((row) => row.day_id === day.id),
    rehearsals: input.rehearsals.filter((row) => row.workDate === date),
  });

  const wage = wageAt(input.rates, date);

  return wage === null
    ? { date, minutes, amount: 0, kind: "wage-pending" }
    : { date, ...dayAmount({ minutes, wage }) };
}

export function payrollDays(input: PayrollDaysInput): PayrollDay[] {
  const dayById = new Map(input.days.map((day) => [day.id, day]));
  const dayByDate = new Map(input.days.map((day) => [day.work_date, day]));
  const dates = new Set<string>();

  for (const row of [...input.assignments, ...input.adjustments]) {
    const day = dayById.get(row.day_id);

    if (day !== undefined) {
      dates.add(day.work_date);
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
  rates: readonly (WageRate & { profile_id: string })[];
  adjustments: readonly (PayrollAdjustment & { profile_id: string })[];
  excuses: readonly (PayrollExcuse & { profile_id: string })[];
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

function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

function mine<Row extends { profile_id: string }>(
  rows: readonly Row[],
  profileId: string,
): Row[] {
  return rows.filter((row) => row.profile_id === profileId);
}

function myAssignment(day: ScheduleDay, profileId: string) {
  return (
    day.assignments.find(
      (assignment) =>
        assignment.profile_id === profileId && assignment.ended_at === null,
    ) ?? null
  );
}

function myCheckIn(day: ScheduleDay, profileId: string): CheckInRecord | null {
  const row = day.check_ins.find((check) => check.profile_id === profileId);

  return row === undefined
    ? null
    : {
        checkedAt: row.checked_at,
        reportedAt: row.reported_at,
        receivedAt: row.received_at,
      };
}

export function payrollViewDays(source: PayrollViewSource): PayrollViewDay[] {
  const { profileId, now } = source;
  const myExcuses = mine(source.excuses, profileId);
  const dayByDate = new Map(source.days.map((day) => [day.work_date, day]));

  const computed = payrollDays({
    days: source.days.map((day) => ({
      id: day.id,
      work_date: day.work_date,
      starts_at: day.starts_at,
      ends_at: day.ends_at,
    })),
    assignments: source.days.flatMap((day) =>
      myAssignment(day, profileId) === null ? [] : [{ day_id: day.id }],
    ),
    adjustments: mine(source.adjustments, profileId),
    checkIns: source.days.flatMap((day) =>
      mine(day.check_ins, profileId).map((row) => ({
        day_id: day.id,
        checked_at: row.checked_at,
        reported_at: row.reported_at,
        received_at: row.received_at,
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
          : clockLabel(scheduled.starts_at),
      endsAt:
        scheduled === null || assignment === null
          ? null
          : clockLabel(scheduled.ends_at),
      isEducation: assignment !== null && assignment.kind === EDUCATION_KIND,
      overtimeMinutes: Math.max(0, day.minutes - REGULAR_MINUTES),
      rehearsalMinutes: source.rehearsals
        .filter((row) => row.workDate === day.date)
        .reduce((sum, row) => sum + rehearsalHours(row), 0),
      attendance:
        scheduled === null || assignment === null
          ? null
          : {
              workDate: scheduled.work_date,
              startsAt: scheduled.starts_at,
              endsAt: scheduled.ends_at,
              checkIn: myCheckIn(scheduled, profileId),
              excuses: myExcuses
                .filter((row) => row.day_id === scheduled.id)
                .map(excuseRecord),
              now,
            },
    };
  });
}
