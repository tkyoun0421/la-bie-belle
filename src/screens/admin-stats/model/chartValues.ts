import { NO_VALUE } from "@/shared/lib/noValue";
import { attendanceRate } from "@/entities/attendance/model/attendanceSummary";
import type {
  AttendanceMonth,
  WorkMonth,
} from "@/features/stats/api/useStatsQueries";
import {
  computeWorkTotals,
  workInputsOf,
} from "@/features/stats/model/workTotals";
import type { AttendanceTab } from "@/screens/admin-stats/model/attendanceRows";

/**
 * 통계 화면이 읽어 온 열두 달을 추이 그래프가 먹는 값으로 옮긴다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「추이 그래프」다.
 *
 * **값이 없는 달은 키가 없다.** 0으로 이으면 그 달에 아무도 안 일했다는 뜻이 되는데,
 * 실제로는 아직 근무표를 안 연 달이다 — 그래프는 그 달의 점을 안 찍는다.
 *
 * **출근율 공식은 `entities/attendance`가 든다.** 근무자 통계가 같은 공식을 쓰는데 다른
 * 슬라이스라 여기 두면 못 부른다(plan stats-worker AC-01).
 */

export function monthIn<Loaded extends { month: string }>(
  loaded: Loaded[] | undefined,
  month: string,
): Loaded | undefined {
  return loaded?.find((one) => one.month === month);
}

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
