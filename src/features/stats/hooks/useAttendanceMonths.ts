import { useMemo } from "react";
import type { DB } from "@/shared/api/database";
import type { MonthsResult } from "@/shared/api/monthsQuery";
import type { MonthAttendance } from "@/entities/attendance/api/getMonthAttendance.api";
import { useMonthsAttendanceQuery } from "@/entities/attendance/services/useMonthsAttendanceQuery";
import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import { useWorkMonthsQuery } from "@/entities/schedule/services/useWorkMonthsQuery";

/**
 * 근태 탭의 열두 달 창이다. 달 하나에 배정과 체크인 둘이 필요하고(`attendanceInputs.ts`의
 * 재료) 그 둘은 `entities`의 다른 슬라이스다 — 같은 층끼리는 서로를 못 불러서, 두 쿼리 훅을
 * 불러 달마다 맞추는 일이 위층인 여기로 온다.
 *
 * **제 질의를 안 연다.** 키도 `queryFn`도 아래층 둘의 것이라 통계 탭이 근무표·근태 화면의
 * 캐시를 그대로 나눠 쓰고, 그쪽 무효화가 이 화면에도 걸린다.
 *
 * **한쪽만 와 있으면 로딩이다.** 근태만 온 채 그리면 그 달의 배정이 0으로 읽혀 「앱을 쓰기
 * 전 달」과 구별되지 않는다.
 */

export type AttendanceMonth = {
  month: string;
  days: ScheduleDay[];
  attendance: MonthAttendance;
};

export function useAttendanceMonths(
  client: DB,
  months: readonly string[],
): MonthsResult<AttendanceMonth> {
  const work = useWorkMonthsQuery(client, months);
  const attendance = useMonthsAttendanceQuery(client, months);

  const workMonths = work.data;
  const attendanceMonths = attendance.data;

  return useMemo(
    () => ({
      data:
        workMonths && attendanceMonths
          ? workMonths.map((workMonth, at) => ({
              month: workMonth.month,
              days: workMonth.days,
              attendance: attendanceMonths[at].attendance,
            }))
          : undefined,
      isLoading: work.isLoading || attendance.isLoading,
      error: work.error ?? attendance.error,
    }),
    [
      workMonths,
      attendanceMonths,
      work.isLoading,
      work.error,
      attendance.isLoading,
      attendance.error,
    ],
  );
}
