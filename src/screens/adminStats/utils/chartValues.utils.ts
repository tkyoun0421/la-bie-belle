import { NO_VALUE } from "@/shared/consts/noValue.const";
import { attendanceRate } from "@/entities/attendance/utils/attendanceSummary.utils";
import type { WorkMonth } from "@/entities/schedule/services/useWorkMonthsQuery";
import {
  computeWorkTotals,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";
import type { AttendanceMonth } from "@/features/stats/services/useAttendanceMonthsQuery";
import type { AttendanceTab } from "@/screens/adminStats/model/adminStats.type";

export function workValues(
  loaded: WorkMonth[] | undefined,
): Map<string, number> {
  return new Map(
    (loaded ?? [])
      .filter((one) => one.days.length > 0)
      .map((one) => {
        const inputs = workInputsOf(one.days);

        return [
          one.month,
          computeWorkTotals(inputs.assignments, inputs.days).totalMinutes,
        ];
      }),
  );
}

export function attendanceValues(
  loaded: AttendanceMonth[] | undefined,
  tabs: ReadonlyMap<string, AttendanceTab>,
): Map<string, number> {
  return new Map(
    (loaded ?? []).flatMap((one) => {
      const rate = attendanceRate(tabs.get(one.month)?.tally);

      return rate === null ? [] : [[one.month, rate] as [string, number]];
    }),
  );
}

export function percentLabel(tab: AttendanceTab): string {
  const rate = attendanceRate(tab.tally);

  return rate === null ? NO_VALUE : `${rate}%`;
}
