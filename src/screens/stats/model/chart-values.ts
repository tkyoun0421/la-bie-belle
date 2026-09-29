import { attendanceRate } from "@/entities/attendance/model/attendance-summary";
import type { PayrollMonth } from "@/entities/payroll/dals/get-payroll-month";
import type { Rehearsal } from "@/entities/rehearsal/dals/get-my-rehearsals";
import type { ScheduleDay } from "@/entities/schedule/dals/get-month-schedule";
import { payrollViewDays } from "@/features/payroll/model/payroll-days";
import type { PayrollViewDay } from "@/features/payroll/model/payroll-days";
import type {
  AttendanceMonth,
  WorkMonth,
} from "@/features/stats/api/useStatsQueries";
import { computeMyWorkTotals } from "@/features/stats/model/my-totals";
import { workInputsOf } from "@/features/stats/model/work-totals";
import { myAttendanceTally } from "@/screens/stats/model/attendance-tally";

/**
 * 근무자 통계가 읽어 온 열두 달을 추이 그래프가 먹는 값으로 옮긴다. 탭이 셋이라 값도 셋이다 —
 * 근태는 내 출근율, 포지션은 내 근무 분 합, 급여는 내 급여 합이다
 * (`docs/2-design/system/screens/stats.md`의 「추이 그래프」).
 *
 * **값이 없는 달은 키가 없다.** 0으로 이으면 그 달에 내가 안 일했다는 뜻이 되는데, 실제로는 아직
 * 근무표를 안 연 달이다 — 그래프는 그 달의 점을 안 찍는다. 세어 봤더니 0인 달은 0으로 남는다.
 *
 * **어느 셈도 여기서 새로 짜지 않는다.** 근무 시간은 `computeMyWorkTotals`, 근태 판정은
 * `myAttendanceTally`, 금액은 `payrollViewDays`가 낸다 —
 * 여기가 하는 일은 달마다 그 함수를 한 번씩 돌려 값을 모으는 것뿐이다(plan stats-worker AC-01).
 */

export type PayrollByMonth = {
  month: string;
  days: readonly ScheduleDay[];
  payroll: PayrollMonth;
};

const MONTH_LENGTH = 7;

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

/**
 * 그달 내 급여 합이다. 관리자 통계에 금액 축이 없어 견줄 짝이 없는 값이다.
 *
 * **리허설이 달마다 안 갈린다.** 화면이 `useRehearsalMonths`가 뭉쳐 준 열두 달치를 통째로
 * 넘기고(`PayrollScreen.tsx`가 앞서 밟은 길), `payrollViewDays`가 `work_date`로 날에 도로
 * 맞춘다 — 리허설도 급여에 든다(PAY-028). 그래서 8월 달을 셀 때도 9월 리허설이 결과에 끼어들 수
 * 있어 그 달 날짜로 한 번 더 거른다.
 *
 * **빈 달이 두 조건의 OR다.** 근무표가 열린 달이거나, 근무표는 없어도 그 달에 급여로 잡을 날이
 * 있는 달이다 — 리허설은 근무표가 없는 달에도 행이 선다(SCH-022).
 */
export function myPayrollValues(
  loaded: readonly PayrollByMonth[] | undefined,
  profileId: string,
  now: string,
  rehearsals: readonly Rehearsal[],
): Map<string, number> {
  return new Map(
    (loaded ?? []).flatMap((one) => {
      const days = myPayrollDays(one, profileId, now, rehearsals);

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

/** 그 달에 실제로 서는 내 급여 날들이다 — 금액도 건수도 시간도 이 목록에서 나온다. */
function myPayrollDays(
  one: PayrollByMonth,
  profileId: string,
  now: string,
  rehearsals: readonly Rehearsal[],
): PayrollViewDay[] {
  return payrollViewDays({
    profileId,
    days: one.days,
    rates: one.payroll.wageRates,
    adjustments: one.payroll.adjustments,
    excuses: one.payroll.excuseStatus,
    rehearsals,
    now,
  }).filter((day) => day.date.slice(0, MONTH_LENGTH) === one.month);
}
