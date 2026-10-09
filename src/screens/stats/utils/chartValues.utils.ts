import { monthIn } from "@/shared/utils/monthIn";
import { attendanceRate } from "@/entities/attendance/utils/attendanceSummary.utils";
import type { PayrollMonth } from "@/entities/payroll/model/payroll.type";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import type { WorkMonth } from "@/entities/schedule/services/useWorkMonthsQuery";
import { payrollViewDays } from "@/features/payrollCompute/model/payrollDays.policy";
import type { PayrollViewDay } from "@/features/payrollCompute/model/payrollDays.policy";
import { workInputsOf } from "@/features/stats/model/workTotals.policy";
import type { AttendanceMonth } from "@/features/stats/services/useAttendanceMonthsQuery";
import { computeMyWorkTotals } from "@/features/stats/utils/myTotals.utils";
import { MONTH_LENGTH } from "@/screens/stats/consts/stats.const";
import { myAttendanceTally } from "@/screens/stats/utils/attendanceTally.utils";

export type PayrollMonthWithDays = {
  month: string;
  days: readonly ScheduleDay[];
  payroll: PayrollMonth;
};

export function joinPayrollByMonth(
  work: readonly WorkMonth[] | undefined,
  payroll: readonly { month: string; payroll: PayrollMonth }[] | undefined,
): PayrollMonthWithDays[] | undefined {
  if (work === undefined || payroll === undefined) {
    return undefined;
  }

  const daysByMonth = new Map(work.map((one) => [one.month, one.days]));

  return payroll.map((one) => ({
    month: one.month,
    days: daysByMonth.get(one.month) ?? [],
    payroll: one.payroll,
  }));
}

export function myWorkValues(
  loaded: readonly WorkMonth[] | undefined,
  profileId: string,
): Map<string, number> {
  return new Map(
    (loaded ?? [])
      .filter((one) => one.days.length > 0)
      .map((one) => {
        const inputs = workInputsOf(one.days);

        return [
          one.month,
          computeMyWorkTotals(inputs.assignments, inputs.days, profileId)
            .totalMinutes,
        ];
      }),
  );
}

export function myAttendanceValues(
  loaded: readonly AttendanceMonth[] | undefined,
  profileId: string,
  now: string,
): Map<string, number> {
  return new Map(
    (loaded ?? []).flatMap((one) => {
      const rate = attendanceRate(
        myAttendanceTally(
          one.days,
          one.attendance.checkIns,
          one.attendance.excuseStatuses,
          profileId,
          now,
        ),
      );

      return rate === null ? [] : [[one.month, rate] as [string, number]];
    }),
  );
}

export function myPayrollValues(
  loaded: readonly PayrollMonthWithDays[] | undefined,
  profileId: string,
  now: string,
  rehearsals: readonly Rehearsal[],
): Map<string, number> {
  return new Map(
    (loaded ?? []).flatMap((one) => {
      const days = myPayrollDaysOfMonth(
        loaded,
        one.month,
        profileId,
        now,
        rehearsals,
      );

      return one.days.length === 0 && days.length === 0
        ? []
        : [
            [one.month, days.reduce((sum, day) => sum + day.amount, 0)] as [
              string,
              number,
            ],
          ];
    }),
  );
}

export function myPayrollDaysOfMonth(
  loaded: readonly PayrollMonthWithDays[] | undefined,
  month: string,
  profileId: string | null,
  now: string,
  rehearsals: readonly Rehearsal[],
): PayrollViewDay[] {
  const one = monthIn(loaded, month);

  if (one === undefined || profileId === null) {
    return [];
  }

  return payrollViewDays({
    profileId,
    days: one.days,
    rates: one.payroll.wageRates,
    adjustments: one.payroll.adjustments,
    excuses: one.payroll.excuseStatus,
    rehearsals,
    now,
  }).filter((day) => day.date.slice(0, MONTH_LENGTH) === month);
}
