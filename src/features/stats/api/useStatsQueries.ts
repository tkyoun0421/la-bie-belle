import { useQueries, useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import { getMonthAttendance } from "@/entities/attendance/dals/get-month-attendance";
import type { MonthAttendance } from "@/entities/attendance/dals/get-month-attendance";
import {
  firstScheduleMonthKey,
  getFirstScheduleMonth,
} from "@/entities/schedule/dals/get-first-schedule-month";
import { getMonthSchedule } from "@/entities/schedule/dals/get-month-schedule";
import type { ScheduleDay } from "@/entities/schedule/dals/get-month-schedule";

/**
 * 통계가 여는 열두 달 창이다. 근무 탭은 `['schedule', 'YYYY-MM']` 열둘, 근태 탭은 거기에
 * `['attendance', 'YYYY-MM']` 열둘이 더 붙어 스물넷이다(plan stats-admin AC-03).
 *
 * **새 키를 안 만드는 것이 이 방식의 값이다.** 근무표·급여 화면이 이미 읽어둔 달은 캐시에서
 * 오고, 그쪽 무효화가 이 화면에도 그대로 걸린다(`docs/2-design/system/runtime.md`의 「읽기
 * 범위」).
 *
 * **달을 뭉개지 않는다.** `useScheduleMonths`·`usePayrollMonths`는 여러 달의 행을 한 배열로
 * 이어 붙이는데, 추이 그래프는 「몇 월이 비었나」를 알아야 해서 달마다 한 칸으로 온다 —
 * 값이 없는 달과 0인 달이 여기서 갈린다.
 *
 * **하나라도 안 오면 로딩이다.** 달 하나가 빠진 채 그리면 그 달만 값이 없는 것으로 읽혀
 * 「앱을 쓰기 전 달」과 구별되지 않는다.
 *
 * 키 문자열을 여기 다시 적은 것은 슬라이스끼리 서로를 못 불러서다(lint 규칙 3) — 정본은
 * 코드가 아니라 runtime.md의 「TanStack Query 규칙」이다.
 */

const SCHEDULE_KEY = "schedule";

const ATTENDANCE_KEY = "attendance";

export type WorkMonth = {
  month: string;
  days: ScheduleDay[];
};

export type AttendanceMonth = {
  month: string;
  days: ScheduleDay[];
  attendance: MonthAttendance;
};

export type MonthsResult<Loaded> = {
  data: Loaded[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

type QueryResult = {
  data: unknown;
  isPending: boolean;
  error: Error | null;
};

export function useWorkMonths(
  client: Db,
  months: readonly string[],
): MonthsResult<WorkMonth> {
  return useQueries({
    queries: months.map((month) => ({
      queryKey: [SCHEDULE_KEY, month],
      queryFn: () => getMonthSchedule(client, month),
    })),
    combine: (results): MonthsResult<WorkMonth> =>
      combineMonths(results, months, (at) => ({
        month: months[at],
        days: results[at].data ?? [],
      })),
  });
}

export function useAttendanceMonths(
  client: Db,
  months: readonly string[],
): MonthsResult<AttendanceMonth> {
  return useQueries({
    queries: [
      ...months.map((month) => ({
        queryKey: [SCHEDULE_KEY, month],
        queryFn: () => getMonthSchedule(client, month),
      })),
      ...months.map((month) => ({
        queryKey: [ATTENDANCE_KEY, month],
        queryFn: () => getMonthAttendance(client, month),
      })),
    ],
    combine: (results): MonthsResult<AttendanceMonth> =>
      combineMonths(results, months, (at) => ({
        month: months[at],
        days: (results[at].data ?? []) as ScheduleDay[],
        attendance: (results[months.length + at].data ?? {
          checkIns: [],
          excuseStatuses: [],
        }) as MonthAttendance,
      })),
  });
}

/**
 * 달 줄이 뒤로 갈 수 있는 바닥이다. 홀 하나뿐이라 달을 옮겨도 다시 안 읽는다 — 키가 달을 안
 * 물고(`['schedule', 'first-month']`) 근무표를 만드는 판정이 `['schedule']`을 통째로 낡게
 * 해서 새 달이 생기면 저절로 따라온다.
 */
export function useFirstScheduleMonth(client: Db) {
  return useQuery({
    queryKey: firstScheduleMonthKey(),
    queryFn: () => getFirstScheduleMonth(client),
  });
}

/**
 * 결과 배열을 달 수만큼의 칸으로 접는다. 근태 탭은 달 하나가 질의 둘이라 칸과 질의가 일대일이
 * 아니고, 그 대응을 아는 것은 부르는 쪽이라 칸 만드는 손을 받아 쓴다.
 */
function combineMonths<Loaded>(
  results: readonly QueryResult[],
  months: readonly string[],
  monthAt: (at: number) => Loaded,
): MonthsResult<Loaded> {
  const loaded = results.every((result) => result.data !== undefined);

  return {
    data: loaded ? months.map((_month, at) => monthAt(at)) : undefined,
    isLoading: results.some((result) => result.isPending),
    error: results.find((result) => result.error !== null)?.error ?? null,
  };
}
