// 구현 대상: src/features/stats/api/queries.ts
//
// useWorkMonths(client, months) — 근무 탭의 열두 달 창을 읽는 훅이다. 달마다
// getMonthSchedule을 부르고(['schedule', 'YYYY-MM']) 달치를 useQueries로
// 나란히 읽는다(plan stats-admin AC-03「달마다 키를 읽어 더한다」).
//
// useAttendanceMonths(client, months) — 근태 탭의 열두 달 창이다. 근무 탭과 같은
// getMonthSchedule 열둘에 getMonthAttendance(['attendance', 'YYYY-MM']) 열둘이
// 더 붙는다 — 그달 배정·날 시각이 attendance-inputs.ts의 재료라서다.
//
// **결과가 달별로 구분돼 돌아온다.** useScheduleMonths·usePayrollMonths는
// flatMap으로 여러 달의 행을 하나의 배열로 뭉갠다. 이 훅은 그러면 안 된다 —
// 추이 그래프가 「몇 월이 비었나」를 알아야 해서, data는 달 수만큼의 길이고
// 항목마다 그 달의 month가 붙는다.

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/get-month-schedule", () => ({
  getMonthSchedule: getMonthScheduleMock,
}));

const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/attendance/dals/get-month-attendance",
  () => ({
    getMonthAttendance: getMonthAttendanceMock,
  }),
  { virtual: true },
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useWorkMonths, useAttendanceMonths } =
  await import("@/features/stats/api/queries");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper };
}

const FAKE_CLIENT = {} as never;

function daysFor(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `day-${index}`,
    work_date: "2026-09-01",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    assignments: [],
  }));
}

const TWELVE_MONTHS = Array.from(
  { length: 12 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

beforeEach(() => {
  getMonthScheduleMock.mockReset();
  getMonthAttendanceMock.mockReset();
});

describe("useWorkMonths — 근무 탭은 달마다 getMonthSchedule만 부른다", () => {
  it("열두 달이면 getMonthSchedule이 정확히 12번, getMonthAttendance는 0번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonths(FAKE_CLIENT, TWELVE_MONTHS),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
    expect(getMonthAttendanceMock).toHaveBeenCalledTimes(0);
  });
});

describe("useAttendanceMonths — 근태 탭은 schedule 열둘과 attendance 열둘, 스물넷을 부른다", () => {
  it("열두 달이면 getMonthSchedule 12번, getMonthAttendance 12번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockImplementation(async () => ({
      checkIns: [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonths(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
    expect(getMonthAttendanceMock).toHaveBeenCalledTimes(12);
    expect(
      getMonthScheduleMock.mock.calls.length +
        getMonthAttendanceMock.mock.calls.length,
    ).toBe(24);
  });
});

describe("useWorkMonths — 결과가 달마다 구분돼 돌아온다(flatMap으로 뭉개지 않는다)", () => {
  it("한 달은 사흘치, 한 달은 빈 달이어도 data 길이가 달 수(2)와 같다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) =>
      month === "2026-08" ? daysFor(3) : daysFor(0),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonths(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      month: "2026-08",
      days: expect.arrayContaining([expect.anything()]),
    });
    expect(result.current.data?.[0]?.days).toHaveLength(3);
    expect(result.current.data?.[1]).toEqual({ month: "2026-09", days: [] });
  });
});

describe("useAttendanceMonths — 결과가 달마다 구분돼 돌아온다", () => {
  it("달마다 attendance 값이 따로 붙고 서로 안 섞인다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockImplementation(async (_client, month) => ({
      checkIns: month === "2026-08" ? [{ id: "c1" }, { id: "c2" }] : [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonths(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.month).toBe("2026-08");
    expect(result.current.data?.[0]?.attendance.checkIns).toHaveLength(2);
    expect(result.current.data?.[1]?.month).toBe("2026-09");
    expect(result.current.data?.[1]?.attendance.checkIns).toHaveLength(0);
  });
});
