import type {
  AttendanceMonth,
  WorkMonth,
} from "@/features/stats/api/useStatsQueries";
import {
  computeWorkTotals,
  workInputsOf,
} from "@/features/stats/model/work-totals";
import type { AttendanceTab } from "@/screens/admin-stats/model/attendance-rows";

/**
 * 통계 화면이 읽어 온 열두 달을 추이 그래프가 먹는 값으로 옮긴다. 정본은
 * `docs/2-design/system/screens/stats.md`의 「추이 그래프」다.
 *
 * **값이 없는 달은 키가 없다.** 0으로 이으면 그 달에 아무도 안 일했다는 뜻이 되는데,
 * 실제로는 아직 근무표를 안 연 달이다 — 그래프는 그 달의 점을 안 찍는다.
 *
 * **출근율은 인증이 실제로 몇 번 돌았나다.** 출근을 출근·지각·결근·출근 인정의 합으로
 * 나누고, 출근 인정은 분모에만 든다(ATT-023).
 */

/** 값을 못 구한 자리에 서는 글자다. 「0」이 아니다 — 0은 셈이 끝난 값이다. */
export const NO_VALUE = "–";

const PERCENT = 100;

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
      const rate = attendanceRate(tabs.get(one.month));

      return rate === null ? [] : [[one.month, rate] as [string, number]];
    }),
  );
}

export function attendanceRate(tab: AttendanceTab | undefined): number | null {
  if (tab === undefined) {
    return null;
  }

  const { present, late, absent, excused } = tab.tally;
  const counted = present + late + absent + excused;

  return counted === 0 ? null : Math.round((present / counted) * PERCENT);
}

export function percentLabel(tab: AttendanceTab): string {
  const rate = attendanceRate(tab);

  return rate === null ? NO_VALUE : `${rate}%`;
}
